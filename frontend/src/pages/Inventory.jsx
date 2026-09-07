import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { Plus, Search, Pencil, Trash2, X, PackageSearch } from "lucide-react";

const emptyForm = {
  name: "",
  category: "",
  unit: "pcs",
  purchasePrice: "",
  sellingPrice: "",
  stockQuantity: "",
  lowStockThreshold: "5",
  taxPercent: "0",
};

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products", { params: { search } });
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditing(product);
    setForm({ ...product });
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/products/${editing._id}`, form);
        toast.success("Product updated");
      } else {
        await api.post("/products", form);
        toast.success("Product added");
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this product from inventory?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product removed");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to remove product");
    }
  };

  return (
    <Layout title="Inventory Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 justify-center">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-gray-400 text-sm py-8 text-center">Loading inventory...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-14">
            <PackageSearch className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No products found. Add your first product!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Stock</th>
                <th className="pb-3 font-medium">Purchase Price</th>
                <th className="pb-3 font-medium">Selling Price</th>
                <th className="pb-3 font-medium">Tax %</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-medium text-gray-700">{p.name}</td>
                  <td className="py-3 text-gray-500">{p.category || "-"}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.stockQuantity <= p.lowStockThreshold ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                    }`}>
                      {p.stockQuantity} {p.unit}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">₹{p.purchasePrice}</td>
                  <td className="py-3 text-gray-700 font-medium">₹{p.sellingPrice}</td>
                  <td className="py-3 text-gray-500">{p.taxPercent}%</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(p)} className="text-gray-400 hover:text-brand-600 p-1.5">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="text-gray-400 hover:text-red-500 p-1.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg text-gray-800">{editing ? "Edit Product" : "Add New Product"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Product Name</label>
                <input name="name" required value={form.name} onChange={handleChange} className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <input name="category" value={form.category} onChange={handleChange} className="input-field" placeholder="e.g. Grocery" />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <input name="unit" value={form.unit} onChange={handleChange} className="input-field" placeholder="pcs / kg / ltr" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Purchase Price (₹)</label>
                  <input type="number" step="0.01" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label">Selling Price (₹)</label>
                  <input type="number" step="0.01" required name="sellingPrice" value={form.sellingPrice} onChange={handleChange} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Stock Qty</label>
                  <input type="number" required name="stockQuantity" value={form.stockQuantity} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label">Low Stock Alert</label>
                  <input type="number" name="lowStockThreshold" value={form.lowStockThreshold} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label">Tax %</label>
                  <input type="number" step="0.01" name="taxPercent" value={form.taxPercent} onChange={handleChange} className="input-field" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editing ? "Update" : "Add Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Inventory;
