import mongoose from "mongoose";

const artisanCatalogSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productName: { type: String, required: true, trim: true },
    category: { type: String, default: "Handmade Craft" },
    material: { type: String, default: "" },
    craft: { type: String, default: "" },
    productionTime: { type: String, default: "" },
    description: { type: String, default: "" },
    culturalStory: { type: String, default: "" },
    tags: [{ type: String }],
    language: { type: String, default: "English" },
    sourceText: { type: String, default: "" },
    imageAnalyzed: { type: Boolean, default: false },
    aiMode: { type: String, enum: ["openrouter", "demo"], default: "demo" },
  },
  { timestamps: true }
);

artisanCatalogSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model("ArtisanCatalog", artisanCatalogSchema);
