import { Router } from "express";
import {
  get_order,
  get_user_orders,
} from "../controllers/payment_controllers.js";
import {
  verifyUserOrAdminToken,
  verifyUserToken,
} from "../middleware/userAuth.js";
import {
  capture_paypal_order,
  create_paypal_order,
} from "../controllers/paypal_controllers.js";

const router = Router();

// .***. Payment routes .***.
router.get("/orders/:orderId", verifyUserOrAdminToken, get_order);
router.get("/orders/user/:userId", verifyUserOrAdminToken, get_user_orders);
router.post("/paypal/orders", verifyUserToken, create_paypal_order);
router.post("/paypal/capture", verifyUserToken, capture_paypal_order);

export default router;
