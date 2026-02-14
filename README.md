# Project README & Setup Guide

## Inventory Automation & Consumption Analytics System

### 🚀 Quick Start

**Prerequisites**: Node.js and PostgreSQL installed.

1.  **Database Setup**:
    -   Ensure PostgreSQL is running.
    -   Update `backend/.env` with your DB credentials if needed.
    -   Run `cd backend && node setup_database.js` (Already done).

2.  **Start Backend**:
    ```bash
    cd backend
    npm start
    # Runs on http://localhost:5000
    ```

3.  **Start Frontend**:
    ```bash
    cd frontend
    npm run dev
    # Runs on http://localhost:5173
    ```

4.  **Login Credentials**:
    -   **Username**: `admin`
    -   **Password**: [You create this on first register via API or seed data]
    -   *Note: Since there's no UI for register in this MVP (Admin only), use Postman to POST /api/auth/register or I can add a seed script.*

### 📚 API Documentation
-   `POST /api/auth/login` - Get JWT
-   `GET /api/components` - List Inventory
-   `POST /api/production` - Record Production (Auto-deduct)
-   ... (See source code for full list)

### 🏗️ Architecture
-   **Backend**: Node.js, Express, PostgreSQL (Transactions for reliability).
-   **Frontend**: React, TailwindCSS, Recharts.

### 24-Hour Hackathon Deliverable
Built by [Your Name/Team] for Electrolyte Solutions.
