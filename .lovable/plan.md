# Demo Admin Management Enhancements

## What will change
- Extend the existing hidden Demo Admin Panel with Account & Profile Management and Manage Transactions; do not add a separate admin page.
- Persist editable customer/account fields in the existing profile and account records so current pages and statements share one saved profile.
- Add transaction search, date/mode/direction filters, add/edit/delete forms, and explicit confirmations. Save every edit/delete to an audit history.
- Keep statements visibly marked as simulated; do not change authentication authorization or the canonical chronological balance algorithm.

## Implementation
1. Add nullable profile fields and narrowly restricted demo-admin configuration and audit storage through an additive Lovable Cloud migration.
2. Add server-only authenticated operations. Each operation verifies the existing demo admin identity; credentials remain server-side and passwords are stored only as salted hashes. The changed username/password applies to the demo login form; the connected account sign-in remains unchanged.
3. Extend the existing Settings dialog with two management sections. Transaction changes preserve IDs, validate required data, request confirmation before save/delete, and record before/after audit details.
4. Read the saved profile in Dashboard, My Accounts, Settings, account shell identity, and statement/export metadata. Invalidate existing queries after saves; rely on existing realtime and polling for ledger changes and balance recalculation.
5. Run the focused transaction tests, typecheck, preview build, and authenticated browser checks for profile persistence, credential login, transaction CRUD, recalculated balance, statement display, and exports. Recheck whether the reported `utils.ts` error reproduces.

## Technical details
- Reuse `profiles`, `accounts`, and `transactions`; add no replacement ledger or public admin route.
- Restrict protected server operations to the existing demo user ID and require the current authenticated middleware. Keep password hashes and audit writes off the client.
- New public tables receive explicit grants, RLS, and demo-admin-only read access; credential storage is server-only.
- Existing transaction descriptions remain the saved narration shown in the UI and exports. Existing records are untouched until an admin explicitly edits or deletes one.
