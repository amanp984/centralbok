# Demo transaction narration

## Scope
- Keep the existing transaction builder and its authorization intact; the current form supports adding transactions but has no transaction-edit flow.
- Generate exact saved narration text for NEFT, IMPS, standard UPI Debit/Credit, UPI P2P, and UPI P2A using only supplied form values.
- Add a UPI narration-style choice so P2P/P2A formats are explicit; require the account and IFSC details for P2A.
- Keep the persisted description as the source used by the transaction list, Statements, and exports. Do not modify existing transactions or balance logic.
- Add focused tests for narration formats and required UPI P2A data.

## Implementation details
- Update `src/lib/demo-transaction-builder.ts` for validation and narration generation; update the existing Settings builder UI to select and preview the UPI style.
- Keep `src/lib/demo-transactions.functions.ts` inserting one new row with the generated description; no schema change is needed.
- Verify with the focused test and TypeScript typecheck. The reported `src/lib/utils.ts` error is not reproducible in the current checkout.
