import express from "express";
import {
  get_otp,
  register_controller,
  login_controller,
  update_user,
} from "../controllers/store_controllers.js";
import { get_jwt } from "../controllers/utils/jwt_handler.js";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/password_reset_controllers.js";
import { verifyUserToken } from "../middleware/userAuth.js";
import {
  startGoogleAuth,
  googleCallback,
} from "../controllers/google_auth_controllers.js";
export const a_router = express.Router();

a_router.post("/send-otp", get_otp);
a_router.post("/register", register_controller);
a_router.post("/login", login_controller);
a_router.put("/user/update", verifyUserToken, update_user);
a_router.post("/forgot-password", forgotPassword);
a_router.post("/reset-password", resetPassword);
a_router.get("/auth/google", startGoogleAuth);
a_router.get("/auth/google/callback", googleCallback);
