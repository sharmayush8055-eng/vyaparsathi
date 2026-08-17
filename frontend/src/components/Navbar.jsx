import { Menu, LogOut, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-500">
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <p className="text-xs text-gray-400">{user?.businessName}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-gray-400 hover:text-gray-600">
          <Bell className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold">
            {user?.ownerName?.[0]?.toUpperCase()}
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-700 leading-tight">{user?.ownerName}</p>
            <p className="text-xs text-gray-400 leading-tight">{user?.role}</p>
          </div>
        </div>
        <button onClick={logout} className="text-gray-400 hover:text-red-500" title="Logout">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
