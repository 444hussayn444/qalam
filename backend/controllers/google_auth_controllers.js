import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import db_connection from "../db/mongoose.js";
import { User } from "../db/models.js";
import { create_jwt } from "./utils/jwt_handler.js";

function oauthConfig() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } =
    process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL)
    throw new Error("Google OAuth is not configured");
  return { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL };
}

export function logGoogleOAuthConfig() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CALLBACK_URL, GOOGLE_CLIENT_SECRET } =
    process.env;
  console.log(
    `[Google OAuth] client_id=${GOOGLE_CLIENT_ID || "missing"} callback_url=${GOOGLE_CALLBACK_URL || "missing"}`,
  );
  const missing = [
    !GOOGLE_CLIENT_ID && "GOOGLE_CLIENT_ID",
    !GOOGLE_CLIENT_SECRET && "GOOGLE_CLIENT_SECRET",
    !GOOGLE_CALLBACK_URL && "GOOGLE_CALLBACK_URL",
  ].filter(Boolean);
  if (missing.length) {
    console.warn(`[Google OAuth] missing configuration: ${missing.join(", ")}`);
  }
}

function oauthClient() {
  const config = oauthConfig();
  return new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_CALLBACK_URL,
  );
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function redirectWithError(message) {
  return `${frontendUrl()}/login#google_error=${encodeURIComponent(message)}`;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    address: user.address,
    avatar: user.avatar,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function uniqueUsername(candidate, email) {
  const base =
    (candidate || email.split("@")[0])
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 24) || "googleuser";
  let username = base;
  let suffix = 1;
  while (await User.exists({ username })) {
    username = `${base}${suffix++}`.slice(0, 30);
  }
  return username;
}

export function startGoogleAuth(req, res) {
  try {
    const client = oauthClient();
    const state = jwt.sign(
      {
        purpose: "google-oauth",
        nonce: crypto.randomBytes(16).toString("hex"),
      },
      process.env.SECRET_KEY || process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );
    return res.redirect(
      client.generateAuthUrl({
        access_type: "online",
        scope: ["openid", "email", "profile"],
        state,
        prompt: "select_account",
      }),
    );
  } catch (error) {
    console.error("Google OAuth start failed:", error.message);
    return res.redirect(
      redirectWithError("Google authentication is unavailable"),
    );
  }
}

export async function googleCallback(req, res) {
  try {
    if (req.query.error)
      return res.redirect(
        redirectWithError("Google authentication was cancelled"),
      );
    const secret = process.env.SECRET_KEY || process.env.JWT_SECRET;
    const state = jwt.verify(String(req.query.state || ""), secret);
    if (state.purpose !== "google-oauth")
      throw new Error("Invalid OAuth state");

    const client = oauthClient();
    const { tokens } = await client.getToken(String(req.query.code || ""));
    if (!tokens.id_token)
      throw new Error("Google did not return an identity token");
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || profile.email_verified !== true)
      throw new Error("Google account email is not verified");

    await db_connection();
    const email = profile.email.toLowerCase();
    let user = await User.findOne({ googleId: profile.sub });
    if (!user) {
      user = await User.findOne({
        email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
      });
      if (user) {
        if (user.googleId && user.googleId !== profile.sub)
          throw new Error("This email is linked to another Google account");
        user.googleId = profile.sub;
        user.auth_provider = "google";
        if (!user.avatar && profile.picture) user.avatar = profile.picture;
        await user.save();
      }
    }

    if (!user) {
      const id = crypto.randomUUID();
      user = await User.create({
        id,
        username: await uniqueUsername(profile.name, email),
        email,
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
        googleId: profile.sub,
        auth_provider: "google",
        avatar: profile.picture || null,
        phone: null,
        address: null,
      });
    }

    const token = await create_jwt({ id: user.id });
    const userData = encodeURIComponent(JSON.stringify(publicUser(user)));
    return res.redirect(
      `${frontendUrl()}/login#token=${encodeURIComponent(token)}&user=${userData}`,
    );
  } catch (error) {
    console.error("Google OAuth callback failed:", error.message);
    return res.redirect(
      redirectWithError(error.message || "Google authentication failed"),
    );
  }
}
