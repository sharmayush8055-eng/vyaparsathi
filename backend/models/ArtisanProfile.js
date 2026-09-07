import mongoose from "mongoose";

const artisanProfileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    craft: { type: String, default: "" },
    location: { type: String, default: "" },
    productionCapacity: { type: Number, default: 0 },
    priceMin: { type: Number, default: 0 },
    priceMax: { type: Number, default: 0 },
    languages: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("ArtisanProfile", artisanProfileSchema);
