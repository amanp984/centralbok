import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_DEMO_STATEMENT_DISCLOSURE, DEFAULT_DEMO_STATEMENT_TITLE, demoProfileUpdateSchema, demoStatementDisclosureSchema, demoStatementTitleSchema, demoTransactionChangeSchema, resolveDemoStatementDisclosure } from "@/lib/demo-admin-schema";
import { buildTransactionsPDF } from "@/lib/exports";

const validTransaction = {
  action: "add" as const,
  amount: 250,
  direction: "debit" as const,
  mode: "UPI" as const,
  beneficiaryName: "Demo Recipient",
  upiId: "recipient@upi",
  beneficiaryAccount: "",
  beneficiaryIfsc: "",
  reference: "DEMO-UTR-20261114",
  description: "DEMO / SIMULATED UPI debit",
  createdAt: "2026-11-14T06:00:00.000Z",
};

describe("demo admin validation", () => {
  it("uses the requested statement title by default", () => {
    assert.equal(DEFAULT_DEMO_STATEMENT_TITLE, "DEMO STATEMENT OF ACCOUNT");
  });

  it("requires a visible statement disclosure and applies the requested default", () => {
    assert.equal(DEFAULT_DEMO_STATEMENT_DISCLOSURE, "DEMO RECORD – NOT BANK-ISSUED OR BANK-VERIFIED");
    const completeText = "SIMULATED DEMO STATEMENT - NOT BANK-ISSUED OR BANK-VERIFIED";
    assert.equal(demoStatementDisclosureSchema.parse(`  ${completeText}  `), completeText);
    assert.equal(demoStatementDisclosureSchema.safeParse("   ").success, false);
    assert.equal(demoStatementDisclosureSchema.safeParse("x".repeat(161)).success, false);
    assert.equal(demoStatementDisclosureSchema.safeParse("SIMULATED RECORD - FOR TESTING ONLY").success, false);
    assert.equal(resolveDemoStatementDisclosure(completeText), completeText);
    assert.equal(resolveDemoStatementDisclosure(""), DEFAULT_DEMO_STATEMENT_DISCLOSURE);
  });

  it("writes the complete saved disclosure exactly once in the generated PDF", async () => {
    const disclosure = "SIMULATED DEMO STATEMENT - NOT BANK-ISSUED OR BANK-VERIFIED";
    const pdf = await buildTransactionsPDF([], {
      customerName: "Demo User",
      accountNumber: "",
      ifsc: "",
      statementDisclosureText: disclosure,
    });
    const output = pdf.internal.pages.flat().join("\n");
    assert.equal(output.match(/SIMULATED DEMO STATEMENT/g)?.length, 1);
    assert.equal(output.includes(`${disclosure} - DEMO`), false);
  });

  it("accepts a trimmed statement title of up to 80 characters and rejects blank or longer values", () => {
    assert.equal(demoStatementTitleSchema.parse("  Monthly Demo Statement  "), "Monthly Demo Statement");
    assert.equal(demoStatementTitleSchema.safeParse(" ").success, false);
    assert.equal(demoStatementTitleSchema.safeParse("x".repeat(81)).success, false);
  });

  it("accepts a valid demo profile and an eight-character password update", () => {
    const result = demoProfileUpdateSchema.safeParse({
      fullName: "Demo User",
      email: "demo@example.test",
      mobile: "",
      customerId: "",
      accountNumber: "1234567890",
      accountType: "Current Account",
      ifsc: "CBIN0001234",
      branch: "Demo Branch",
      branchAddress: "",
      communicationAddress: "",
      username: "demo-user",
      password: "demo-pass-1",
    });
    assert.equal(result.success, true);
  });

  it("rejects a new demo password shorter than eight characters", () => {
    const result = demoProfileUpdateSchema.safeParse({
      fullName: "Demo User",
      email: "demo@example.test",
      mobile: "",
      customerId: "",
      accountNumber: "1234567890",
      accountType: "Current Account",
      ifsc: "CBIN0001234",
      branch: "Demo Branch",
      branchAddress: "",
      communicationAddress: "",
      username: "demo-user",
      password: "short",
    });
    assert.equal(result.success, false);
  });

  it("requires a positive amount, description, reference, and timestamp for adds", () => {
    const noAmount = demoTransactionChangeSchema.safeParse({ ...validTransaction, amount: 0 });
    const noReference = demoTransactionChangeSchema.safeParse({ ...validTransaction, reference: "" });
    const noDescription = demoTransactionChangeSchema.safeParse({ ...validTransaction, description: "" });
    assert.equal(noAmount.success, false);
    assert.equal(noReference.success, false);
    assert.equal(noDescription.success, false);
  });

  it("requires a new UPI ID and unique transaction ID when editing", () => {
    const missingUpi = demoTransactionChangeSchema.safeParse({ ...validTransaction, upiId: "" });
    const missingEditId = demoTransactionChangeSchema.safeParse({ ...validTransaction, action: "update" });
    assert.equal(missingUpi.success, false);
    assert.equal(missingEditId.success, false);
  });

  it("accepts a validated existing IMPS credit update while preserving its ID", () => {
    const result = demoTransactionChangeSchema.safeParse({
      action: "update",
      id: "80634f33-ac71-4533-b729-12f0938046e8",
      amount: 400,
      direction: "credit",
      mode: "IMPS",
      beneficiaryName: "Demo Sender",
      beneficiaryAccount: "1234567890",
      beneficiaryIfsc: "CBIN0001234",
      reference: "DEMO-IMPS-20261114",
      description: "DEMO / SIMULATED IMPS credit",
      createdAt: "2026-11-14T06:00:00.000Z",
    });
    assert.equal(result.success, true);
  });
});