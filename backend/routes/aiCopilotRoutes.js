import express from "express";
import {
  generateCatalog,
  getCatalogs,
  deleteCatalog,
  getProfile,
  saveProfile,
  getPricing,
  getMarketLinkage,
  matchBuyer,
} from "../controllers/aiCopilotController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/catalogs", getCatalogs);
router.post("/catalogs/generate", generateCatalog);
router.delete("/catalogs/:id", deleteCatalog);

router.get("/profile", getProfile);
router.put("/profile", saveProfile);

router.post("/pricing", getPricing);
router.post("/market-linkage", getMarketLinkage);
router.post("/buyer-match", matchBuyer);

export default router;
