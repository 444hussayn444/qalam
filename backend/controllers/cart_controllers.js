import { randomUUID } from "crypto";
import db_connection from "../db/mongoose.js";
import { Cart, Product } from "../db/models.js";
async function cartFor(userId) {
  const rows = await Cart.find({ user_id: userId })
    .sort({ created_at: 1 })
    .lean();
  const products = await Product.find({
    id: { $in: rows.map((row) => row.product_id) },
  }).lean();
  const byId = new Map(products.map((product) => [product.id, product]));
  return rows.map((row) => ({ ...row, ...(byId.get(row.product_id) || {}) }));
}
export async function get_cart(req, res) {
  try {
    await db_connection();
    return res.json({ success: true, data: await cartFor(req.user.id) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function add_to_cart(req, res) {
  try {
    await db_connection();
    const { productId, quantity = 1 } = req.body;
    if (!productId || !Number.isInteger(quantity) || quantity < 1)
      return res
        .status(400)
        .json({ message: "Product ID and positive quantity are required" });
    if (!(await Product.exists({ id: productId })))
      return res.status(404).json({ message: "Product not found" });
    await Cart.findOneAndUpdate(
      { user_id: req.user.id, product_id: productId },
      {
        $inc: { quantity },
        $setOnInsert: { id: randomUUID(), created_at: new Date() },
      },
      { upsert: true },
    );
    return res.json({
      success: true,
      message: "Product added to cart",
      data: await cartFor(req.user.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function remove_from_cart(req, res) {
  try {
    await db_connection();
    await Cart.deleteOne({
      user_id: req.user.id,
      product_id: req.body.productId,
    });
    return res.json({
      success: true,
      message: "Product removed from cart",
      data: await cartFor(req.user.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function update_cart_quantity(req, res) {
  try {
    await db_connection();
    const { productId, quantity } = req.body;
    if (!productId || !Number.isInteger(quantity))
      return res
        .status(400)
        .json({ message: "Product ID and quantity are required" });
    if (quantity <= 0)
      await Cart.deleteOne({ user_id: req.user.id, product_id: productId });
    else
      await Cart.updateOne(
        { user_id: req.user.id, product_id: productId },
        { $set: { quantity } },
      );
    return res.json({
      success: true,
      message: "Cart updated",
      data: await cartFor(req.user.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function reset_cart(req, res) {
  try {
    await db_connection();
    await Cart.deleteMany({ user_id: req.user.id });
    return res.json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
