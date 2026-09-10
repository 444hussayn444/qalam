import db_connection from "../db/mongoose.js";
import { Order, OrderItem, Product } from "../db/models.js";

async function orderItems(orderId) {
  const items = await OrderItem.find({ order_id: orderId }).lean();
  const products = await Product.find({
    id: { $in: items.map((item) => item.product_id) },
  }).lean();
  const byId = new Map(products.map((product) => [product.id, product]));
  return items.map((item) => ({
    ...item,
    ...(byId.get(item.product_id) || {}),
  }));
}

export async function get_order(req, res) {
  try {
    await db_connection();
    const filter = req.user.isAdmin
      ? { id: req.params.orderId }
      : { id: req.params.orderId, user_id: req.user.id };
    const order = await Order.findOne(filter).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json({
      success: true,
      order,
      items: await orderItems(order.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}

export async function get_user_orders(req, res) {
  try {
    await db_connection();
    const userId = req.user.isAdmin ? req.params.userId : req.user.id;
    return res.json({
      success: true,
      orders: await Order.find({ user_id: userId })
        .sort({ created_at: -1 })
        .lean(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
