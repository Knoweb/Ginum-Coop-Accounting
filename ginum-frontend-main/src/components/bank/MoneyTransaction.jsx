// import React, { useState, useEffect, useMemo } from "react";
// import { MdOutlineCancel, MdAddCircleOutline, MdSearch } from "react-icons/md";
// import { FaTimes, FaUserTie, FaBuilding, FaUser } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import AddAccountForm from "../account/AddAccountForm";
// import NewProjectForm from "../projects/NewProjectForm";
// import PayerPayee from "../PayerPayee/PayerPayee";
// import api from "../../utils/api";
// import { apiUrl } from "../../utils/api";

// // 1. Updated PayeeDropdown with API Fetching
// const PayeeDropdown = ({ value, onChange, onAddNew }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [suppliers, setSuppliers] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [employees, setEmployees] = useState([]);

//   // Fetch Suppliers and Customers
//   useEffect(() => {
//   const fetchPayees = async () => {
//     const companyId =
//       sessionStorage.getItem("companyId") ||
//       localStorage.getItem("companyId");

//     const token =
//       sessionStorage.getItem("auth_token") ||
//       localStorage.getItem("auth_token") ||
//       sessionStorage.getItem("token");

//     if (!companyId || !token) return;

//     setLoading(true);

//     try {
//       const [supRes, custRes, empRes] = await Promise.all([
//         fetch(`${apiUrl || "http://localhost:8081"}/api/suppliers/companies/${companyId}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         }),
//         fetch(`${apiUrl || "http://localhost:8081"}/api/customers/companies/${companyId}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         }),
//         fetch(`${apiUrl || "http://localhost:8081"}/api/employees/${companyId}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         })
//       ]);

//       const supData = supRes.ok ? await supRes.json() : [];
//       const custData = custRes.ok ? await custRes.json() : [];
//       const empData = empRes.ok ? await empRes.json() : [];

//       // Suppliers
//       const suppliersData = (Array.isArray(supData) ? supData : []).map(s => ({
//         id: `SUP-${s.id || s.email}`,
//         name: s.supplierName,
//         contact: s.mobileNo || s.email,
//         type: "Supplier"
//       }));

//       // Customers
//       const customersData = (Array.isArray(custData) ? custData : []).map(c => ({
//         id: `CUS-${c.customerId || c.id}`,
//         name: c.customerName,
//         contact: c.mobileNo || c.email,
//         type: "Customer"
//       }));

//       // Employees 
//       const employeesData = (Array.isArray(empData) ? empData : []).map(e => ({
//         id: `EMP-${e.employeeId}`,
//         name: `${e.firstName} ${e.lastName}`,
//         contact: e.mobileNo || e.email,
//         type: "Employee"
//       }));

//       setSuppliers(suppliersData);
//       setCustomers(customersData);
//       setEmployees(employeesData);

//     } catch (error) {
//       console.error("Error fetching Payees:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchPayees();
// }, []);

//   const filteredGroups = useMemo(() => {
//     const lowerSearch = searchTerm.toLowerCase();

//     const filterItems = (items) =>
//       items.filter((item) => (item.name || "").toLowerCase().includes(lowerSearch));

//     return [
//       {
//     label: "Customers",
//     icon: <FaUser className="text-green-500" />,
//     items: filterItems(customers),
//   },
//   {
//     label: "Suppliers",
//     icon: <FaBuilding className="text-blue-500" />,
//     items: filterItems(suppliers),
//   },
  
//   {
//     label: "Employees",   
//     icon: <FaUserTie className="text-purple-500" />,
//     items: filterItems(employees),
//   }
// ].filter(group => group.items.length > 0);
//   }, [searchTerm, suppliers, customers, employees]);

//   const selectedItem = useMemo(() => {
//     const allItems = [...suppliers, ...customers, ...employees];
//     return allItems.find((item) => item.id === value);
//   }, [value, suppliers, customers, employees]);

  
//   return (
//     <div className="relative w-full">
//       <div
//         className="flex items-center justify-between w-full px-3 py-2 border rounded-lg cursor-pointer bg-white"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         {selectedItem ? (
//           <div className="flex items-center">
//             {selectedItem.name}
//             {selectedItem.contact && (
//               <span className="ml-2 text-sm text-gray-500">
//                 ({selectedItem.contact})
//               </span>
//             )}
//             <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">{selectedItem.type}</span>
//           </div>
//         ) : (
//           <span className="text-gray-400">
//              {loading ? "Loading payees..." : "Select payee/payer"}
//           </span>
//         )}
//         <svg
//           className={`w-4 h-4 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
//           fill="none" stroke="currentColor" viewBox="0 0 24 24"
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//         </svg>
//       </div>

