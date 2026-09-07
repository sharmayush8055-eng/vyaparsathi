import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    const query = { owner: req.user._id };

    if (search) query.name = { $regex: search, $options: "i" };
    if (category) query.category = category;

    let products = await Product.find(query).sort({ createdAt: -1 });

    if (lowStock === "true") {
      products = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, owner: req.user._id });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { quantity, mode } = req.body; // mode: "add" | "reduce"
    const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.stockQuantity = mode === "reduce"
      ? Math.max(0, product.stockQuantity - Number(quantity))
      : product.stockQuantity + Number(quantity);

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
