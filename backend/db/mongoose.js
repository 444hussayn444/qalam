import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(root, "../.env") });
let connectionPromise;

export default function db_connection() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  console.log("[MongoDB] URI exists:", !!process.env.MONGODB_URI);
  console.log(
    "[MongoDB] URI host:",
    process.env.MONGODB_URI
      ? new URL(process.env.MONGODB_URI).hostname
      : "MISSING",
  );
  console.log("[MongoDB] DB name:", process.env.MONGODB_DB_NAME || "qalam");
  if (!connectionPromise)
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DB_NAME || "qalam",
        serverSelectionTimeoutMS: 30000,
        family: 4,
      })
      .then(async (connection) => {
        try {
          await connection.connection.db
            .collection("orders")
            .dropIndex("stripe_session_id_1");
        } catch (error) {
          if (
            error.codeName !== "IndexNotFound" &&
            error.codeName !== "NamespaceNotFound"
          )
            throw error;
        }
        return connection;
      });
  return connectionPromise;
}

export async function closeDatabase() {
  await mongoose.disconnect();
  connectionPromise = undefined;
}