//       {isOpen && (
//         <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
//           <div className="sticky top-0 bg-white p-2 border-b">
//             <div className="relative">
//               <MdSearch className="absolute left-3 top-3 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search payees..."
//                 className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 autoFocus
//               />
//             </div>
//           </div>

//           {loading ? (
//              <div className="p-4 text-center text-blue-500">Loading...</div>
//           ) : filteredGroups.length > 0 ? (
//             filteredGroups.map((group) => (
//               <div key={group.label} className="border-b last:border-b-0">
//                 <div className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 font-medium">
//                   <span className="mr-2">{group.icon}</span>
//                   {group.label}
//                 </div>
//                 {group.items.map((item) => (
//                   <div
//                     key={item.id}
//                     className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
//                       value === item.id ? "bg-blue-100" : ""
//                     }`}
//                     onClick={() => {
//                       onChange(item.id);
//                       setIsOpen(false);
//                     }}
//                   >
//                     <div className="flex justify-between">
//                       <span>{item.name}</span>
//                       {item.contact && (
//                         <span className="text-sm text-gray-500">{item.contact}</span>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ))
//           ) : (
//             <div className="p-4 text-center text-gray-500">No results found</div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// // 2. Updated Main Component (MoneyTransaction)
// const MoneyTransaction = ({ type }) => {
//   const navigate = useNavigate();
//   const [showContactModal, setShowContactModal] = useState(false);
//   const [showAccountModal, setShowAccountModal] = useState(false);
//   const [showProjectModal, setShowProjectModal] = useState(false);
//   const [modalTransition, setModalTransition] = useState("opacity-0 invisible");
  
//   const [selectedPayee, setSelectedPayee] = useState(null);
//   const [selectedBankAccount, setSelectedBankAccount] = useState("");

//   const [accounts, setAccounts] = useState([]); 
//   const [projects, setProjects] = useState([]);
  
//   const [date, setDate] = useState("");
//   const [referenceNumber, setReferenceNumber] = useState("1");
//   const [description, setDescription] = useState("");

//   const [refreshPayees, setRefreshPayees] = useState(0);

//   const [rows, setRows] = useState([
//     { account: "", amount: "0.00", quantity: "0", description: "", project: "" },
//   ]);


//   // Fetch Projects on load
//   useEffect(() => {
//     const fetchProjects = async () => {
//       const companyId = sessionStorage.getItem("companyId") || localStorage.getItem("companyId");
//       const token = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token") || sessionStorage.getItem("token");

//       if (!companyId || !token) return;

//       try {
//         const response = await fetch(`${apiUrl || 'http://localhost:8081'}/api/companies/${companyId}/projects`, {
//           method: "GET",
//           headers: {
//             "Authorization": `Bearer ${token}`,
//             "Content-Type": "application/json"
//           }
//         });

//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log("Projects fetched for dropdown:", data);
        
//         setProjects(Array.isArray(data) ? data : []);
//       } catch (error) {
//         console.error("Error fetching projects:", error);
//       }
//     };

//     fetchProjects();
//   }, []);

//   // Fetch Bank Accounts on load
//   useEffect(() => {
//     const fetchAccounts = async () => {
//       const companyId = sessionStorage.getItem("companyId") || localStorage.getItem("companyId");
//       const token = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token") || sessionStorage.getItem("token");

//       if (!companyId || !token) return;

//       try {
//         const response = await fetch(`${apiUrl || 'http://localhost:8081'}/api/companies/${companyId}/accounts`, {
//           method: "GET",
//           headers: {
//             "Authorization": `Bearer ${token}`,
//             "Content-Type": "application/json"
//           }
//         });

//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log("Accounts fetched for dropdown:", data);
        
//         setAccounts(Array.isArray(data) ? data : []);
//       } catch (error) {
//         console.error("Error fetching accounts:", error);
//       }
//     };

//     fetchAccounts();
//   }, []);

//   useEffect(() => {
//     const today = new Date();
//     const formattedDate = today.toISOString().split("T")[0];
//     setDate(formattedDate);
//   }, []);

//   useEffect(() => {
//     if (showContactModal || showAccountModal || showProjectModal) {
//       setModalTransition("opacity-100 visible");
//     } else {
//       setModalTransition("opacity-0 invisible");
//     }
//   }, [showContactModal, showAccountModal, showProjectModal]);

//   const handleModalClick = (e, setModal) => {
//     if (e.target === e.currentTarget) setModal(false);
//   };

//   const handleRowChange = (index, field, value) => {
//     const updatedRows = [...rows];
//     updatedRows[index][field] = value;

