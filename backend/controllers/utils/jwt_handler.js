import jwt from "jsonwebtoken";

// Creating jwt signed with user id and optional additional data
export async function create_jwt(payload) {
  const secretKey = process.env.SECRET_KEY || process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error("JWT secret is not configured");
  }
  const token = jwt.sign(payload, secretKey, {
    expiresIn: "7d",
  });
  return token;
}

// Get the jwt from the headers

export async function get_jwt(req, res) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(400).json({ Er: "NOT_A_VALID_TOKEN" });
  }
  const token = auth.split("Bearer ")[1];
  await verify_jwt(token, res);
  return token;
}

// Verifying the jwt

export async function verify_jwt(token, res) {
  if (!token) {
    return res.status(400).json({ Er: "NOT_A_VALID_TOKEN" });
  }
  const secretKey = process.env.SECRET_KEY || process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error("JWT secret is not configured");
  }
  const decoded = await jwt.verify(token, secretKey);
  return decoded;
}
