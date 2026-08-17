import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import { FileDown } from "lucide-react";

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/sales");
        setSales(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportCSV = () => {
    const headers = ["Invoice No", "Customer", "Date", "Payment Mode", "Status", "Amount"];
    const rows = sales.map((s) => [
      s.invoiceNumber,
      s.customerName,
      new Date(s.createdAt).toLocaleDateString("en-IN"),
      s.paymentMode,
      s.paymentStatus,
      s.grandTotal,
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vyaparsathi-sales-report.csv";
    a.click();
  };

  return (
    <Layout title="Reports & Invoices">
      <div className="flex justify-end mb-4">
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
          <FileDown className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-gray-400 text-sm py-8 text-center">Loading sales history...</p>
        ) : sales.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No invoices generated yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Invoice</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Mode</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s._id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-medium text-gray-700">{s.invoiceNumber}</td>
                  <td className="py-3 text-gray-500">{s.customerName}</td>
                  <td className="py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="py-3 text-gray-500 capitalize">{s.paymentMode}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      s.paymentStatus === "paid" ? "bg-green-50 text-green-600" :
                      s.paymentStatus === "partial" ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
                    }`}>
                      {s.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold text-gray-800">₹{s.grandTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
