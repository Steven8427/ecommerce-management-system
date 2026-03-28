# E-Commerce Management System

A full-stack e-commerce back-office management system built with **React 19** and **ThinkPHP 6**, designed for managing orders, customers, and business analytics in a streamlined admin dashboard.

## Features

### Authentication & User Management
- User registration and login with JWT-based authentication
- Role-based access control (Admin / Staff)
- Granular permission management per user
- Password reset and account status management

### Sales Order Management
- Create, edit, and track customer sales orders with detailed line items
- Item-level fields: product name, materials, dimensions, area, pricing, cost breakdown, images
- Discount and prepaid amount tracking with automatic profit calculation
- Print-ready landscape A4 output with QR payment codes and signature areas
- Order status management (pending / completed)
- Search and sort by date, amount, status

### Customer Management
- Customer database with contact information
- Customer level / tier system for loyalty tracking
- **Pending payment indicator** — highlights customers with unpaid orders, expandable to view order-level debt details with direct navigation to the order

### Material Category Management
- Category management for order item material selection

### Analytics Dashboard
- Business overview with key financial metrics (sales, cost, profit, prepaid)
- Order statistics with status breakdown
- Customer ranking by purchase volume
- Product ranking by sales performance
- Flexible time period filter (today, week, month, year, all, custom date range)

### Payment QR Code Management
- Configurable payment QR codes displayed on printed order sheets

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19, CSS, Fetch API            |
| Backend  | ThinkPHP 6 (PHP 7.2+)              |
| Database | MySQL 5.7+                          |
| Auth     | JWT (Bearer Token)                  |

## Project Structure

```
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.js                 # Main app with tab navigation & auth
│   │   │   ├── LoginPage.jsx          # Authentication page
│   │   │   ├── SalesOrderPage.jsx     # Sales order CRUD, print, detail view
│   │   │   ├── CustomerPage.jsx       # Customer & tier management, debt tracking
│   │   │   ├── StatsPage.jsx          # Analytics dashboard
│   │   │   ├── UserManagePage.jsx     # User & permission management (admin)
│   │   │   └── Toast.jsx              # Notification component
│   │   ├── styles/index.css    # Global styles
│   │   └── api.js              # Centralized API client
│   └── public/
│
├── backend/                   # ThinkPHP 6 API server
│   ├── app/
│   │   ├── controller/        # API controllers
│   │   ├── model/             # ORM models
│   │   └── middleware/        # CORS & auth middleware
│   ├── config/                # App, database & routing config
│   ├── route/app.php          # RESTful API route definitions
│   └── public/                # Static assets & entry point
│
├── start.bat                  # One-click start (frontend + backend)
└── stop.bat                   # One-click stop
```

## API Endpoints

| Group        | Endpoint                        | Method   | Description                |
|--------------|---------------------------------|----------|----------------------------|
| **Auth**     | `/auth/login`                   | POST     | User login                 |
|              | `/auth/register`                | POST     | User registration          |
|              | `/auth/info`                    | GET      | Get current user info      |
|              | `/auth/users`                   | GET      | List all users             |
| **Sales**    | `/sales/list`                   | GET      | List sales orders          |
|              | `/sales/create`                 | POST     | Create sales order         |
|              | `/sales/update/:id`             | POST     | Update sales order         |
|              | `/sales/detail/:id`             | GET      | Get order detail           |
|              | `/sales/delete/:id`             | DELETE   | Delete sales order         |
|              | `/sales/status/:id`             | POST     | Update order status        |
| **Customers**| `/customer/list`                | GET      | List customers             |
|              | `/customer/add`                 | POST     | Add customer               |
|              | `/customer/update/:id`          | PUT      | Update customer            |
|              | `/customer/delete/:id`          | DELETE   | Delete customer            |
|              | `/customer/debts`               | GET      | Customer pending payments  |
|              | `/customer/levels`              | GET      | List customer tiers        |
| **Categories**| `/product/categories`          | GET      | List material categories   |
|              | `/product/category/add`         | POST     | Add category               |
|              | `/product/category/delete/:id`  | DELETE   | Delete category            |
| **Stats**    | `/stats/overview`               | GET      | Dashboard overview         |
| **QR Codes** | `/qrcode/list`                  | GET      | List payment QR codes      |
|              | `/qrcode/add`                   | POST     | Add QR code                |
| **Upload**   | `/upload/image`                 | POST     | Upload image               |

## Getting Started

### Prerequisites

- PHP 7.2+ (compatible with PHP 8.1)
- Node.js 16+
- MySQL 5.7+
- Composer

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Steven8427/ecommerce-management-system.git
   cd ecommerce-management-system
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   composer install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure the database**

   Edit `backend/config/database.php` with your MySQL connection details:
   ```php
   'hostname' => '127.0.0.1',
   'database' => 'your_database',
   'username' => 'your_username',
   'password' => 'your_password',
   ```

5. **Start the application**

   On Windows, simply double-click `start.bat` to launch both the frontend and backend servers.

   Or start them manually:
   ```bash
   # Backend (from backend/)
   php think run --port 108

   # Frontend (from frontend/)
   npm start
   ```

## License

This project is licensed under a **custom view-only license**. You may view and study the source code for personal and educational purposes only. Commercial use, copying, and redistribution are **not permitted**. See [LICENSE.txt](LICENSE.txt) for details.
