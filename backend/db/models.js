import mongoose from "mongoose";
const { Schema } = mongoose;
const options = {
  versionKey: false,
  strict: false,
  suppressReservedKeysWarning: true,
};
const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    googleId: { type: String, unique: true, sparse: true, index: true },
    auth_provider: {
      type: String,
      enum: ["password", "google"],
      default: "password",
    },
    avatar: String,
    phone: String,
    address: String,
    created_at: { type: Date, default: Date.now },
  },
  options,
);
const adminSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  },
  options,
);
const productSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: String,
    description: String,
    image: String,
    category: String,
    category_id: String,
    collection: String,
    collection_id: String,
    product_type: {
      type: String,
      enum: ["physical", "digital"],
      default: "physical",
    },
    asset_path: String,
    price: Number,
    stock: { type: Number, default: 100 },
    low_stock_threshold: { type: Number, default: 10 },
    created_at: { type: Date, default: Date.now },
  },
  options,
);
const categorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    description: String,
    filter_only: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  options,
);
const collectionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true, index: true },
    description: String,
    image: String,
    coverImage: String,
    asset_path: String,
    category_id: { type: String, index: true },
    created_at: { type: Date, default: Date.now },
  },
  { ...options, timestamps: true },
);
collectionSchema.index({ name: 1, category_id: 1 }, { unique: true });
const otpSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    otp: String,
    created_at: { type: Date, default: Date.now, expires: 3600 },
  },
  options,
);
const cartSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, index: true },
    product_id: String,
    quantity: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now },
  },
  options,
);
cartSchema.index({ user_id: 1, product_id: 1 }, { unique: true });
const orderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, index: true },
    payment_order_uuid: { type: String, required: true, unique: true },
    payment_transaction_uuid: String,
    payment_event_id: String,
    total_amount: Number,
    status: { type: String, default: "pending" },
    created_at: { type: Date, default: Date.now },
  },
  options,
);
const orderItemSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    order_id: { type: String, index: true },
    product_id: String,
    quantity: Number,
    price: Number,
  },
  options,
);
const passwordResetSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    user_id: { type: String, index: true },
    email: String,
    token: { type: String, unique: true, index: true },
    expires_at: { type: Date, index: true },
    created_at: { type: Date, default: Date.now },
  },
  options,
);
const paypalWebhookEventSchema = new Schema(
  {
    event_id: { type: String, required: true, unique: true, index: true },
    event_type: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["processing", "processed", "failed"],
    },
    locked_until: Date,
    error: String,
    received_at: { type: Date, default: Date.now },
    processed_at: Date,
  },
  options,
);
export const User =
  mongoose.models.User || mongoose.model("User", userSchema, "users");
export const Admin =
  mongoose.models.Admin || mongoose.model("Admin", adminSchema, "admins");
export const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema, "products");
export const Category =
  mongoose.models.Category ||
  mongoose.model("Category", categorySchema, "categories");
export const Collection =
  mongoose.models.Collection ||
  mongoose.model("Collection", collectionSchema, "collections");
export const OTP =
  mongoose.models.OTP || mongoose.model("OTP", otpSchema, "OTP");
export const Cart =
  mongoose.models.Cart || mongoose.model("Cart", cartSchema, "cart");
export const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema, "orders");
export const OrderItem =
  mongoose.models.OrderItem ||
  mongoose.model("OrderItem", orderItemSchema, "order_items");
export const PasswordReset =
  mongoose.models.PasswordReset ||
  mongoose.model("PasswordReset", passwordResetSchema, "password_reset");
export const PayPalWebhookEvent =
  mongoose.models.PayPalWebhookEvent ||
  mongoose.model(
    "PayPalWebhookEvent",
    paypalWebhookEventSchema,
    "paypal_webhook_events",
  );
