import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { verifyAdminToken } from "../middleware/adminAuth.js";
import {
  adminLogin,
  addProduct,
  updateProduct,
  deleteProduct,
  getCustomers,
  getCategories,
  getAllOrders,
  addCollection,
  addCategory,
  getCollections,
  getCollection,
  addDesignsToCollection,
  removeDesignFromCollection,
  deleteCollection,
  getDesigns,
} from "../controllers/admin_controllers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const admin_router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isCollection = req.originalUrl.includes("/collections");
    const category = isCollection
      ? "collections/covers"
      : req.body.collectionId
        ? "collections/designs"
        : req.body.category || "default";
    const uploadPath = path.join(__dirname, "..", "assets", category);

    // Create category folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  console.error("Multer Error:", err); // Log error for debugging
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File is too large. Maximum size is 5MB.",
      });
    }
    // Specific error for field name mismatch
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected field name for upload. Check 'images' vs 'image'.",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }
  next();
};

// Admin routes
admin_router.post("/login", adminLogin);

// Protected admin routes (require authentication)
admin_router.get("/categories", verifyAdminToken, getCategories);
admin_router.post("/categories", verifyAdminToken, addCategory);
admin_router.get("/collections", verifyAdminToken, getCollections);
admin_router.get("/collections/:id", verifyAdminToken, getCollection);
admin_router.post(
  "/collections",
  verifyAdminToken,
  upload.single("image"),
  handleMulterError,
  addCollection,
);
admin_router.post(
  "/collections/:id/designs",
  verifyAdminToken,
  addDesignsToCollection,
);
admin_router.delete(
  "/collections/:id/designs/:designId",
  verifyAdminToken,
  removeDesignFromCollection,
);
admin_router.delete("/collections/:id", verifyAdminToken, deleteCollection);
admin_router.get("/designs", verifyAdminToken, getDesigns);
admin_router.post(
  "/products",
  verifyAdminToken,
  upload.single("image"),
  handleMulterError,
  addProduct,
);
admin_router.put(
  "/products/:id",
  verifyAdminToken,
  upload.single("image"),
  handleMulterError,
  updateProduct,
);
admin_router.delete("/products/:id", verifyAdminToken, deleteProduct);
admin_router.get("/customers", verifyAdminToken, getCustomers);
admin_router.get("/orders", verifyAdminToken, getAllOrders);
