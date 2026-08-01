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
