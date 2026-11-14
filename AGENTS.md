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
- Store demo sign-in credentials as a server-side salted password hash and never return or log password values; profile email is display data and must not rotate the connected auth identity.
- Reuse the existing accounts, profiles, and transactions records for demo administration; preserve canonical chronological balance calculation and audit every admin transaction change.
- Store editable demo statement titles and disclosure wording in the existing user settings record, enforce access in authenticated fixed-demo-user server functions, and always append the immutable demo/not-bank-issued notice to PDF exports.
