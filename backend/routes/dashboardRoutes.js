import express from "express";
import { getSummary, getSalesTrend } from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/summary", getSummary);
router.get("/sales-trend", getSalesTrend);

export default router;
