import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";

export const getCustomers = async (req, res) => {
  try {
    const { search, type } = req.query;
    const query = { owner: req.user._id };
    if (search) query.name = { $regex: search, $options: "i" };
    if (type) query.type = type;
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, owner: req.user._id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    const payments = await Payment.find({ customer: customer._id }).sort({ date: -1 });
    res.json({ customer, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, owner: req.user._id });
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Record a Khata (credit) transaction - either credit given or payment received
export const recordPayment = async (req, res) => {
  try {
    const { amount, type, mode, note } = req.body;
    const customer = await Customer.findOne({ _id: req.params.id, owner: req.user._id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    if (type === "credit_given") {
      customer.creditBalance += Number(amount);
    } else if (type === "payment_received") {
      customer.creditBalance -= Number(amount);
    } else {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    await customer.save();

    const payment = await Payment.create({
      owner: req.user._id,
      customer: customer._id,
      amount,
      type,
      mode,
      note,
    });

    res.status(201).json({ payment, customer });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
