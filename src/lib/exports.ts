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

// jsPDF's built-in helvetica can't render ₹ or other unicode glyphs; use ASCII "Rs."
const formatRs = (n: number) =>
  "Rs. " +
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
const sanitize = (s: string) =>
  String(s ?? "")
    .replace(/₹/g, "Rs.")
    .replace(/[→➔➜]/g, "->")
    .replace(/[·•]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // strip any other non-printable / non-latin1 chars that helvetica can't render
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");

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
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PRIMARY: [number, number, number] = [11, 77, 162];
  const TEXT: [number, number, number] = [31, 42, 68];
  const MUTED: [number, number, number] = [110, 120, 140];
  const pageW = doc.internal.pageSize.width; // 210
  const M = 14;

  // Top banner: logo on left, contact lines on right
  const logo = await loadLogoDataUrl();
  if (logo) {
    try { doc.addImage(logo, "PNG", M, 10, 70, 22); } catch { /* ignore */ }
  }
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  const rightX = pageW - M;
  doc.text("Tel: 1800 22 1911 / 1911", rightX, 14, { align: "right" });
  doc.text("Email: central.bank@cbi.co.in", rightX, 20, { align: "right" });
  doc.text("Web: www.centralbankofindia.co.in", rightX, 26, { align: "right" });

  // Title
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(...PRIMARY);
  doc.text("STATEMENT OF ACCOUNT", pageW / 2, 44, { align: "center" });

  // Customer details + summary box
  const blockY = 54;
  doc.setTextColor(...TEXT);
  doc.setFontSize(9.5);
  const details: Array<[string, string]> = [
    ["Customer Name", sanitize(meta.customerName)],
    ["Account Number", sanitize(meta.accountNumber)],
    ["Account Type", "SAVINGS ACCOUNT"],
    ["IFSC Code", sanitize(meta.ifsc)],
    ["CIF", sanitize(meta.cif ?? "-")],
    ["Branch", sanitize(meta.branch ?? "-")],
  ];
  details.forEach(([k, v], i) => {
    const yy = blockY + i * 6;
    doc.setFont("helvetica", "bold"); doc.text(k, M, yy);
    doc.setFont("helvetica", "normal"); doc.text(":", M + 32, yy);
    doc.text(v, M + 36, yy);
  });

  // Summary panel on right
  const sx = pageW / 2 + 4;
  const sw = pageW - M - sx;
  const sh = 40;
  doc.setDrawColor(...PRIMARY); doc.setFillColor(245, 249, 254);
  doc.roundedRect(sx, blockY - 6, sw, sh, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...PRIMARY);
  doc.text("Statement Summary", sx + 3, blockY - 1);

  const totals = transactions.reduce(
    (a, t) => { if (t.direction === "credit") a.cr += Number(t.amount); else a.dr += Number(t.amount); return a; },
    { cr: 0, dr: 0 }
  );
  const last = transactions[transactions.length - 1];
  const first = transactions[0];
  const opening = meta.openingBalance ?? (last ? Number(last.running_balance ?? 0) - (last.direction === "credit" ? Number(last.amount) : -Number(last.amount)) : 0);
  const closing = meta.closingBalance ?? (first ? Number(first.running_balance ?? 0) : opening);

  doc.setTextColor(...TEXT); doc.setFontSize(9);
  const sRows: Array<[string, string]> = [
    ["Statement Period", `${sanitize(meta.fromDate ?? "-")} to ${sanitize(meta.toDate ?? "-")}`],
    ["Opening Balance", formatRs(opening)],
    ["Total Deposits", formatRs(totals.cr)],
    ["Total Withdrawals", formatRs(totals.dr)],
    ["Closing Balance", formatRs(closing)],
  ];
  sRows.forEach(([k, v], i) => {
    const yy = blockY + 5 + i * 6;
    doc.setFont("helvetica", "bold"); doc.text(k, sx + 3, yy);
    doc.setFont("helvetica", "normal"); doc.text(":", sx + 36, yy);
    doc.text(v, sx + 39, yy);
  });

  const tableY = blockY + 6 * details.length + 6;

  autoTable(doc, {
    startY: tableY,
    head: [["Date", "Narration", "Cheque/Ref No.", "Withdrawals (Rs.)", "Deposits (Rs.)", "Balance (Rs.)"]],
    body: transactions.map((t) => [
      sanitize(formatDateTime(t.created_at)),
      sanitize(t.description ?? t.beneficiary_name ?? t.mode),
      sanitize(t.reference),
      t.direction === "debit" ? formatRs(t.amount) : "-",
      t.direction === "credit" ? formatRs(t.amount) : "-",
      formatRs(t.running_balance ?? 0),
    ]),
    styles: { fontSize: 8.5, cellPadding: 2.5, overflow: "linebreak", valign: "middle", lineColor: [210, 218, 230], lineWidth: 0.1 },
    headStyles: { fillColor: [255, 255, 255], textColor: PRIMARY, fontStyle: "bold", lineColor: PRIMARY, lineWidth: 0.3, halign: "center" },
    bodyStyles: { textColor: TEXT },
    alternateRowStyles: { fillColor: [249, 251, 254] },
    columnStyles: {
      0: { cellWidth: 22, halign: "left" },
      1: { cellWidth: 50 },
      2: { cellWidth: 32 },
      3: { cellWidth: 27, halign: "right" },
      4: { cellWidth: 27, halign: "right" },
      5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
    },
    margin: { left: M, right: M },
    didDrawPage: () => {
      const ph = doc.internal.pageSize.height;
      doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text("* This is a computer generated statement and does not require any signature.", M, ph - 14);
      doc.text("Thank you for banking with Central Bank of India.", pageW / 2, ph - 8, { align: "center" });
      doc.text(`Page ${doc.getNumberOfPages()}`, pageW - M, ph - 8, { align: "right" });
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
