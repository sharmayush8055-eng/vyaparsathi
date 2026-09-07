import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";

// @desc  Business analytics summary
// @route GET /api/dashboard/summary
export const getSummary = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [todaySales, monthSales, monthExpenses, products, customers] = await Promise.all([
      Sale.find({ owner: ownerId, createdAt: { $gte: startOfToday } }),
      Sale.find({ owner: ownerId, createdAt: { $gte: startOfMonth } }),
      Expense.find({ owner: ownerId, date: { $gte: startOfMonth } }),
      Product.find({ owner: ownerId }),
      Customer.find({ owner: ownerId, type: "customer" }),
    ]);

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const estimatedProfit = monthRevenue - monthExpenseTotal;

    const lowStockProducts = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
    const totalOutstandingCredit = customers.reduce((sum, c) => sum + Math.max(0, c.creditBalance), 0);

    // Fast-moving products this month
    const productSalesMap = {};
    monthSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = item.name;
        productSalesMap[key] = (productSalesMap[key] || 0) + item.quantity;
      });
    });
    const topProducts = Object.entries(productSalesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    res.json({
      todayRevenue,
      todayOrders: todaySales.length,
      monthRevenue,
      monthOrders: monthSales.length,
      monthExpenseTotal,
      estimatedProfit,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      totalOutstandingCredit,
      totalCustomers: customers.length,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Sales trend for charts (last 7 days)
// @route GET /api/dashboard/sales-trend
export const getSalesTrend = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const days = 7;
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const sales = await Sale.find({ owner: ownerId, createdAt: { $gte: day, $lt: nextDay } });
      const total = sales.reduce((sum, s) => sum + s.grandTotal, 0);

      result.push({
        date: day.toISOString().split("T")[0],
        revenue: total,
        orders: sales.length,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
