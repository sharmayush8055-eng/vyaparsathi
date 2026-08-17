import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { Plus, X, Trash2, Wallet } from "lucide-react";

const emptyForm = { title: "", category: "Other", amount: "", note: "" };

const categories = ["Rent", "Salary", "Utilities", "Purchase", "Transport", "Marketing", "Other"];

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get("/expenses");
      setExpenses(data);
    } catch (error) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/expenses", form);
      toast.success("Expense recorded");
      setShowModal(false);
      setForm(emptyForm);
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense entry?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Expense removed");
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to remove expense");
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Layout title="Expense Tracking">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="card !py-3 !px-5 flex items-center gap-3 w-fit">
          <Wallet className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-xs text-gray-400">Total Expenses</p>
            <p className="font-bold text-gray-800">₹{total.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 justify-center">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-gray-400 text-sm py-8 text-center">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No expenses recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e._id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-medium text-gray-700">{e.title}</td>
                  <td className="py-3 text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">{e.category}</span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(e.date).toLocaleDateString("en-IN")}</td>
                  <td className="py-3 font-semibold text-gray-800">₹{e.amount}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => handleDelete(e._id)} className="text-gray-400 hover:text-red-500 p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg text-gray-800">Add Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input name="title" required value={form.title} onChange={handleChange} className="input-field" placeholder="e.g. Shop Rent - August" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className="input-field">
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹)</label>
                  <input type="number" min="0" required name="amount" value={form.amount} onChange={handleChange} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <input name="note" value={form.note} onChange={handleChange} className="input-field" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Expenses;
