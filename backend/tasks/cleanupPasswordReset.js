import db_connection from "../db/mongoose.js";
import { PasswordReset } from "../db/models.js";
await db_connection();
const result = await PasswordReset.deleteMany({
  expires_at: { $lt: new Date() },
});
console.log(`Deleted ${result.deletedCount} expired password reset tokens`);
process.exit(0);
