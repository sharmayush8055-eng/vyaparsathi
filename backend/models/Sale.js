import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    taxPercent: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invoiceNumber: { type: String, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, default: "Walk-in Customer" },
    items: [saleItemSchema],
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMode: { type: String, enum: ["cash", "upi", "card", "paylater"], default: "cash" },
    paymentStatus: { type: String, enum: ["paid", "partial", "unpaid"], default: "paid" },
    amountPaid: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);