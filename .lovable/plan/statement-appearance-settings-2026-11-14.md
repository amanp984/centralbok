# Statement Appearance Settings

## What will change
- Add a Statement Appearance tab to the existing protected Demo Admin Panel.
- Let the authorized demo admin save a statement title in the existing account settings record.
- Use the saved title for newly generated PDF statements, with the default title when none is saved.
- Keep the separate demo disclosure permanently visible, preserve its position, and restore the title's dark blue color.

## Implementation
1. Add a defaulted title field to the existing settings record through an additive database migration.
2. Add fixed-demo-user-verified server functions to load and save that title; never accept writes based only on the hidden UI gesture.
3. Add the title editor to the existing admin panel and connect the statement export page to the saved setting.
4. Validate persistence across refresh, PDF title/disclosure output, and the existing typecheck/build signal; investigate the reported `utils.ts` type error.
