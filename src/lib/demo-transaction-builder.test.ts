import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTransactionDescription,
  demoTransactionSchema,
  type DemoTransactionInput,
} from "@/lib/demo-transaction-builder";

const baseInput: DemoTransactionInput = {
  transactionType: "Debit",
  paymentMode: "UPI",
  upiNarrationType: "standard",
  amount: 1250,
  name: "Asha Traders",
  upiId: "asha@upi",
  accountSuffix: "4321",
  reference: "UTR123456",
  accountNumber: "1234567894321",
  ifsc: "CBIN0001234",
  bankDetails: "BANKREF7788",
};

describe("demo transaction narration", () => {
  it("formats UPI debit and credit from saved form details", () => {
    assert.equal(buildTransactionDescription(baseInput), "UPI/DR/UTR123456/Asha Traders/asha@upi");
    assert.equal(buildTransactionDescription({ ...baseInput, transactionType: "Credit" }), "UPI/CR/UTR123456/Asha Traders/asha@upi");
  });

  it("formats UPI P2A and account-plus-IFSC narration", () => {
    assert.equal(buildTransactionDescription({ ...baseInput, upiNarrationType: "p2a" }), "UPI/P2A/UTR123456/Asha Traders/UPI PAYMENT");
    assert.equal(buildTransactionDescription({ ...baseInput, upiNarrationType: "p2a_account" }), "UPI/P2A/UTR123456/Asha Traders/A/C XX4321/CBIN0001234");
  });

  it("formats UPI P2P narration", () => {
    assert.equal(buildTransactionDescription({ ...baseInput, upiNarrationType: "p2p" }), "UPI/P2P/UTR123456/Asha Traders/TRANSFER");
  });

  it("uses the supplied bank reference for NEFT and IMPS, falling back to UTR", () => {
    assert.equal(buildTransactionDescription({ ...baseInput, paymentMode: "NEFT" }), "NEFT Asha Traders BANKREF7788");
    assert.equal(buildTransactionDescription({ ...baseInput, paymentMode: "IMPS", bankDetails: "" }), "IMPS Asha Traders UTR123456");
  });

  it("requires account number and IFSC for UPI P2A account payments", () => {
    const parsed = demoTransactionSchema.safeParse({ ...baseInput, accountNumber: "", ifsc: "", upiNarrationType: "p2a_account" });
    assert.equal(parsed.success, false);
  });
});