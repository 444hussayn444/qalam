import { randomUUID } from "crypto";
import db_connection from "../db/mongoose.js";
import { Category, Collection, Product } from "../db/models.js";

export const DEFAULT_CATEGORIES = [
  {
    name: "ALL",
    description: "Show all physical products",
    filter_only: true,
  },
  {
    name: "LOGOS",
    description: "Brand logos, emblems, and visual identity graphics",
  },
  {
    name: "MEN",
    description: "Men's fashion and apparel designs",
  },
  {
    name: "T-SHIRTS",
    description: "Custom printed t-shirt artwork and apparel",
  },
  {
    name: "BANDS",
    description: "Band merch, music themes, and artist artwork",
  },
  {
    name: "SPECIAL",
    description: "Limited edition and special collection designs",
  },
];

const LEGACY_CATEGORY_NAMES = new Map([
  ["svglogos", "LOGOS"],
  ["logos", "LOGOS"],
  ["svgmen", "MEN"],
  ["men", "MEN"],
  ["women", "SPECIAL"],
  ["svgt-shirts", "T-SHIRTS"],
  ["t-shirts", "T-SHIRTS"],
  ["svgbands", "BANDS"],
  ["bands", "BANDS"],
  ["svgspecial", "SPECIAL"],
  ["special", "SPECIAL"],
]);

/**
 * Ensures all 6 default store categories exist in the database.
 * Preserves any existing categories and creates missing ones.
 */
export async function ensureDefaultCategories() {
  await db_connection();

  const existing = await Category.find().lean();
  const existingMap = new Map(
    existing.map((cat) => [cat.name.trim().toLowerCase(), cat]),
  );

  const created = [];
  for (const def of DEFAULT_CATEGORIES) {
    const key = def.name.trim().toLowerCase();
    if (!existingMap.has(key)) {
      const newCat = await Category.create({
        id: randomUUID(),
        name: def.name,
        description: def.description,
        filter_only: def.filter_only || false,
      });
      existingMap.set(key, newCat);
      created.push(newCat);
    }
  }

  for (const legacy of existing) {
    const targetName = LEGACY_CATEGORY_NAMES.get(
      legacy.name.trim().toLowerCase(),
    );
    if (!targetName || legacy.name === targetName) continue;
    const target = await Category.findOne({ name: targetName }).lean();
    if (target) {
      await Product.updateMany(
        { category_id: legacy.id },
        { $set: { category_id: target.id, category: target.name } },
      );
      await Collection.updateMany(
        { category_id: legacy.id },
        { $set: { category_id: target.id } },
      );
      await Category.deleteOne({ id: legacy.id });
    } else {
      await Category.updateOne(
        { id: legacy.id },
        { $set: { name: targetName } },
      );
    }
  }

  await Category.updateOne(
    { name: { $regex: "^ALL$", $options: "i" } },
    {
      $set: {
        name: "ALL",
        description: "Show all physical products",
        filter_only: true,
      },
    },
  );

  if (created.length > 0) {
    console.log(
      `[Seeder] Created ${created.length} default categories:`,
      created.map((c) => c.name),
    );
  }

  return await Category.find().sort({ name: 1 }).lean();
}
