import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Transaction } from "@/hooks/use-banking-data";
import { formatDateTime, formatINR } from "./banking";
import logoAsset from "@/assets/brand-logo.png.asset.json";

type ExportMeta = {
  customerName: string;
  accountNumber: string;
  ifsc: string;
  cif?: string;
  branch?: string;
  openingBalance?: number;
  closingBalance?: number;
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

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(logoAsset.url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportTransactionsPDF(transactions: Transaction[], meta: ExportMeta, filename = "statement.pdf") {
  const doc = new jsPDF();
  const PRIMARY: [number, number, number] = [11, 77, 162];
  const TEXT: [number, number, number] = [31, 42, 68];
  const MUTED: [number, number, number] = [110, 120, 140];
  const pageW = doc.internal.pageSize.width;

  // Header band
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 34, "F");

  const logo = await loadLogoDataUrl();
  if (logo) {
    try { doc.addImage(logo, "PNG", 12, 6, 22, 22); } catch { /* ignore */ }
  }
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("CENTRAL BANK OF INDIA", 38, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Account Statement", 38, 22);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 38, 28);

  // Customer / account block
  doc.setTextColor(...TEXT);
  let y = 44;
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("Account Holder", 14, y);
  doc.text("Account Number", pageW / 2, y);
  doc.setFont("helvetica", "normal");
  doc.text(meta.customerName, 14, y + 5);
  doc.text(meta.accountNumber, pageW / 2, y + 5);
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("CIF", 14, y);
  doc.text("IFSC", pageW / 4 + 5, y);
  doc.text("Branch", pageW / 2, y);
  doc.text("Period", (3 * pageW) / 4, y);
  doc.setFont("helvetica", "normal");
  doc.text(meta.cif ?? "—", 14, y + 5);
  doc.text(meta.ifsc, pageW / 4 + 5, y + 5);
  doc.text(meta.branch ?? "—", pageW / 2, y + 5);
  doc.text(`${meta.fromDate ?? "—"} → ${meta.toDate ?? "—"}`, (3 * pageW) / 4, y + 5);
  y += 10;

  // Summary
  const totals = transactions.reduce(
    (a, t) => { if (t.direction === "credit") a.cr += Number(t.amount); else a.dr += Number(t.amount); return a; },
    { cr: 0, dr: 0 }
  );
  const opening = meta.openingBalance ?? (transactions.length ? Number(transactions[transactions.length - 1].running_balance ?? 0) - (transactions[transactions.length - 1].direction === "credit" ? Number(transactions[transactions.length - 1].amount) : -Number(transactions[transactions.length - 1].amount)) : 0);
  const closing = meta.closingBalance ?? (transactions.length ? Number(transactions[0].running_balance ?? 0) : opening);

  doc.setDrawColor(220);
  doc.setFillColor(244, 247, 252);
  doc.roundedRect(14, y, pageW - 28, 22, 2, 2, "FD");
  doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text("OPENING BALANCE", 18, y + 6);
  doc.text("CLOSING BALANCE", 60, y + 6);
  doc.text("TOTAL CREDITS", 105, y + 6);
  doc.text("TOTAL DEBITS", 140, y + 6);
  doc.text("TXN COUNT", 175, y + 6);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...TEXT);
  doc.text(formatINR(opening), 18, y + 14);
  doc.text(formatINR(closing), 60, y + 14);
  doc.setTextColor(0, 130, 70); doc.text(formatINR(totals.cr), 105, y + 14);
  doc.setTextColor(180, 30, 30); doc.text(formatINR(totals.dr), 140, y + 14);
  doc.setTextColor(...TEXT); doc.text(String(transactions.length), 175, y + 14);
  y += 26;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Description", "Reference", "Debit", "Credit", "Balance"]],
    body: transactions.map((t) => [
      formatDateTime(t.created_at),
      t.description ?? t.beneficiary_name ?? t.mode,
      t.reference,
      t.direction === "debit" ? formatINR(t.amount) : "",
      t.direction === "credit" ? formatINR(t.amount) : "",
      formatINR(t.running_balance ?? 0),
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 253] },
    columnStyles: {
      3: { halign: "right", textColor: [180, 30, 30] },
      4: { halign: "right", textColor: [0, 130, 70] },
      5: { halign: "right", fontStyle: "bold" },
    },
    didDrawPage: () => {
      const ph = doc.internal.pageSize.height;
      doc.setFontSize(7); doc.setTextColor(...MUTED);
      doc.text("Central Bank of India · Andheri East, Mumbai · This is a computer-generated statement and does not require a signature.", 14, ph - 8);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageW - 22, ph - 8);
    },
  });

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
