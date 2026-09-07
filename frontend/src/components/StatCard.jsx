const StatCard = ({ label, value, icon: Icon, color = "brand", suffix = "" }) => {
  const colorMap = {
    brand: "bg-brand-50 text-brand-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-800">
          {value}
          {suffix}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
