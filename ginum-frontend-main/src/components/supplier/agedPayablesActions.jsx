export const ROUTES = {
  createBill: "/supplier/purchase/new",
  addPayment: "/bank/spend-money",
};

export const exportAgedPayablesToCSV = (rows, activeTab) => {
  if (!rows || rows.length === 0) {
    alert("No data to export.");
    return;
  }

  const headers =
    activeTab === "summary"
      ? ["Supplier", "Not Due Yet", "1-30 Days", "31-60 Days", "61-90 Days", "90+ Days", "Outstanding Balance"]
      : [
          "Supplier",
          "Invoice",
          "Invoice Date",
          "Due Date",
          "Days Overdue",
          "Status",
          "Not Due Yet",
          "1-30 Days",
          "31-60 Days",
          "61-90 Days",
          "90+ Days",
          "Total Amount",
          "Balance Due",
        ];

  const csvRows = rows.map((row) => {
    if (activeTab === "summary") {
      return [
        row.supplier,
        row.notDueYet,
        row.age1,
        row.age2,
        row.age3,
        row.age4,
        row.total,
      ];
    }

    return [
      row.supplier,
      row.invoice,
      row.invoiceDate,
      row.dueDate,
      row.daysOverdue <= 0 ? "Not Due" : `${row.daysOverdue} Days`,
      row.status?.label || "-",
      row.notDueYet,
      row.age1,
      row.age2,
      row.age3,
      row.age4,
      row.total,
      row.balance,
    ];
  });

  const csvContent = [headers, ...csvRows]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `aged-payables-${activeTab}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const goToCreateBill = (navigate) => {
  navigate(ROUTES.createBill);
};

export const goToAddPayment = (navigate) => {
  navigate(ROUTES.addPayment);
};