<<<<<<< HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
=======
# SeatSync Frontend

## Getting Started

1. Ensure Node.js 24 LTS is installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:5173`.

## Features
- Modern, dynamic UI built with React + Vite + Tailwind CSS
- 100% Frontend Prototype using LocalStorage & BroadcastChannel
- Complete Waiting List module with automatic seat allocation on cancellation
- Interactive visual seat map with real-time slot availability
- QR Pass generation with print & check-in simulation

> [!NOTE]
> **Prototype Architecture & Concurrency Disclaimer**: The waiting list queue allocation uses a short-lived LocalStorage lock (`seatsync_waitlist_allocation_lock`) and `BroadcastChannel` to simulate cross-tab queue allocation in this frontend prototype. In a production deployment, queue allocation must be performed inside a database transaction with ACID isolation and unique index constraints.

## Available Test Accounts
- **Student ID:** `24AD042` / **Password:** `Student@123`
- **Librarian ID:** `LIB-001` / **Password:** `Admin@123`
- **Admin ID:** `ADM-001` / **Password:** `Admin@123`
>>>>>>> main
