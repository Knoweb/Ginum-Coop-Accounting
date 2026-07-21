export const isCoopAccountingMode = String(import.meta.env.VITE_COOP_ACCOUNTING_MODE).toLowerCase() === "true";

console.log("COOP_ACCOUNTING_MODE =", import.meta.env.VITE_COOP_ACCOUNTING_MODE, isCoopAccountingMode);
