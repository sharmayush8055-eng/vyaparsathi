# 🏪 VyaparSathi — Your Business Partner

**VyaparSathi** (व्यापार साथी) is a simple, affordable, and integrated digital platform built for India's small and micro businesses — retailers, wholesalers, service providers, and home-based businesses. It brings billing, inventory, customer credit (Khata), expense tracking, and business analytics onto a single, easy-to-use platform.

Built for **Smart India Hackathon (SIH)** using the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).

---

## 🎯 Problem Statement

Millions of small businesses in India still manage operations using notebooks, handwritten bills, and calculators, leading to:
- Manual, error-prone billing
- No accurate inventory visibility (stockouts / overstocking)
- Credit (Khata) tracked in physical notebooks — hard to monitor
- No single view of sales, expenses, and profit

**VyaparSathi** solves this by digitizing these disconnected processes into one integrated, simple-to-use system.

---

## ✨ Key Features

| Module | Description |
|---|---|
| 🧾 **Digital Billing / POS** | Fast, tap-to-bill invoicing. Auto-calculates tax, discount & totals. Auto-generates invoice numbers. |
| 📦 **Inventory Management** | Track stock in real time. Get low-stock alerts. Sales automatically reduce stock. |
| 👥 **Customer & Supplier Records** | Maintain contact details and transaction history for every customer/supplier. |
| 💰 **Credit / Khata Management** | Digital version of the traditional credit notebook — track who owes what and record payments. |
| 📉 **Expense Tracking** | Log business expenses by category (Rent, Salary, Utilities, etc.) |
| 📊 **Business Analytics Dashboard** | Daily/monthly revenue, estimated profit, outstanding credit, top-selling products, sales trend charts. |
| 🔐 **Secure Authentication** | JWT-based login system, each business's data is fully isolated. |
| 📱 **Responsive UI** | Works smoothly on mobile, tablet, and desktop — ideal for shop owners on the go. |

---

## 🛠️ Tech Stack

**Frontend:** React 18 (Vite), React Router, Tailwind CSS, Recharts (analytics charts), Axios, Lucide Icons, React Hot Toast

**Backend:** Node.js, Express.js, MongoDB with Mongoose, JWT Authentication, Bcrypt.js

**Architecture:** RESTful API, MVC pattern, role-based access control (owner/staff ready)

---

## 📁 Project Structure

```
vyaparsathi/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Business logic (auth, products, sales, customers, expenses, dashboard)
│   ├── middleware/      # JWT auth, error handling
│   ├── models/          # Mongoose schemas (User, Product, Customer, Sale, Payment, Expense)
│   ├── routes/          # Express routes
│   ├── server.js        # App entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios instance with JWT interceptor
│   │   ├── components/   # Sidebar, Navbar, Layout, StatCard, ProtectedRoute
│   │   ├── context/       # AuthContext (global auth state)
│   │   ├── pages/         # Login, Register, Dashboard, Billing, Inventory, Customers, Expenses, Reports
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started (Setup in VS Code)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) installed locally **OR** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster
- VS Code (recommended)

### 1️⃣ Clone / Open the Project
Open the `vyaparsathi` folder in VS Code.

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder (copy from `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/vyaparsathi
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

> If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

Start the backend server:

```bash
npm run dev
```

The API will run at `http://localhost:5000`.

### 3️⃣ Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

The app will run at `http://localhost:5173` (Vite auto-proxies `/api` requests to the backend).

### 4️⃣ Use the App
1. Open `http://localhost:5173`
2. Click **"Create an account"** and register your business
3. Start adding products, generating bills, and tracking your Khata!

---

## 🔌 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new business |
| POST | `/api/auth/login` | Login |
| GET/PUT | `/api/auth/me` | Get / update profile |
| GET/POST | `/api/products` | List / add products |
| PUT/DELETE | `/api/products/:id` | Update / delete product |
| GET/POST | `/api/customers` | List / add customers |
| POST | `/api/customers/:id/payments` | Record credit/payment (Khata entry) |
| GET/POST | `/api/sales` | List / create a bill (auto-updates stock & credit) |
| GET/POST | `/api/expenses` | List / add expenses |
| GET | `/api/dashboard/summary` | Business analytics summary |
| GET | `/api/dashboard/sales-trend` | 7-day sales trend for charts |

All routes (except register/login) require a `Authorization: Bearer <token>` header.

---

## 💡 How Billing Auto-Updates Everything

When a sale is created via `/api/sales`:
1. Stock quantity for each product is **automatically reduced**.
2. If payment mode is `credit` and not fully paid, the **customer's Khata balance increases** automatically and a ledger entry is created.
3. An **invoice number** is auto-generated (e.g. `INV-0001`).
4. Dashboard analytics (revenue, profit, top products) update in real time based on this data — no repetitive manual entry needed.

---

## 🗺️ Future Roadmap (Ideas for SIH Pitch)

- WhatsApp/SMS invoice sharing & payment reminders
- Barcode scanning for billing
- Multi-language support (Hindi, regional languages)
- GST-compliant invoice generation & filing assistance
- Offline-first PWA mode for low-connectivity areas
- Supplier purchase order management
- Multi-staff role-based access (cashier, manager)

---

## 👥 Team

Built as a submission for **Smart India Hackathon (SIH)**.

---

## 📄 License

This project is built for educational and hackathon purposes.
"# vyparsathi" 
