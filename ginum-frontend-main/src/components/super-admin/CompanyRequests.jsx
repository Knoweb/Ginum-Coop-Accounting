import React from "react";

const CompanyRequests = () => {
  const companies = [
    { id: 1, name: "Akin Nuwandara", email: "akinnuwandara@gmail.com" },
    { id: 2, name: "Sanota Pvt Ltd", email: "info@sanota.lk" },
    { id: 3, name: "eoas organics pvt ltd", email: "indikapradeep.j@gmail.com" },
  ];

  const handleProfile = (id) => {
    console.log(`View profile of company with id: ${id}`);
  };

  const handleAccept = (id) => {
    console.log(`Accept company with id: ${id}`);
  };

  const handleReject = (id) => {
    console.log(`Reject company with id: ${id}`);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Company Requests</h1>
      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="py-3 px-6">No</th>
            <th className="py-3 px-6">Company Name</th>
            <th className="py-3 px-6">Email</th>
            <th className="py-3 px-6">Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company, index) => (
            <tr
              key={company.id}
              className="hover:bg-gray-100 transition duration-300"
            >
              <td className="py-4 px-6">{index + 1}</td>
              <td className="py-4 px-6">{company.name}</td>
              <td className="py-4 px-6">{company.email}</td>
              <td className="py-4 px-6 space-x-2">
                <button
                  onClick={() => handleProfile(company.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded"
                >
                  Profile
                </button>
                <button
                  onClick={() => handleAccept(company.id)}
                  className="bg-green-500 hover:bg-green-600 text-white py-1 px-4 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(company.id)}
                  className="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyRequests;
