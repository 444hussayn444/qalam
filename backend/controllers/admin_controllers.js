import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { create_jwt } from "./utils/jwt_handler.js";
import db_connection from "../db/mongoose.js";
import {
  Admin,
  Category,
  Collection,
  Order,
  Product,
  User,
} from "../db/models.js";
import cache from "../utils/cache.js";
import { ensureDefaultCategories } from "../utils/category_seeder.js";
const root = path.dirname(fileURLToPath(import.meta.url));
const assetsRoot = path.join(root, "..", "assets");

function slugify(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || randomUUID()
  );
}

function parseDesignIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return String(value)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }
}

function parseDesignPrices(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function validateDesignSelection(designIds) {
  const uniqueIds = [...new Set(designIds)];
  const designs = uniqueIds.length
    ? await Product.find({ id: { $in: uniqueIds } }, "id price").lean()
    : [];
  if (designs.length !== uniqueIds.length)
    throw Object.assign(new Error("One or more designs were not found"), {
      status: 400,
    });
  return designs;
}

function priceUpdates(designIds, prices) {
  return designIds
    .map((id) => {
      const value = prices[id];
      if (value === undefined || value === "") return null;
      const price = Number(value);
      if (!Number.isFinite(price) || price < 0)
        throw Object.assign(
          new Error("Design prices must be valid non-negative numbers"),
          { status: 400 },
        );
      return { id, price };
    })
    .filter(Boolean);
}

function uploadedAssetPath(file) {
  return file?.path
    ? path.relative(assetsRoot, file.path).split(path.sep).join("/")
    : undefined;
}
export async function adminLogin(req, res) {
  try {
    await db_connection();
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username }).lean();
    if (
      !admin ||
      !password ||
      !(await bcrypt.compare(password, admin.password))
    )
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    return res.json({
      success: true,
      message: "Login successful",
      token: await create_jwt({ id: admin.id, isAdmin: true }),
      admin: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function getCategories(req, res) {
  try {
    await db_connection();
    await ensureDefaultCategories();
    return res.json({
      success: true,
      data: await Category.find().sort({ name: 1 }).lean(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function addCategory(req, res) {
  try {
    await db_connection();
    const { name, description } = req.body;
    const trimmed = name?.trim();
    if (!trimmed)
      return res.status(400).json({ message: "Category name is required" });
    const existing = await Category.findOne({
      name: {
        $regex: `^${trimmed}$`,
        $options: "i",
      },
    }).lean();
    if (existing)
      return res.status(409).json({ message: "Category already exists" });
    const category = await Category.create({
      id: randomUUID(),
      name: trimmed,
      description: description || "",
    });
    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: "Category already exists" });
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function getCollections(req, res) {
  try {
    await db_connection();
    const [collections, categories, designCounts] = await Promise.all([
      Collection.find().sort({ name: 1 }).lean(),
      Category.find().lean(),
      Product.aggregate([
        { $match: { collection_id: { $exists: true, $nin: [null, ""] } } },
        { $group: { _id: "$collection_id", count: { $sum: 1 } } },
      ]),
    ]);
    const categoryMap = new Map(categories.map((item) => [item.id, item.name]));
    const designCountMap = new Map(
      designCounts.map((item) => [item._id, item.count]),
    );
    return res.json({
      success: true,
      data: collections.map((col) => ({
        ...col,
        slug: col.slug || slugify(col.name),
        coverImage: col.coverImage || col.image || null,
        designCount: designCountMap.get(col.id) || 0,
        categoryName: categoryMap.get(col.category_id) || "Default",
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function addCollection(req, res) {
  try {
    await db_connection();
    const { name, description } = req.body;
    if (!name?.trim())
      return res.status(400).json({ message: "Collection name is required" });
    const designIds = [...new Set(parseDesignIds(req.body.designIds))];
    const slug = slugify(name);
    if (await Collection.exists({ slug }))
      return res
        .status(409)
        .json({ message: "Collection slug already exists" });
    await validateDesignSelection(designIds);
    const prices = parseDesignPrices(req.body.designPrices);
    const updates = priceUpdates(designIds, prices);
    const collection = await Collection.create({
      id: randomUUID(),
      name: name.trim(),
      slug,
      description: description || "",
      image: req.file?.filename || null,
      coverImage: req.file?.filename || null,
      asset_path: uploadedAssetPath(req.file),
    });
    if (designIds.length) {
      await Product.bulkWrite([
        ...designIds.map((id) => ({
          updateOne: {
            filter: { id },
            update: {
              $set: {
                collection_id: collection.id,
                collection: collection.name,
                product_type: "digital",
              },
            },
          },
        })),
        ...updates.map(({ id, price }) => ({
          updateOne: { filter: { id }, update: { $set: { price } } },
        })),
      ]);
    }
    return res.status(201).json({ success: true, data: collection });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: "Collection already exists" });
    console.error(error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "SERVER_ERROR" });
  }
}

export async function getCollection(req, res) {
  try {
    await db_connection();
    const collection = await Collection.findOne({ id: req.params.id }).lean();
    if (!collection)
      return res.status(404).json({ message: "Collection not found" });
    const designs = await Product.find({ collection_id: collection.id })
      .sort({ created_at: 1 })
      .lean();
    return res.json({
      success: true,
      data: { ...collection, designs, designCount: designs.length },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function addDesignsToCollection(req, res) {
  try {
    await db_connection();
    const collection = await Collection.findOne({ id: req.params.id }).lean();
    if (!collection)
      return res.status(404).json({ message: "Collection not found" });
    const designIds = [...new Set(parseDesignIds(req.body.designIds))];
    const prices = parseDesignPrices(req.body.designPrices);
    await validateDesignSelection(designIds);
    const updates = priceUpdates(designIds, prices);
    await Product.bulkWrite([
      ...designIds.map((id) => ({
        updateOne: {
          filter: { id },
          update: {
            $set: {
              collection_id: collection.id,
              collection: collection.name,
              product_type: "digital",
            },
          },
        },
      })),
      ...updates.map(({ id, price }) => ({
        updateOne: { filter: { id }, update: { $set: { price } } },
      })),
    ]);
    return res.json({ success: true, message: "Designs added to collection" });
  } catch (error) {
    console.error(error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "SERVER_ERROR" });
  }
}

export async function removeDesignFromCollection(req, res) {
  try {
    await db_connection();
    const result = await Product.updateOne(
      { id: req.params.designId, collection_id: req.params.id },
      { $unset: { collection_id: "", collection: "" } },
    );
    if (!result.matchedCount)
      return res
        .status(404)
        .json({ message: "Design is not in this collection" });
    return res.json({
      success: true,
      message: "Design removed from collection",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function deleteCollection(req, res) {
  try {
    await db_connection();
    const collection = await Collection.findOne({ id: req.params.id }).lean();
    if (!collection)
      return res.status(404).json({ message: "Collection not found" });

    await Product.updateMany(
      { collection_id: collection.id },
      { $unset: { collection_id: "", collection: "" } },
    );

    if (collection.asset_path) {
      const coverPath = path.join(assetsRoot, collection.asset_path);
      if (fs.existsSync(coverPath)) await fs.promises.unlink(coverPath);
    }

    await Collection.deleteOne({ id: collection.id });
    cache.flushAll();
    return res.json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function getDesigns(req, res) {
  try {
    await db_connection();
    await ensureDefaultCategories();
    const [products, categories, collections] = await Promise.all([
      Product.find().sort({ created_at: -1 }).lean(),
      Category.find().lean(),
      Collection.find().lean(),
    ]);
    const categoryNames = new Map(
      categories.map((item) => [item.id, item.name]),
    );
    const categoryNameToId = new Map(
      categories.map((item) => [item.name.toLowerCase(), item.id]),
    );
    const collectionNames = new Map(
      collections.map((item) => [item.id, item.name]),
    );
    return res.json({
      success: true,
      data: products.map((item) => {
        const resolvedCategoryName =
          categoryNames.get(item.category_id) || item.category || "Default";
        const resolvedCategoryId =
          item.category_id ||
          categoryNameToId.get(String(item.category || "").toLowerCase()) ||
          "";
        return {
          ...item,
          category_id: resolvedCategoryId,
          category: resolvedCategoryName,
          categoryName: resolvedCategoryName,
          collectionName:
            collectionNames.get(item.collection_id) || item.collection,
          price: Number(item.price) || 0,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function addProduct(req, res) {
  try {
    await db_connection();
    const {
      title,
      description,
      price,
      category,
      categoryId,
      collection,
      collectionId,
      stock,
    } = req.body;
    const isDigital = Boolean(collectionId?.trim());
    if (
      !title ||
      price === undefined ||
      (!category && !categoryId && !collectionId) ||
      !req.file
    )
      return res
        .status(400)
        .json({ message: "Title, price, and image are required" });

    if (isDigital && !(await Collection.exists({ id: collectionId.trim() })))
      return res.status(404).json({ message: "Collection not found" });

    let finalCategory;
    let finalCategoryId;
    if (!isDigital && categoryId) {
      const catDoc = await Category.findOne({ id: categoryId }).lean();
      if (!catDoc || catDoc.filter_only)
        return res.status(400).json({ message: "Choose a product category" });
      finalCategory = catDoc.name;
      finalCategoryId = catDoc.id;
    } else if (!isDigital && category) {
      const catDoc = await Category.findOne({
        name: { $regex: `^${category.trim()}$`, $options: "i" },
      }).lean();
      if (!catDoc || catDoc.filter_only)
        return res.status(400).json({ message: "Choose a product category" });
      finalCategory = catDoc.name;
      finalCategoryId = catDoc.id;
    }

    const product = await Product.create({
      id: randomUUID(),
      title: title.trim(),
      description: description || "",
      image: req.file.filename,
      category: finalCategory,
      category_id: finalCategoryId,
      collection: isDigital ? collection || undefined : undefined,
      collection_id: isDigital ? collectionId.trim() : undefined,
      product_type: isDigital ? "digital" : "physical",
      asset_path: uploadedAssetPath(req.file),
      price: Number(price),
      stock: stock === undefined ? 100 : Number(stock),
    });
    cache.flushAll();
    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: product.toObject(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function deleteProduct(req, res) {
  try {
    await db_connection();
    const product = await Product.findOne({ id: req.params.id }).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    const image = path.join(
      assetsRoot,
      product.asset_path || product.image || "",
    );
    if (product.image && fs.existsSync(image)) await fs.promises.unlink(image);
    await Product.deleteOne({ id: product.id });
    cache.flushAll();
    return res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function updateProduct(req, res) {
  try {
    await db_connection();
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ message: "Product not found" });
    const {
      title,
      description,
      price,
      category,
      categoryId,
      collection,
      collectionId,
      stock,
    } = req.body;
    const hasCollectionField = Object.prototype.hasOwnProperty.call(
      req.body,
      "collectionId",
    );
    const nextCollectionId = hasCollectionField
      ? collectionId?.trim()
      : product.collection_id;
    const isDigital = Boolean(nextCollectionId);
    const image = req.file?.filename;
    if (image && product.image) {
      const old = path.join(assetsRoot, product.asset_path || product.image);
      if (fs.existsSync(old)) await fs.promises.unlink(old);
    }

    if (isDigital && !(await Collection.exists({ id: nextCollectionId })))
      return res.status(404).json({ message: "Collection not found" });

    let finalCategory = product.category;
    let finalCategoryId = product.category_id;
    if (isDigital) {
      finalCategory = undefined;
      finalCategoryId = undefined;
    } else if (categoryId) {
      const catDoc = await Category.findOne({ id: categoryId }).lean();
      if (!catDoc || catDoc.filter_only)
        return res.status(400).json({ message: "Choose a product category" });
      finalCategory = catDoc.name;
      finalCategoryId = catDoc.id;
    } else if (category) {
      const catDoc = await Category.findOne({
        name: { $regex: `^${category.trim()}$`, $options: "i" },
      }).lean();
      if (!catDoc || catDoc.filter_only)
        return res.status(400).json({ message: "Choose a product category" });
      finalCategory = catDoc.name;
      finalCategoryId = catDoc.id;
    } else if (!finalCategoryId && !finalCategory) {
      return res.status(400).json({ message: "A category is required" });
    }

    Object.assign(product, {
      title: title ? title.trim() : product.title,
      description:
        description === undefined ? product.description : description,
      price: price === undefined ? product.price : Number(price),
      category: finalCategory,
      category_id: finalCategoryId,
      collection: isDigital ? collection || product.collection : undefined,
      collection_id: nextCollectionId || undefined,
      product_type: isDigital ? "digital" : "physical",
      image: image || product.image,
      asset_path: uploadedAssetPath(req.file) || product.asset_path,
      stock: stock === undefined ? product.stock : Number(stock),
    });
    await product.save();
    cache.flushAll();
    return res.json({
      success: true,
      message: "Product updated successfully",
      product: product.toObject(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function getCustomers(req, res) {
  try {
    await db_connection();
    return res.json({
      success: true,
      data: await User.find({}, "id username email phone address created_at")
        .sort({ created_at: -1 })
        .lean(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function getAllOrders(req, res) {
  try {
    await db_connection();
    const orders = await Order.find().sort({ created_at: -1 }).lean();
    const users = await User.find(
      { id: { $in: orders.map((order) => order.user_id) } },
      "id username email",
    ).lean();
    const byId = new Map(users.map((user) => [user.id, user]));
    return res.json({
      success: true,
      orders: orders.map((order) => ({
        ...order,
        ...(byId.get(order.user_id) || {}),
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
