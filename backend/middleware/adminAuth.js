import jwt from "jsonwebtoken";

export function verifyAdminToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No authentication token provided" });
    }

    const secretKey = process.env.SECRET_KEY || process.env.JWT_SECRET;
    if (!secretKey) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Server configuration error: missing JWT secret",
        });
    }
    const decoded = jwt.verify(token, secretKey);
    if (!decoded.isAdmin) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          success: false,
          message: "Token expired. Please login again.",
        });
    }
    return res
      .status(401)
      .json({ success: false, message: "Invalid authentication token" });
  }
}
