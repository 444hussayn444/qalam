import { randomUUID } from "crypto";
import db_connection from "../db/mongoose.js";
import {
  Cart,
  Order,
  OrderItem,
  PayPalWebhookEvent,
  Product,
} from "../db/models.js";

function paypalBaseUrl() {
  const environment = process.env.PAYPAL_ENVIRONMENT?.toLowerCase();
  return ["live", "production"].includes(environment)
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function requirePayPalConfig(requireWebhook = false) {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET)
    throw new Error("PayPal credentials are not configured");
  if (!process.env.FRONTEND_URL)
    throw new Error("FRONTEND_URL is not configured");
  if (requireWebhook && !process.env.PAYPAL_WEBHOOK_ID)
    throw new Error("PAYPAL_WEBHOOK_ID is not configured");
}

async function accessToken() {
  requirePayPalConfig();
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok)
    throw new Error(`PayPal authentication failed (${response.status})`);
  return (await response.json()).access_token;
}

async function paypalRequest(path, options = {}) {
  const response = await fetch(`${paypalBaseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data.message || `PayPal request failed (${response.status})`,
    );
    error.status = response.status;
    error.details = data.details;
    error.debugId = data.debug_id;
    throw error;
  }
  return data;
}

async function cartSnapshot(userId) {
  const cart = await Cart.find({ user_id: userId })
    .sort({ created_at: 1 })
    .lean();
  if (!cart.length)
    throw Object.assign(new Error("Your cart is empty"), { status: 400 });
  const products = await Product.find({
    id: { $in: cart.map((item) => item.product_id) },
  }).lean();
  const byId = new Map(products.map((product) => [product.id, product]));
  const items = cart.map((item) => {
    const product = byId.get(item.product_id);
    if (!product || !Number.isFinite(product.price) || product.price < 0)
      throw Object.assign(new Error("A product in your cart is unavailable"), {
        status: 400,
      });
    return {
      product_id: product.id,
      title: product.title || "Product",
      quantity: item.quantity,
      price: product.price,
    };
  });
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return { items, total: total.toFixed(2) };
}

export async function create_paypal_order(req, res) {
  try {
    await db_connection();
    const snapshot = await cartSnapshot(req.user.id);
    const orderId = randomUUID();
    const paypalOrder = await paypalRequest("/v2/checkout/orders", {
      method: "POST",
      headers: { "PayPal-Request-Id": orderId },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderId,
            amount: {
              currency_code: "USD",
              value: snapshot.total,
              breakdown: {
                item_total: { currency_code: "USD", value: snapshot.total },
              },
            },
            items: snapshot.items.map((item) => ({
              name: item.title,
              quantity: String(item.quantity),
              unit_amount: {
                currency_code: "USD",
                value: Number(item.price).toFixed(2),
              },
            })),
          },
        ],
        application_context: {
          brand_name: process.env.PAYPAL_BRAND_NAME || "Qalam",
          user_action: "PAY_NOW",
          return_url: `${process.env.FRONTEND_URL}/order-success?orderId=${orderId}`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout?payment=cancelled`,
        },
      }),
    });
    await Order.create({
      id: orderId,
      user_id: req.user.id,
      payment_order_uuid: paypalOrder.id,
      total_amount: Number(snapshot.total),
      status: "pending",
    });
    await OrderItem.insertMany(
      snapshot.items.map((item) => ({
        id: randomUUID(),
        order_id: orderId,
        ...item,
      })),
    );
    const approvalUrl = paypalOrder.links?.find(
      (link) => link.rel === "approve",
    )?.href;
    if (!approvalUrl) throw new Error("PayPal approval link was not returned");
    return res.status(201).json({ success: true, orderId, approvalUrl });
  } catch (error) {
    console.error(error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "SERVER_ERROR" });
  }
}

export async function capture_paypal_order(req, res) {
  try {
    await db_connection();
    const order = await Order.findOne({
      id: req.body.orderId,
      user_id: req.user.id,
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "paid") return res.json({ success: true, order });

    let paypalOrder = await paypalRequest(
      `/v2/checkout/orders/${order.payment_order_uuid}`,
    );
    let transaction = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0];
    let captureError;

    if (paypalOrder.status !== "COMPLETED") {
      try {
        paypalOrder = await paypalRequest(
          `/v2/checkout/orders/${order.payment_order_uuid}/capture`,
          {
            method: "POST",
            headers: { "PayPal-Request-Id": order.id },
            body: "{}",
          },
        );
        transaction = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0];
      } catch (error) {
        if (error.status !== 422) throw error;
        captureError = error;
        paypalOrder = await paypalRequest(
          `/v2/checkout/orders/${order.payment_order_uuid}`,
        );
        transaction = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0];
      }
    }

    if (
      paypalOrder.status !== "COMPLETED" ||
      transaction?.status !== "COMPLETED"
    )
      return res.status(402).json({
        message:
          captureError?.details?.[0]?.description ||
          captureError?.message ||
          "Payment was not completed",
        paypalStatus: paypalOrder.status,
        captureStatus: transaction?.status || null,
        paypalIssue: captureError?.details?.[0]?.issue || null,
        debugId: captureError?.debugId || null,
      });
    return res.json({
      success: true,
      pendingWebhook: true,
      message: "Payment captured. Waiting for PayPal webhook confirmation.",
      order,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "SERVER_ERROR" });
  }
}

