import db_connection from "../db/mongoose.js";
import { OTP } from "../db/models.js";
await db_connection();
const result = await OTP.deleteMany({
  created_at: { $lt: new Date(Date.now() - 3600000) },
});
console.log(`Deleted ${result.deletedCount} expired OTP entries`);
process.exit(0);
