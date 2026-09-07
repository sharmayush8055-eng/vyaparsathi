import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    address: { type: String, default: "" },
    type: { type: String, enum: ["customer", "supplier"], default: "customer" },
    creditBalance: { type: Number, default: 0 }, // positive = customer owes business
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
