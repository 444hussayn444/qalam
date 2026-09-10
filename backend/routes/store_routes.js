import express from "express";
import {
  get_products,
  get_product_by_id,
  get_categories,
  get_collections,
  get_collection_by_slug,
} from "../controllers/store_controllers.js";

export const s_router = express.Router();

s_router.get("/products", get_products);
s_router.get("/products/:id", get_product_by_id);
s_router.get("/categories", get_categories);
s_router.get("/collections", get_collections);
s_router.get("/collections/:slug", get_collection_by_slug);
