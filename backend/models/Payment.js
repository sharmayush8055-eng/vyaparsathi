import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit_given", "payment_received"], required: true },
    mode: { type: String, enum: ["cash", "upi", "card", "other"], default: "cash" },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
