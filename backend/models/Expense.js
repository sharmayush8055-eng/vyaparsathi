import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["Rent", "Salary", "Utilities", "Purchase", "Transport", "Marketing", "Other"],
      default: "Other",
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
