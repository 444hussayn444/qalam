import db_connection from "../../db/mongoose.js";

export async function withDBConnection(callback) {
  await db_connection();
  return callback();
}
