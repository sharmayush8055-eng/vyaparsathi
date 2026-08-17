import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { Search, Plus, Minus, Trash2, Receipt, User, Phone, Mic, Download, MessageCircle } from "lucide-react";
import VoiceBilling from "../components/VoiceBilling.jsx";

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "paylater", label: "Pay Later" },
];

// Finds an existing Khata customer by matching phone number first (most reliable,
// since two customers can share a name), falling back to an exact name match
// only when no phone has been entered yet.
const findMatchingCustomer = (customers, name, phone) => {
  const trimmedPhone = phone.trim();
  const trimmedName = name.trim().toLowerCase();

  if (trimmedPhone) {
    const byPhone = customers.find((c) => c.phone && c.phone.trim() === trimmedPhone);
    if (byPhone) return byPhone;
  }
  if (trimmedName) {
    const byName = customers.find((c) => c.name.toLowerCase() === trimmedName);
    if (byName) return byName;
  }
  return null;
};

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [lastInvoice, setLastInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchCustomers = async () => {
    const { data: cust } = await api.get("/customers", { params: { type: "customer" } });
    setCustomers(cust);
    return cust;
  };

  useEffect(() => {
    (async () => {
      try {
        const [{ data: prod }] = await Promise.all([api.get("/products"), fetchCustomers()]);
        setProducts(prod);
      } catch (error) {
        toast.error("Failed to load billing data");
      }
    })();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    if (product.stockQuantity <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product === product._id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.error("Not enough stock available");
          return prev;
        }
        return prev.map((item) =>
          item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product: product._id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
          maxStock: product.stockQuantity,
          unit: product.unit,
        },
      ];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty > item.maxStock) {
            toast.error("Not enough stock available");
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId) => setCart((prev) => prev.filter((i) => i.product !== productId));

  // Re-checks for a matching existing Khata customer whenever the name or phone
  // changes, and auto-fills the other field once a match is found (so picking
  // a name from suggestions fills in their saved phone, and vice versa).
  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    setCustomerName(value);
    const match = findMatchingCustomer(customers, value, customerPhone);
    if (match) {
      setCustomerId(match._id);
      if (match.phone) setCustomerPhone(match.phone);
    } else {
      setCustomerId("");
    }
  };

  const handleCustomerPhoneChange = (e) => {
    const value = e.target.value;
    setCustomerPhone(value);
    const match = findMatchingCustomer(customers, customerName, value);
    if (match) {
      setCustomerId(match._id);
      if (match.name) setCustomerName(match.name);
    } else {
      setCustomerId("");
    }
  };

  // Called when the voice modal has parsed a spoken order into items + customer name.
  // Merges matched items into the existing cart (respecting stock limits) and
  // pre-fills the customer name field if one was recognized.
  const handleVoiceConfirm = (parsed) => {
    setCart((prev) => {
      const next = [...prev];
      parsed.items.forEach((voiceItem) => {
        const existing = next.find((i) => i.product === voiceItem.product);
        if (existing) {
          const newQty = Math.min(existing.quantity + voiceItem.quantity, voiceItem.maxStock);
          existing.quantity = newQty;
        } else {
          next.push({ ...voiceItem, quantity: Math.min(voiceItem.quantity, voiceItem.maxStock) });
        }
      });
      return next;
    });

    if (parsed.customerName) {
      const match = findMatchingCustomer(customers, parsed.customerName, "");
      setCustomerName(parsed.customerName);
      setCustomerId(match ? match._id : "");
      if (match?.phone) setCustomerPhone(match.phone);
    }

    toast.success("Items added from voice order!");
    setShowVoiceModal(false);
  };

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = Math.max(0, subTotal - Number(discount || 0));

  // The customer's Khata balance before this sale (0 for a brand-new customer).
  const existingBalance = customerId
    ? customers.find((c) => c._id === customerId)?.creditBalance || 0
    : 0;

  const paidNow = Number(amountPaid || 0);
  const shortfall = Math.max(0, grandTotal - paidNow);
  const overpaid = Math.max(0, paidNow - grandTotal);
  // Net effect on Khata balance: shortfall increases it, overpayment reduces it
  // (an overpayment beyond what's owed becomes an advance credit, shown as negative).
  const projectedBalance = existingBalance + shortfall - overpaid;

  const resetForm = () => {
    setCart([]);
    setDiscount(0);
    setAmountPaid("");
    setCustomerId("");
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMode("cash");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Add at least one product to the bill");
      return;
    }
    if (paymentMode === "paylater" && !customerName.trim()) {
      toast.error("Enter the customer's name to use Pay Later");
      return;
    }

    setSubmitting(true);
    try {
      let finalCustomerId = customerId;

      // Pay Later needs a Khata record to track the balance against.
      // If this customer (by name + phone) isn't in the Khata section yet, add them automatically.
      if (paymentMode === "paylater" && !finalCustomerId) {
        const { data: newCustomer } = await api.post("/customers", {
          name: customerName.trim(),
          phone: customerPhone.trim() || undefined,
          type: "customer",
        });
        finalCustomerId = newCustomer._id;
        setCustomers((prev) => [newCustomer, ...prev]);
        toast.success(`${newCustomer.name} added to Khata`);
      }

      const payload = {
        items: cart.map(({ product, name, price, quantity }) => ({ product, name, price, quantity })),
        customer: finalCustomerId || undefined,
        customerName: customerName.trim() || undefined,
        discount: Number(discount) || 0,
        paymentMode,
        amountPaid: paymentMode === "paylater" ? paidNow : grandTotal,
      };
      const { data } = await api.post("/sales", payload);
      setLastInvoice(data);
      toast.success(`Invoice ${data.invoiceNumber} generated!`);
      resetForm();
      const [{ data: prod }] = await Promise.all([api.get("/products"), fetchCustomers()]);
      setProducts(prod);
    } catch (error) {
      toast.error(error.response?.data?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Downloads the invoice as a PDF generated by the backend.
  const handleDownloadInvoice = async () => {
    if (!lastInvoice) return;
    setDownloading(true);
    try {
      const response = await api.get(`/sales/${lastInvoice._id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${lastInvoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download invoice");
    } finally {
      setDownloading(false);
    }
  };

  // Opens WhatsApp with a prefilled invoice summary the owner can send to the customer.
  const handleShareWhatsApp = () => {
    if (!lastInvoice) return;
    const itemLines = lastInvoice.items
      .map((i) => `${i.name} x${i.quantity} - Rs${i.total.toFixed(2)}`)
      .join("\n");
    const message =
      `*Invoice ${lastInvoice.invoiceNumber}*\n` +
      `Customer: ${lastInvoice.customerName}\n\n` +
      `${itemLines}\n\n` +
      `*Grand Total: Rs${lastInvoice.grandTotal.toFixed(2)}*\n` +
      `Status: ${lastInvoice.paymentStatus.toUpperCase()}\n\n` +
      `Thank you for your business!`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <Layout title="Billing / POS">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product selection */}
        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                className="input-field pl-10"
                placeholder="Search product to add..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowVoiceModal(true)}
              className="btn-primary flex items-center gap-2 shrink-0 px-4"
              title="Speak to create a bill"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Speak to Bill</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => (
              <button
                key={p._id}
                onClick={() => addToCart(p)}
                disabled={p.stockQuantity <= 0}
                className="card text-left hover:border-brand-400 hover:shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <p className="font-medium text-gray-800 text-sm line-clamp-1">{p.name}</p>
                <p className="text-xs text-gray-400 mt-1">{p.stockQuantity} {p.unit} in stock</p>
                <p className="text-brand-600 font-semibold mt-2">₹{p.sellingPrice}</p>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full py-6 text-center">No products match your search.</p>
            )}
          </div>
        </div>

        {/* Cart & checkout */}
        <div className="card h-fit sticky top-24">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold text-gray-800">Current Bill</h3>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Cart is empty. Tap a product to add it.</p>
            ) : (
              cart.map((item) => (
                <div key={item.product} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-700 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">₹{item.price} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.product, -1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product, 1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeItem(item.product)} className="text-gray-300 hover:text-red-500 ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label flex items-center gap-1"><User className="w-3.5 h-3.5" /> Customer Name</label>
                <input
                  list="customer-suggestions"
                  className="input-field"
                  placeholder="Walk-in if blank"
                  value={customerName}
                  onChange={handleCustomerNameChange}
                />
                <datalist id="customer-suggestions">
                  {customers.map((c) => (
                    <option key={c._id} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="label flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</label>
                <input
                  list="customer-phone-suggestions"
                  className="input-field"
                  placeholder="Optional"
                  value={customerPhone}
                  onChange={handleCustomerPhoneChange}
                />
                <datalist id="customer-phone-suggestions">
                  {customers.filter((c) => c.phone).map((c) => (
                    <option key={c._id} value={c.phone} />
                  ))}
                </datalist>
              </div>
            </div>
            {customerId && (
              <p className="text-xs text-brand-600 -mt-1">
                Matched existing Khata customer
                {existingBalance !== 0 && ` • current balance ₹${Math.abs(existingBalance).toFixed(2)} ${existingBalance > 0 ? "(owed to you)" : "(advance credit)"}`}
              </p>
            )}

            <div>
              <label className="label">Discount (₹)</label>
              <input type="number" min="0" className="input-field" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>

            <div>
              <label className="label">Payment Mode</label>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_MODES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPaymentMode(value)}
                    className={`text-xs py-2 rounded-lg font-medium border ${
                      paymentMode === value ? "bg-brand-600 text-white border-brand-600" : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMode === "paylater" && (
              <div>
                <label className="label">Amount Paid Now (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0 if nothing paid right now"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {overpaid > 0
                    ? `Paying ₹${overpaid.toFixed(2)} more than the bill will be used to settle ${customerId ? "this customer's existing" : "their new"} Khata balance.`
                    : shortfall > 0
                    ? `Remaining ₹${shortfall.toFixed(2)} will be added to ${customerId ? "this customer's" : "a new"} Khata entry.`
                    : "Bill fully paid — no change to Khata balance."}
                  {customerId && (
                    <>
                      {" "}New balance will be ₹{Math.abs(projectedBalance).toFixed(2)}{" "}
                      {projectedBalance > 0 ? "(owed to you)" : projectedBalance < 0 ? "(advance credit)" : "(settled)"}.
                    </>
                  )}
                </p>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Discount</span>
              <span>- ₹{Number(discount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-800 pt-2 border-t border-gray-100">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>

            <button onClick={handleCheckout} disabled={submitting} className="btn-primary w-full mt-2">
              {submitting ? "Processing..." : "Generate Invoice"}
            </button>
          </div>
        </div>
      </div>

      {showVoiceModal && (
        <VoiceBilling
          products={products}
          onClose={() => setShowVoiceModal(false)}
          onConfirm={handleVoiceConfirm}
        />
      )}

      {lastInvoice && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-7 h-7 text-brand-600" />
            </div>
            <h3 className="font-semibold text-lg text-gray-800">Invoice Generated!</h3>
            <p className="text-sm text-gray-400 mt-1">{lastInvoice.invoiceNumber}</p>
            <p className="text-2xl font-bold text-brand-600 mt-3">₹{lastInvoice.grandTotal.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1 capitalize">{lastInvoice.paymentStatus} • {lastInvoice.paymentMode}</p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={handleDownloadInvoice} disabled={downloading} className="btn-secondary flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                {downloading ? "..." : "Download"}
              </button>
              <button onClick={handleShareWhatsApp} className="btn-secondary flex items-center justify-center gap-2 !bg-green-50 !text-green-700 !border-green-200">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>

            <button onClick={() => setLastInvoice(null)} className="btn-primary w-full mt-3">Create New Bill</button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Billing;