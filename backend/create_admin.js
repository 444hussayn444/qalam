import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import db_connection from "./db/mongoose.js";
import { Admin } from "./db/models.js";

const username = process.env.ADMIN_USERNAME || "admin";
if (!process.env.ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD is required");
await db_connection();
const existing = await Admin.findOne({ username });
if (existing) console.log("Admin already exists");
else {
  await Admin.create({
    id: randomUUID(),
    username,
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
  });
  console.log("Admin created");
}
process.exit(0);
