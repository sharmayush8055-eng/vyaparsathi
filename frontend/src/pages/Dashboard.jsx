import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import StatCard from "../components/StatCard.jsx";
import api from "../api/axios.js";
import {
  IndianRupee,
  ShoppingBag,
  AlertTriangle,
  Wallet,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: summaryData }, { data: trendData }] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/dashboard/sales-trend"),
        ]);
        setSummary(summaryData);
        setTrend(trendData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <p className="text-gray-400">Loading your business overview...</p>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Revenue" value={`₹${summary.todayRevenue.toLocaleString("en-IN")}`} icon={IndianRupee} color="brand" />
        <StatCard label="This Month Revenue" value={`₹${summary.monthRevenue.toLocaleString("en-IN")}`} icon={TrendingUp} color="blue" />
        <StatCard label="Estimated Profit" value={`₹${summary.estimatedProfit.toLocaleString("en-IN")}`} icon={Wallet} color="purple" />
        <StatCard label="Outstanding Credit" value={`₹${summary.totalOutstandingCredit.toLocaleString("en-IN")}`} icon={AlertTriangle} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Sales Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1eb56b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1eb56b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Area type="monotone" dataKey="revenue" stroke="#1eb56b" fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Top Selling Products</h3>
          {summary.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No sales recorded this month yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={summary.topProducts} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="#42d086" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Low Stock Alerts</h3>
            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-medium">
              {summary.lowStockCount} items
            </span>
          </div>
          {summary.lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-400">All products are well-stocked. 🎉</p>
          ) : (
            <ul className="space-y-3">
              {summary.lowStockProducts.slice(0, 6).map((p) => (
                <li key={p._id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{p.name}</span>
                  <span className="text-red-500 font-medium">{p.stockQuantity} {p.unit} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Business Snapshot</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-400">Total Products</p>
              <p className="text-lg font-bold text-gray-800">{summary.totalProducts}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-400">Total Customers</p>
              <p className="text-lg font-bold text-gray-800">{summary.totalCustomers}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-400">Orders Today</p>
              <p className="text-lg font-bold text-gray-800">{summary.todayOrders}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-400">Month's Expenses</p>
              <p className="text-lg font-bold text-gray-800">₹{summary.monthExpenseTotal.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
