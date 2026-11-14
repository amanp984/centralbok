<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep demo-admin account/profile and transaction mutations in authenticated server functions that verify the fixed demo user; this prevents the hidden Settings trigger from becoming an authorization bypass.
- Store demo sign-in credentials as server-side salted PBKDF2-SHA256 hashes using a Worker-compatible implementation; preserve saved hashes when passwords are blank, never return or log passwords, and keep profile email separate from the connected auth identity.
- Reuse the existing accounts, profiles, and transactions records for demo administration; preserve canonical chronological balance calculation and audit every admin transaction change.
- Store editable demo statement titles and complete disclosure wording in the existing user settings record; enforce fixed-demo-user access and validate that saved wording retains the demo/not-bank-issued/not-bank-verified notice, without appending extra PDF text.
