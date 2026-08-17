import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  Wallet,
  BarChart3,
  Store,
  X,
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/billing", label: "Billing / POS", icon: Receipt },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/customers", label: "Customers & Khata", icon: Users },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-white border-r border-gray-100 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 leading-tight">VyaparSathi</h1>
              <p className="text-[11px] text-gray-400 leading-tight">Business Partner</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`
              }
            >
              <Icon className="w-4.5 h-4.5" size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
