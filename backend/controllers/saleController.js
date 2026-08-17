import PDFDocument from "pdfkit";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";

// Generates a simple sequential invoice number per business, e.g. INV-0001
const generateInvoiceNumber = async (ownerId) => {
  const count = await Sale.countDocuments({ owner: ownerId });
  return `INV-${String(count + 1).padStart(4, "0")}`;
};

// @desc  Create a new sale/bill. Automatically updates inventory & customer credit.
// @route POST /api/sales
export const createSale = async (req, res) => {
  try {
    const { items, customer, customerName, discount = 0, paymentMode = "cash", amountPaid = 0, notes = "" } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required to create a bill" });
    }

    let subTotal = 0;
    let tax = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.product, owner: req.user._id });
      if (!product) return res.status(404).json({ message: `Product not found: ${item.name || item.product}` });
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}` });
      }

      const lineTotal = item.quantity * item.price;
      const lineTax = (lineTotal * (product.taxPercent || 0)) / 100;

      subTotal += lineTotal;
      tax += lineTax;

      processedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
        taxPercent: product.taxPercent || 0,
        total: lineTotal + lineTax,
      });

      product.stockQuantity -= item.quantity;
      await product.save();
    }

    const grandTotal = subTotal + tax - Number(discount);

    let paymentStatus = "paid";
    let paidAmount = Number(amountPaid);

    if (paymentMode === "paylater") {
      paidAmount = Number(amountPaid) || 0;
      paymentStatus = paidAmount <= 0 ? "unpaid" : paidAmount < grandTotal ? "partial" : "paid";
    } else {
      paidAmount = grandTotal;
    }

    const invoiceNumber = await generateInvoiceNumber(req.user._id);

    const sale = await Sale.create({
      owner: req.user._id,
      invoiceNumber,
      customer: customer || undefined,
      customerName: customerName || "Walk-in Customer",
      items: processedItems,
      subTotal,
      discount,
      tax,
      grandTotal,
      paymentMode,
      paymentStatus,
      amountPaid: paidAmount,
      notes,
    });

    // Pay Later reconciliation against this customer's Khata balance:
    //  - Underpayment (paid < bill total) → shortfall is added to what they owe
    //  - Overpayment (paid > bill total) → the extra amount is applied to settle
    //    any balance they already owed from before, rather than being ignored
    if (customer && paymentMode === "paylater") {
      const cust = await Customer.findOne({ _id: customer, owner: req.user._id });
      if (cust) {
        if (paidAmount < grandTotal) {
          const pendingAmount = grandTotal - paidAmount;
          cust.creditBalance += pendingAmount;
          await cust.save();

          await Payment.create({
            owner: req.user._id,
            customer: cust._id,
            sale: sale._id,
            amount: pendingAmount,
            type: "credit_given",
            mode: paymentMode,
            note: `Pay Later balance from invoice ${invoiceNumber}`,
          });
        } else if (paidAmount > grandTotal) {
          const overpaid = paidAmount - grandTotal;
          cust.creditBalance -= overpaid;
          await cust.save();

          await Payment.create({
            owner: req.user._id,
            customer: cust._id,
            sale: sale._id,
            amount: overpaid,
            type: "payment_received",
            mode: paymentMode,
            note: `Extra payment on invoice ${invoiceNumber} applied to settle Khata balance`,
          });
        }
      }
    }

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const { from, to, customer, paymentStatus } = req.query;
    const query = { owner: req.user._id };

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    if (customer) query.customer = customer;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const sales = await Sale.find(query).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, owner: req.user._id });
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Generate a downloadable PDF invoice for a sale
// @route GET /api/sales/:id/pdf
export const downloadInvoicePDF = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, owner: req.user._id });
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    const business = req.user;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${sale.invoiceNumber}.pdf`);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    // Header
    doc.fillColor("#129256").fontSize(22).text(business.businessName || "VyaparSathi", { align: "left" });
    doc.fillColor("#666666").fontSize(10);
    if (business.address) doc.text(business.address);
    if (business.phone) doc.text(`Phone: ${business.phone}`);
    if (business.gstNumber) doc.text(`GSTIN: ${business.gstNumber}`);
    doc.moveDown(1.5);

    // Invoice meta
    doc.fillColor("#111111").fontSize(16).text(`Invoice ${sale.invoiceNumber}`);
    doc.fillColor("#666666").fontSize(10);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString("en-IN")}`);
    doc.text(`Customer: ${sale.customerName}`);
    doc.text(`Payment Mode: ${sale.paymentMode.toUpperCase()}  |  Status: ${sale.paymentStatus.toUpperCase()}`);
    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    doc.fillColor("#111111").fontSize(11);
    doc.text("Item", 50, tableTop, { width: 220 });
    doc.text("Qty", 280, tableTop, { width: 60 });
    doc.text("Price", 350, tableTop, { width: 80 });
    doc.text("Total", 450, tableTop, { width: 90 });
    doc.moveTo(50, doc.y + 15).lineTo(545, doc.y + 15).strokeColor("#dddddd").stroke();
    doc.moveDown(1.2);

    sale.items.forEach((item) => {
      const rowY = doc.y;
      doc.fontSize(10).fillColor("#333333");
      doc.text(item.name, 50, rowY, { width: 220 });
      doc.text(String(item.quantity), 280, rowY, { width: 60 });
      doc.text(`Rs ${item.price.toFixed(2)}`, 350, rowY, { width: 80 });
      doc.text(`Rs ${item.total.toFixed(2)}`, 450, rowY, { width: 90 });
      doc.moveDown(0.8);
    });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).strokeColor("#dddddd").stroke();
    doc.moveDown(1.2);

    // Totals
    const totalsX = 350;
    doc.fontSize(10).fillColor("#333333");
    doc.text(`Subtotal:`, totalsX, doc.y, { continued: false });
    doc.text(`Rs ${sale.subTotal.toFixed(2)}`, 450, doc.y - 12, { width: 90 });
    doc.text(`Discount:`, totalsX, doc.y);
    doc.text(`Rs ${sale.discount.toFixed(2)}`, 450, doc.y - 12, { width: 90 });
    doc.text(`Tax:`, totalsX, doc.y);
    doc.text(`Rs ${sale.tax.toFixed(2)}`, 450, doc.y - 12, { width: 90 });
    doc.moveDown(0.5);
    doc.fontSize(13).fillColor("#129256").text(`Grand Total:`, totalsX, doc.y);
    doc.text(`Rs ${sale.grandTotal.toFixed(2)}`, 450, doc.y - 15, { width: 90 });

    if (sale.paymentStatus !== "paid") {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#d97706");
      doc.text(`Amount Paid: Rs ${sale.amountPaid.toFixed(2)}`, totalsX, doc.y);
      doc.text(`Balance Due: Rs ${(sale.grandTotal - sale.amountPaid).toFixed(2)}`, totalsX, doc.y);
    }

    doc.moveDown(3);
    doc.fontSize(9).fillColor("#999999").text("Thank you for your business! Generated with VyaparSathi.", 50, doc.y, {
      align: "center",
      width: 495,
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    // Restock items back
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: item.quantity } });
    }
    res.json({ message: "Sale deleted and stock restored" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};