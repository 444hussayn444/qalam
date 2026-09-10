import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { sendEmail } from "./utils/funcs.js";
import db_connection from "../db/mongoose.js";
import { PasswordReset, User } from "../db/models.js";
export async function forgotPassword(req, res) {
  try {
    await db_connection();
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    const user = await User.findOne({ email }).lean();
    if (!user)
      return res.json({
        success: true,
        message: "If that email exists, a password reset link has been sent.",
      });
    const token = randomUUID();
    await PasswordReset.deleteMany({ user_id: user.id });
    await PasswordReset.create({
      id: randomUUID(),
      user_id: user.id,
      email,
      token,
      expires_at: new Date(Date.now() + 3600000),
    });
    await sendEmail(
      email,
      "Password Reset Request",
      `<h2>Password Reset Request</h2><p>Hi ${user.username},</p><p><a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Reset Password</a></p>`,
    );
    return res.json({
      success: true,
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
export async function resetPassword(req, res) {
  try {
    await db_connection();
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 8)
      return res
        .status(400)
        .json({
          message:
            "Valid token and password of at least 8 characters are required",
        });
    const reset = await PasswordReset.findOne({
      token,
      expires_at: { $gt: new Date() },
    }).lean();
    if (!reset)
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    await User.updateOne(
      { id: reset.user_id },
      { $set: { password: await bcrypt.hash(newPassword, 10) } },
    );
    await PasswordReset.deleteOne({ id: reset.id });
    return res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
}
