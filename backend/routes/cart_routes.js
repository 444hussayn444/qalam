import { Router } from "express";
import {
  get_cart,
  add_to_cart,
  remove_from_cart,
  update_cart_quantity,
  reset_cart,
} from "../controllers/cart_controllers.js";
import { verifyUserToken } from "../middleware/userAuth.js";

const router = Router();

// .***. Cart routes .***.
router.get("/cart/:userId", verifyUserToken, get_cart);
router.post("/cart/add", verifyUserToken, add_to_cart);
router.post("/cart/remove", verifyUserToken, remove_from_cart);
router.put("/cart/update", verifyUserToken, update_cart_quantity);
router.delete("/cart/reset", verifyUserToken, reset_cart);

export default router;
