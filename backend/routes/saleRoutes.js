import express from "express";
import { createSale, getSales, getSale, deleteSale, downloadInvoicePDF } from "../controllers/saleController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getSales).post(createSale);
router.get("/:id/pdf", downloadInvoicePDF);
router.route("/:id").get(getSale).delete(deleteSale);

export default router;
