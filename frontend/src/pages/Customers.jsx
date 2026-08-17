import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { Plus, Search, X, Users2, IndianRupee, Phone } from "lucide-react";

const emptyForm = { name: "", phone: "", email: "", address: "", type: "customer", notes: "" };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState("payment_received");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get("/customers", { params: { search } });
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/customers", form);
      toast.success("Customer added");
      setShowModal(false);
      setForm(emptyForm);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const openLedger = async (customer) => {
    setSelected(customer);
    try {
      const { data } = await api.get(`/customers/${customer._id}`);
      setSelectedDetail(data);
    } catch (error) {
      toast.error("Failed to load ledger");
    }
  };

  const closeLedger = () => {
    setSelected(null);
    setSelectedDetail(null);
    setPayAmount("");
  };

  const recordPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await api.post(`/customers/${selected._id}/payments`, { amount: Number(payAmount), type: payType, mode: "cash" });
      toast.success("Ledger updated");
      setPayAmount("");
      const { data } = await api.get(`/customers/${selected._id}`);
      setSelectedDetail(data);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update ledger");
    }
  };

  return (
    <Layout title="Customers & Khata (Credit Book)">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 justify-center">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading customers...</p>
      ) : customers.length === 0 ? (
        <div className="card text-center py-14">
          <Users2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No customers yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <button key={c._id} onClick={() => openLedger(c)} className="card text-left hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800">{c.name}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  c.creditBalance > 0 ? "bg-red-50 text-red-600" : c.creditBalance < 0 ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                }`}>
                  {c.creditBalance > 0 ? "Owes" : c.creditBalance < 0 ? "Advance" : "Clear"}
                </span>
              </div>
              {c.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {c.phone}</p>}
              <p className="text-lg font-bold text-gray-800 mt-3 flex items-center">
                <IndianRupee className="w-4 h-4" /> {Math.abs(c.creditBalance).toLocaleString("en-IN")}
              </p>
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg text-gray-800">Add Customer / Supplier</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input name="name" required value={form.name} onChange={handleChange} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className="input-field">
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <input name="address" value={form.address} onChange={handleChange} className="input-field" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg text-gray-800">{selected.name}</h3>
              <button onClick={closeLedger} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">{selected.phone}</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-400">Current Balance</p>
              <p className={`text-2xl font-bold ${
                selected.creditBalance > 0 ? "text-red-500" : selected.creditBalance < 0 ? "text-blue-600" : "text-green-600"
              }`}>
                ₹{Math.abs(selected.creditBalance).toLocaleString("en-IN")}{" "}
                {selected.creditBalance > 0 ? "(owed to you)" : selected.creditBalance < 0 ? "(advance credit)" : "(settled)"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <select className="input-field" value={payType} onChange={(e) => setPayType(e.target.value)}>
                <option value="payment_received">Payment Received</option>
                <option value="credit_given">Credit Given</option>
              </select>
              <input type="number" min="0" placeholder="Amount ₹" className="input-field" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <button onClick={recordPayment} className="btn-primary w-full mb-5">Record Entry</button>

            <h4 className="text-sm font-semibold text-gray-700 mb-3">Transaction History</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {selectedDetail?.payments?.length ? (
                selectedDetail.payments.map((p) => (
                  <div key={p._id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                    <div>
                      <p className="text-gray-700 capitalize">{p.type.replace("_", " ")}</p>
                      <p className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span className={p.type === "credit_given" ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                      {p.type === "credit_given" ? "+" : "-"}₹{p.amount}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No transactions recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Customers;
