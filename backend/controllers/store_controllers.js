import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import validator from "validator";
import { otp_sender, random_num } from "./utils/funcs.js";
import { create_jwt } from "./utils/jwt_handler.js";
import db_connection from "../db/mongoose.js";
import { Category, Collection, OTP, Product, User } from "../db/models.js";
import { ensureDefaultCategories } from "../utils/category_seeder.js";
const root = path.dirname(fileURLToPath(import.meta.url));

function collectionSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function get_products(req, res) {
  try {
    await db_connection();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );
    const totalProducts = await Product.countDocuments();
    const data = await Product.find()
      .sort({ created_at: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      limit,
      hasMore: page < Math.ceil(totalProducts / limit),
    };
    const response = { data, pagination };
    return res.json({ success: true, ...response, fromCache: false });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function get_product_by_id(req, res) {
  try {
    await db_connection();
    const product = await Product.findOne({ id: req.params.id }).lean();
    return product
      ? res.json({ success: true, data: product })
      : res.status(404).json({ message: "Product not found" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function get_categories(req, res) {
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

export async function get_collections(req, res) {
  try {
    await db_connection();
    const [collections, designCounts] = await Promise.all([
      Collection.find().sort({ name: 1 }).lean(),
      Product.aggregate([
        { $match: { collection_id: { $exists: true, $nin: [null, ""] } } },
        { $group: { _id: "$collection_id", count: { $sum: 1 } } },
      ]),
    ]);
    const designCountMap = new Map(
      designCounts.map((item) => [item._id, item.count]),
    );
    return res.json({
      success: true,
      data: collections.map((collection) => ({
        ...collection,
        slug: collection.slug || collectionSlug(collection.name),
        coverImage: collection.coverImage || collection.image || null,
        designCount: designCountMap.get(collection.id) || 0,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function get_collection_by_slug(req, res) {
  try {
    await db_connection();
    let collection = await Collection.findOne({
      $or: [{ slug: req.params.slug }, { id: req.params.slug }],
    }).lean();
    if (!collection) {
      const legacyCollections = await Collection.find().lean();
      collection = legacyCollections.find(
        (item) => collectionSlug(item.name) === req.params.slug,
      );
    }
    if (!collection)
      return res.status(404).json({ message: "Collection not found" });
    const designs = await Product.find({ collection_id: collection.id })
      .sort({ created_at: 1 })
      .lean();
    return res.json({
      success: true,
      data: {
        ...collection,
        slug: collection.slug || collectionSlug(collection.name),
        coverImage: collection.coverImage || collection.image || null,
        designs,
        designCount: designs.length,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function get_otp(req, res) {
  try {
    await db_connection();
    const { email, username } = req.body;
    if (!validator.isEmail(email || ""))
      return res.status(400).json({ message: "Please enter a valid email" });
    if (!username || username.trim().length < 5)
      return res
        .status(400)
        .json({ message: "Username must be at least 5 characters" });
    if (await User.exists({ username: username.trim() }))
      return res.status(409).json({ message: "Username already exists" });
    const otp = String(await random_num(6, 1, 9));
    const id = randomUUID();
    await otp_sender(email, otp);
    await OTP.create({ id, otp });
    return res.json({ message: "OTP sent!", id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function register_controller(req, res) {
  try {
    await db_connection();
    const { username, email, password, phone, address, otp, id } = req.body;
    if (!username || !email || !password || !phone || !address || !otp || !id)
      return res.status(400).json({ message: "Please fill all the fields" });
    if (username.length < 5 || !validator.isEmail(email) || password.length < 8)
      return res.status(400).json({ message: "Invalid registration details" });
    if (await User.exists({ email }))
      return res.status(400).json({ message: "Email already exists" });
    if (await User.exists({ username }))
      return res.status(409).json({ message: "Username already exists" });
    const record = await OTP.findOne({ id }).lean();
    if (!record || record.otp !== String(otp))
      return res.status(400).json({ message: "verification failed" });
    await User.create({
      id,
      username,
      email,
      password: await bcrypt.hash(password, 10),
      phone,
      address,
    });
    await OTP.deleteOne({ id });
    return res.json({
      success: true,
      message: "Registered Success",
      token: await create_jwt({ id }),
      username,
      email,
      userId: id,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      const message =
        duplicateField === "username"
          ? "Username already exists"
          : duplicateField === "email"
            ? "Email already exists"
            : "An account with these details already exists";
      return res.status(409).json({ message });
    }
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function login_controller(req, res) {
  try {
    await db_connection();
    const { email, password } = req.body;
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!password || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Wrong credentials" });
    return res.json({
      success: true,
      message: "Logged in successfully",
      token: await create_jwt({ id: user.id }),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function update_user(req, res) {
  try {
    await db_connection();
    const { username, email, phone, address } = req.body;
    if (!username || !validator.isEmail(email || ""))
      return res
        .status(400)
        .json({ message: "Valid username and email are required" });
    if (await User.exists({ email, id: { $ne: req.user.id } }))
      return res.status(400).json({ message: "Email already in use" });
    await User.updateOne(
      { id: req.user.id },
      {
        $set: {
          username,
          email,
          phone: phone || null,
          address: address || null,
        },
      },
    );
    return res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
