import express from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} from "../controllers/productController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getProducts).post(createProduct);
router.route("/:id").get(getProduct).put(updateProduct).delete(deleteProduct);
router.put("/:id/adjust-stock", adjustStock);

export default router;
