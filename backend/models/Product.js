import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General" },
    sku: { type: String, trim: true },
    unit: { type: String, default: "pcs" },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    taxPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ owner: 1, name: 1 });

export default mongoose.model("Product", productSchema);
