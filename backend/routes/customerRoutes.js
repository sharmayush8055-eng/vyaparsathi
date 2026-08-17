import express from "express";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  recordPayment,
} from "../controllers/customerController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getCustomers).post(createCustomer);
router.route("/:id").get(getCustomer).put(updateCustomer).delete(deleteCustomer);
router.post("/:id/payments", recordPayment);

export default router;