export async function paypal_webhook(req, res) {
  const receivedAt = new Date();
  let event;
  try {
    requirePayPalConfig(true);
    if (!Buffer.isBuffer(req.body) || !req.body.length)
      return res.status(400).json({ message: "Webhook body is required" });
    event = JSON.parse(req.body.toString("utf8"));
    if (!event.id || !event.event_type)
      return res
        .status(400)
        .json({ message: "Webhook event ID and type are required" });
    console.info("PayPal webhook received", {
      eventId: event.id,
      eventType: event.event_type,
      receivedAt,
    });
    const requiredHeaders = [
      "paypal-transmission-id",
      "paypal-transmission-time",
      "paypal-cert-url",
      "paypal-auth-algo",
      "paypal-transmission-sig",
    ];
    const missingHeader = requiredHeaders.find(
      (header) => !req.headers[header],
    );
    if (missingHeader)
      return res
        .status(400)
        .json({ message: `Missing PayPal header: ${missingHeader}` });
    const verification = await paypalRequest(
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        body: JSON.stringify({
          auth_algo: req.headers["paypal-auth-algo"],
          cert_url: req.headers["paypal-cert-url"],
          transmission_id: req.headers["paypal-transmission-id"],
          transmission_sig: req.headers["paypal-transmission-sig"],
          transmission_time: req.headers["paypal-transmission-time"],
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: event,
        }),
      },
    );
    console.info("PayPal webhook verification", {
      eventId: event.id,
      eventType: event.event_type,
      result: verification.verification_status,
    });
    if (verification.verification_status !== "SUCCESS")
      return res
        .status(401)
        .json({ message: "Invalid PayPal webhook signature" });
    await db_connection();
    const now = new Date();
    let claimed;
    try {
      claimed = await PayPalWebhookEvent.create({
        event_id: event.id,
        event_type: event.event_type,
        status: "processing",
        locked_until: new Date(now.getTime() + 5 * 60 * 1000),
        received_at: receivedAt,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      claimed = await PayPalWebhookEvent.findOneAndUpdate(
        {
          event_id: event.id,
          $or: [
            { status: "failed" },
            { status: "processing", locked_until: { $lt: now } },
          ],
        },
        {
          $set: {
            status: "processing",
            locked_until: new Date(now.getTime() + 5 * 60 * 1000),
            error: undefined,
          },
        },
        { new: true },
      );
      if (!claimed) {
        console.info("PayPal webhook ignored as duplicate", {
          eventId: event.id,
        });
        return res.sendStatus(200);
      }
    }

    const paypalOrderId =
      event.resource?.supplementary_data?.related_ids?.order_id ||
      (event.event_type === "CHECKOUT.ORDER.APPROVED"
        ? event.resource?.id
        : null);
    const order = paypalOrderId
      ? await Order.findOne({ payment_order_uuid: paypalOrderId })
      : null;
    if (order) {
      const statusByEvent = {
        "PAYMENT.CAPTURE.COMPLETED": "paid",
        "PAYMENT.CAPTURE.PENDING": "pending",
        "PAYMENT.CAPTURE.DENIED": "denied",
        "CHECKOUT.ORDER.APPROVED": "approved",
      };
      const nextStatus = statusByEvent[event.event_type];
      if (nextStatus && !(order.status === "paid" && nextStatus !== "paid")) {
        order.status = nextStatus;
        order.payment_event_id = event.id;
        if (event.event_type.startsWith("PAYMENT.CAPTURE."))
          order.payment_transaction_uuid =
            event.resource?.id || order.payment_transaction_uuid;
        await order.save();
        if (nextStatus === "paid")
          await Cart.deleteMany({ user_id: order.user_id });
      }
    }
    await PayPalWebhookEvent.updateOne(
      { _id: claimed._id },
      {
        $set: {
          status: "processed",
          processed_at: new Date(),
          locked_until: null,
        },
      },
    );
    console.info("PayPal webhook processed", {
      eventId: event.id,
      eventType: event.event_type,
      orderId: paypalOrderId || null,
      matchedOrder: Boolean(order),
    });
    return res.sendStatus(200);
  } catch (error) {
    console.error("PayPal webhook error", {
      eventId: event?.id || null,
      eventType: event?.event_type || null,
      message: error.message,
    });
    if (event?.id) {
      await PayPalWebhookEvent.updateOne(
        { event_id: event.id, status: "processing" },
        { $set: { status: "failed", error: error.message } },
      ).catch(() => {});
    }
    return res
      .status(error.status && error.status < 500 ? error.status : 500)
      .json({
        message: error.message || "Webhook processing failed",
      });
  }
}
