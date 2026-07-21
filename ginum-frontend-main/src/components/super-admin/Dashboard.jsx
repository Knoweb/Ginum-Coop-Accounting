import React from "react";

const Dashboard = () => {
  const stats = [
    { id: 1, value: 9, label: "Active Users", bgColor: "bg-blue-100", icon: "📅" },
    { id: 2, value: 3, label: "Pending Requests", bgColor: "bg-yellow-100", icon: "👤" },
    { id: 3, value: 0, label: "Rejected Requests", bgColor: "bg-red-100", icon: "💰" },
    { id: 4, value: 1, label: "Not Paid", bgColor: "bg-orange-100", icon: "💰" },
  ];

  return (
    <div className="p-6 bg-gray-100 flex-1">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="p-6 rounded-xl shadow-sm bg-white flex items-center space-x-4"
          >
            <span className={`text-3xl p-2 rounded-lg ${stat.bgColor}`}>{stat.icon}</span>
            <div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
