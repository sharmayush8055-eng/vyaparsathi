import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Store } from "lucide-react";

const Register = () => {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    businessType: "Retailer",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    register(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join VyaparSathi</h1>
          <p className="text-brand-100 text-sm mt-1">Digitize your business in minutes</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Business Name</label>
                <input name="businessName" required value={form.businessName} onChange={handleChange} className="input-field" placeholder="Sharma General Store" />
              </div>
              <div>
                <label className="label">Owner Name</label>
                <input name="ownerName" required value={form.ownerName} onChange={handleChange} className="input-field" placeholder="Ramesh Sharma" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Email Address</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange} className="input-field" placeholder="you@business.com" />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input name="phone" required value={form.phone} onChange={handleChange} className="input-field" placeholder="9876543210" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Password</label>
                <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} className="input-field" placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className="label">Business Type</label>
                <select name="businessType" value={form.businessType} onChange={handleChange} className="input-field">
                  <option>Retailer</option>
                  <option>Wholesaler</option>
                  <option>Service Provider</option>
                  <option>Home Business</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
