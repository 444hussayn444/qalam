import jwt from "jsonwebtoken";
function verify(req, res, next, allowAdmin) {
  const [scheme, token] = req.headers.authorization?.split(" ") || [];
  if (scheme !== "Bearer" || !token)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  try {
    const decoded = jwt.verify(
      token,
      process.env.SECRET_KEY || process.env.JWT_SECRET,
    );
    const id = typeof decoded === "string" ? decoded : decoded.id;
    if (!id || (!allowAdmin && decoded.isAdmin))
      return res
        .status(403)
        .json({ success: false, message: "User access required" });
    req.user = { ...decoded, id };
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({
        success: false,
        message:
          error.name === "TokenExpiredError"
            ? "Token expired"
            : "Invalid authentication token",
      });
  }
}
export const verifyUserToken = (req, res, next) =>
  verify(req, res, next, false);
export const verifyUserOrAdminToken = (req, res, next) =>
  verify(req, res, next, true);
