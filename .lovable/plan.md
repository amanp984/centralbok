This is a 19-section overhaul. I'll break it into 3 phases so you see progress and can course-correct between phases. Each phase ends in a working preview.

## Phase 1 — Branding, Loader, Layout shell (this turn)

- Upload the new Central Bank banner from your attachment as a Lovable Asset; replace every existing logo reference (login, sidebar, dashboard header, account cards, statement PDF) with it. No white card, no border, no shadow.
- Rewrite `BrandLoader.tsx`: full-screen, blurred backdrop, dark overlay, banner image only (no card), spinner below, "Securing your session…" caption, smooth fade. 1.5s on login, 0.5–1s on navigation.
- Add route-change loader trigger inside `_authenticated/route.tsx` so every menu click feels like a real banking module opening.
- `AppShell`: add breadcrumb row + page header (title + description + module identity) reading from route meta.
- Replace login page background/branding to match the blue gradient reference; banner instead of pink logo.

## Phase 2 — Pages & Data (next turn)

- Dashboard: replace floating logo + blank cards with structured Account Overview, Customer Info, Quick Actions. Pulls real `accounts` + `profiles` row; falls back to demo profile (Rambabu Prajapati from your screenshot) when missing.
- Accounts page: 5 sections (Overview / Customer / Banking / Balance / Quick Actions) with all 18 fields. Computed monthly credits/debits/count from `transactions`.
- Settings: 6 tabs (Profile, Account Details, Security, KYC, Limits, Notifications). Wired to `user_settings` + `profiles` where possible; static-but-realistic for KYC/Security cosmetic fields.
- Payments & Transfers: Fund Transfer form + Beneficiary picker + Limits widget + Recent Transfers (last 10) + simple analytics (mode breakdown).
- Beneficiaries: favourites first, verified badge, last-transfer-date derived from transactions, add/delete.
- Limits page: ₹50L total, IMPS / NEFT / RTGS / UPI breakdown computed from real debit transactions, realtime.
- Loans / FD / Investments / Insurance: strip mock data, professional empty states.

## Phase 3 — Statements PDF, SMS, Legal, QA (final turn)

- Statement PDF rebuilt with `jspdf` + `jspdf-autotable` to match the uploaded template (banner header, summary box, transaction table with running balance, footer + page number).
- `/api/sms` webhook: x-webhook-secret check against `SMS_WEBHOOK_SECRET`; parser extracts type/mode/amount/name/account/reference for UPI/IMPS/NEFT/RTGS credit & debit; inserts into `transactions`; recalculates `accounts.balance`.
- Supabase realtime subscription on `transactions` + `accounts` so dashboard, accounts, limits, statements update live.
- Privacy / Terms / Disclaimer rewritten to 2000+ words each with the demonstration disclaimer at the end.
- Final audit pass + report.

## Decisions I'll make unless you object

- Loader image: the new banner you just attached (replaces existing asset).
- Fallback profile: uses the logged-in user's `profiles` + `accounts` row, with cosmetic-only fields (MICR, masked Aadhaar, KYC date, address) filled from realistic constants — never blank.
- `SMS_WEBHOOK_SECRET`: I'll add it as a secret at the start of Phase 3 and prompt you for the value then.
- I will NOT touch Part 2 transfer/auth functionality.

Reply "go" and I start Phase 1 immediately. If you want a different sequence or scope, tell me now.