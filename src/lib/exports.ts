import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Transaction } from "@/hooks/use-banking-data";
import { formatDateTime, formatINR } from "./banking";
import { DEMO_PROFILE } from "./demo-user";
import logoAsset from "@/assets/brand-logo.png.asset.json";

type ExportMeta = {
  customerName: string;
  accountNumber: string;
  ifsc: string;
  fromDate?: string;
  toDate?: string;
};

export function exportTransactionsCSV(transactions: Transaction[], filename = "statement.csv") {
  const headers = ["Date", "Reference", "Description", "Mode", "Direction", "Amount (INR)", "Balance (INR)"];
  const rows = transactions.map((t) => [
    formatDateTime(t.created_at),
    t.reference,
    (t.description ?? t.beneficiary_name ?? "").replace(/,/g, " "),
    t.mode,
    t.direction.toUpperCase(),
    t.amount.toFixed(2),
    (t.running_balance ?? 0).toFixed(2),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}

export function exportTransactionsExcel(transactions: Transaction[], filename = "statement.xlsx") {
  const data = transactions.map((t) => ({
    Date: formatDateTime(t.created_at),
    Reference: t.reference,
    Description: t.description ?? t.beneficiary_name ?? "",
    Mode: t.mode,
    Direction: t.direction.toUpperCase(),
    "Amount (INR)": Number(t.amount.toFixed(2)),
    "Balance (INR)": Number((t.running_balance ?? 0).toFixed(2)),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Statement");
  XLSX.writeFile(wb, filename);
}

export function exportTransactionsPDF(transactions: Transaction[], meta: ExportMeta, filename = "statement.pdf") {
  const doc = new jsPDF();
  // Header
  doc.setFillColor(11, 77, 162);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("CENTRAL BANK OF INDIA", 14, 12);
  doc.setFontSize(10);
  doc.text("Account Statement", 14, 20);

  doc.setTextColor(31, 42, 68);
  doc.setFontSize(10);
  let y = 36;
  doc.text(`Customer: ${meta.customerName}`, 14, y);
  doc.text(`A/C No: ${meta.accountNumber}`, 120, y); y += 6;
  doc.text(`IFSC: ${meta.ifsc}`, 14, y);
  if (meta.fromDate || meta.toDate) doc.text(`Period: ${meta.fromDate ?? "—"} to ${meta.toDate ?? "—"}`, 120, y);
  y += 4;

  autoTable(doc, {
    startY: y + 4,
    head: [["Date", "Reference", "Description", "Mode", "Dr/Cr", "Amount", "Balance"]],
    body: transactions.map((t) => [
      formatDateTime(t.created_at),
      t.reference,
      t.description ?? t.beneficiary_name ?? "",
      t.mode,
      t.direction.toUpperCase(),
      formatINR(t.amount),
      formatINR(t.running_balance ?? 0),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [11, 77, 162], textColor: 255 },
    alternateRowStyles: { fillColor: [244, 247, 252] },
  });

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("This is a computer-generated statement and does not require a signature.", 14, doc.internal.pageSize.height - 10);
  doc.save(filename);
}

export function exportTransactionReceiptPDF(t: Transaction, meta: ExportMeta, filename = "receipt.pdf") {
  const doc = new jsPDF();
  doc.setFillColor(11, 77, 162);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("CENTRAL BANK OF INDIA", 14, 12);
  doc.setFontSize(10);
  doc.text("Transaction Receipt", 14, 20);

  doc.setTextColor(31, 42, 68);
  doc.setFontSize(11);
  let y = 44;
  const row = (k: string, v: string) => { doc.setFont("helvetica","bold"); doc.text(k, 14, y); doc.setFont("helvetica","normal"); doc.text(v, 80, y); y += 8; };
  row("Status", t.direction === "debit" ? "DEBIT — SUCCESS" : "CREDIT — SUCCESS");
  row("Reference No.", t.reference);
  row("Date & Time", formatDateTime(t.created_at));
  row("Mode", t.mode);
  row("Amount", formatINR(t.amount));
  row("From Account", meta.accountNumber);
  if (t.beneficiary_name) row("Beneficiary", t.beneficiary_name);
  if (t.beneficiary_account) row("Beneficiary A/C", t.beneficiary_account);
  if (t.beneficiary_ifsc) row("Beneficiary IFSC", t.beneficiary_ifsc);
  if (t.description) row("Remarks", t.description);
  row("Running Balance", formatINR(t.running_balance ?? 0));

  doc.setFontSize(8); doc.setTextColor(100);
  doc.text("This is a computer-generated receipt and does not require a signature.", 14, doc.internal.pageSize.height - 10);
  doc.save(filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
