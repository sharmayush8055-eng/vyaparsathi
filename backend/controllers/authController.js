import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });
};

// @desc  Register a new business owner
// @route POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { businessName, ownerName, email, phone, password, businessType } = req.body;

    if (!businessName || !ownerName || !email || !phone || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({ businessName, ownerName, email, phone, password, businessType });

    res.status(201).json({
      _id: user._id,
      businessName: user.businessName,
      ownerName: user.ownerName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        businessName: user.businessName,
        ownerName: user.ownerName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get logged-in user's profile
// @route GET /api/auth/me
export const getProfile = async (req, res) => {
  res.json(req.user);
};

// @desc  Update business profile
// @route PUT /api/auth/me
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const fields = ["businessName", "ownerName", "phone", "businessType", "address", "gstNumber"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });

    if (req.body.password) user.password = req.body.password;

    const updated = await user.save();
    res.json({
      _id: updated._id,
      businessName: updated.businessName,
      ownerName: updated.ownerName,
      email: updated.email,
      role: updated.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