//     if (index === rows.length - 1 && value.trim() !== "") {
//       updatedRows.push({ account: "", amount: "0.00", quantity: "0", description: "", project: "" });
//     }
//     setRows(updatedRows);
//   };

//   const removeRow = (index) => {
//     const updatedRows = rows.filter((_, i) => i !== index);
//     setRows(updatedRows);
//   };

//   // 1. මෙන්න මේ handleRecord function එක අලුතින් එකතු කරන්න
//   const handleRecord = async () => {
//     if (!selectedBankAccount) {
//       alert("Please select a Bank Account.");
//       return;
//     }
    
//     const validRows = rows.filter(r => r.account !== "" && parseFloat(r.amount) > 0);
//     if (validRows.length === 0) {
//       alert("Please add at least one valid transaction row with an amount.");
//       return;
//     }

//     const payload = {
//       companyId: parseInt(sessionStorage.getItem("companyId")),
//       accountId: parseInt(selectedBankAccount),
//       payeeId: selectedPayee, 
//       date: date,
//       description: description,
//       totalAmount: total,
//       transactionType: type ? type.toUpperCase() : "SPEND", 
//       rows: validRows.map(r => ({
//         accountId: parseInt(r.account),
//         amount: parseFloat(r.amount),
//         quantity: parseInt(r.quantity) || 1,
//         description: r.description,
//         projectId: r.project ? parseInt(r.project) : null
//       }))
//     };

//     console.log("Recording Transaction:", payload);

//     try {
//       const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");
//       const response = await fetch(`${apiUrl}/api/transactions`, {
//         method: "POST",
//         headers: { 
//           "Authorization": `Bearer ${token}`,
//           "Content-Type": "application/json" 
//         },
//         body: JSON.stringify(payload)
//       });

//       if (!response.ok) {
//         const errorData = await response.text();
//         throw new Error(errorData || "Failed to record transaction");
//       }

//       alert("Transaction recorded successfully!");
//       navigate("/bank-reconciliation"); 
//     } catch (err) {
//       console.error("Error recording transaction:", err);
//       alert("Failed to record transaction. Check console.");
//     }
//   };
  

//   // Calculate Totals dynamically
//   const subtotal = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
//   const tax = 0; // Update tax logic if needed
//   const total = subtotal + tax;

//   return (
//     <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-4 sm:p-6 mt-4 sm:mt-6">
//       <h2 className="section-title mb-4 sm:mb-6">
//         {type === "spend" ? "Spend Money Transaction" : "Receive Money Transaction"}
//       </h2>

//       <div className="space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {/* Real Bank Accounts Dropdown */}
//           <div>
//             <label className="block text-gray-700 font-medium">
//               Bank Account <span className="text-red-500">*</span>
//             </label>
//             <select 
//               className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
//               value={selectedBankAccount}
//               onChange={(e) => setSelectedBankAccount(e.target.value)}
//             >
//               <option value="">Select Bank Account</option>
//               {accounts.map(acc => (
//                 <option key={acc.id} value={acc.id}>
//                   {acc.accountCode} - {acc.accountName}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block text-gray-700 font-medium">
//               Reference Number <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               className="w-full px-3 py-2 border bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
//               value={referenceNumber}
//               onChange={(e) => setReferenceNumber(e.target.value)}
//               readOnly
//             />
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {/* Real Payee Dropdown */}
//           <div>
//             <label className="block text-gray-700 font-medium">Payee / Payer</label>
//             <div className="flex items-center gap-2">
//               <div className="flex-grow">
//                 <PayeeDropdown
//                   value={selectedPayee}
//                   onChange={(id) => setSelectedPayee(id)}
//                   onAddNew={() => setShowContactModal(true)}
//                 />
//               </div>
//               <button
//                 onClick={() => setShowContactModal(true)}
//                 className="p-2 text-blue-600 hover:text-blue-700 self-end mb-1"
//               >
//                 <MdAddCircleOutline className="h-5 w-5" />
//               </button>
//             </div>
//           </div>
//           <div>
//             <label className="block text-gray-700 font-medium">
//               Date <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="date"
//               className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//             />
//           </div>
//         </div>

//         <div>
//           <label className="block text-gray-700 font-medium">Description of Transaction</label>
//           <textarea
//             className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
//             rows={3}
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           ></textarea>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full rounded-lg">
//             <thead>
//               <tr className="bg-gray-100 text-gray-700 text-sm">
//                 <th className="p-2">
//                   Account <span className="text-red-500">*</span>
//                   <button onClick={() => setShowAccountModal(true)} className="ml-2 text-blue-600 hover:text-blue-700">
//                     <MdAddCircleOutline className="h-5 w-5 inline" />
//                   </button>
//                 </th>
//                 <th className="p-2">Amount ($) <span className="text-red-500">*</span></th>
//                 <th className="p-2">Quantity</th>
//                 <th className="p-2">Description</th>
//                 <th className="p-2">
//                   Project
//                   <button onClick={() => setShowProjectModal(true)} className="ml-2 text-blue-600 hover:text-blue-700">
//                     <MdAddCircleOutline className="h-5 w-5 inline" />
//                   </button>
//                 </th>
//                 <th className="p-2"></th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((row, index) => (
//                 <tr key={index} className="border-b last:border-0">
//                   <td className="p-2">
//                     <select
//                       className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-w-[150px]"
//                       value={row.account}
//                       onChange={(e) => handleRowChange(index, "account", e.target.value)}
//                     >
//                       <option value="">Select Account</option>
//                       {/* Populate actual accounts here as well */}
//                       {accounts.map(acc => (
//                         <option key={acc.id} value={acc.id}>
//                            {acc.accountCode} - {acc.accountName}
//                         </option>
//                       ))}
//                     </select>
//                   </td>
//                   <td className="p-2">
//                     <input
//                       type="number"
//                       className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-w-[100px]"
//                       min={0}
//                       value={row.amount}
//                       onChange={(e) => handleRowChange(index, "amount", e.target.value)}
//                     />
//                   </td>
//                   <td className="p-2">
//                     <input
//                       type="number"
//                       className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-w-[80px]"
//                       min={0}
//                       value={row.quantity}
//                       onChange={(e) => handleRowChange(index, "quantity", e.target.value)}
//                     />
//                   </td>
//                   <td className="p-2">
//                     <textarea
//                       className="w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-w-[150px]"
//                       value={row.description}
//                       onChange={(e) => handleRowChange(index, "description", e.target.value)}
//                       rows={1}
//                     />
//                   </td>
//                   <td className="p-2">
//                     <select
//                       className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-w-[120px]"
//                       value={row.project}
//                       onChange={(e) => handleRowChange(index, "project", e.target.value)}
//                     >
//                       <option value="">Select Project</option>
//                       {projects.map((proj) => (
//                         <option key={proj.id} value={proj.id}>
//                           {proj.code ? `${proj.code} - ` : ""}{proj.name}
//                         </option>
//                       ))}
//                     </select>
//                   </td>
//                   <td className="p-2 text-center">
//                     {index !== rows.length - 1 && (
//                       <button
//                         onClick={() => removeRow(index)}
//                         className="text-red-500 hover:text-red-700"
//                       >
//                         <MdOutlineCancel className="h-5 w-5" />
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-4 sm:space-y-0">
//           <div className="text-center sm:text-right w-full">
//             <span className="font-semibold text-gray-900">Subtotal: ${subtotal.toFixed(2)}</span>
//             <span className="ml-4 font-semibold text-gray-900">Tax: ${tax.toFixed(2)}</span>
//             <span className="ml-4 font-semibold text-gray-900">Total: ${total.toFixed(2)}</span>
//           </div>
//           <div className="flex space-x-2">
//             <button 
//                 onClick={handleRecord} 
//                 className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
//               >
//                 Record
//               </button>
//           </div>
//         </div>
//       </div>

//       {/* Modals */}
//       {showContactModal && (
//         <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-500 ${modalTransition}`} onClick={(e) => handleModalClick(e, setShowContactModal)}>
//           <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 p-2 rounded-lg max-h-[90vh] overflow-y-auto relative bg-white">
//             <button className="absolute top-2 right-2 text-xl" onClick={() => setShowContactModal(false)}><FaTimes /></button>
//             <PayerPayee />
//           </div>
//         </div>
//       )}

//       {showAccountModal && (
//         <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-500 ${modalTransition}`} onClick={(e) => handleModalClick(e, setShowAccountModal)}>
//           <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 p-2 rounded-lg max-h-[90vh] overflow-y-auto relative bg-white">
//             <button className="absolute top-2 right-2 text-xl text-gray-600" onClick={() => setShowAccountModal(false)}><FaTimes /></button>
//             <AddAccountForm />
//           </div>
//         </div>
//       )}

//       {showProjectModal && (
//         <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-500 ${modalTransition}`} onClick={(e) => handleModalClick(e, setShowProjectModal)}>
//           <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 p-2 rounded-lg max-h-[90vh] overflow-y-auto relative bg-white">
//             <button className="absolute top-2 right-2 text-xl text-gray-600" onClick={() => setShowProjectModal(false)}><FaTimes /></button>
//             <NewProjectForm />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MoneyTransaction;