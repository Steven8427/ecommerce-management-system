# E-Commerce Management System

A full-stack e-commerce back-office management system built with **React 19** and **ThinkPHP 6**, designed for managing products, orders, customers, and suppliers in a streamlined admin dashboard.

## Features

### Authentication & User Management
- User registration and login with JWT-based authentication
- Role-based access control (Admin / Staff)
- Granular permission management per user
- Password reset and account status management

### Product Management
- Full CRUD operations for products
- Category management with hierarchical organization
- Image upload support for product photos
- Stock tracking and price management

### Order Management
- **Sales Orders** — Create, edit, and track customer sales with line items
- **Purchase Orders** — Manage supplier purchase orders and restocking
- Historical pricing lookup for products

### Customer Management
- Customer database with contact information
- Customer level / tier system for loyalty tracking
- Customer-specific sales history

### Supplier Management
- Supplier directory with contact details
- Supplier-linked purchase order tracking

### Analytics Dashboard
- Business overview with key metrics
- Customer ranking by purchase volume
- Product ranking by sales performance
- Supplier ranking by order volume

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19, CSS, Fetch API            |
| Backend  | ThinkPHP 6 (PHP 7.2+)              |
| Database | MySQL                               |
| Auth     | JWT (Bearer Token)                  |

## Project Structure

```
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.js                 # Main app with routing & navbar
│   │   │   ├── LoginPage.jsx          # Authentication page
│   │   │   ├── ProductPage.jsx        # Product & category management
│   │   │   ├── CustomerPage.jsx       # Customer & tier management
│   │   │   ├── SupplierPage.jsx       # Supplier management
│   │   │   ├── SalesOrderPage.jsx     # Sales order processing
│   │   │   ├── PurchaseOrderPage.jsx  # Purchase order processing
│   │   │   ├── StatsPage.jsx          # Analytics dashboard
│   │   │   ├── UserManagePage.jsx     # User & permission management
│   │   │   └── Toast.jsx             # Notification component
│   │   ├── styles/            # CSS stylesheets
│   │   └── api.js             # Centralized API client
│   └── public/
│
├── backend/                   # ThinkPHP 6 API server
│   ├── app/
│   │   ├── controller/        # API controllers
│   │   ├── model/             # Eloquent-style ORM models
│   │   └── middleware/        # CORS & auth middleware
│   ├── config/                # App, database & routing config
│   ├── route/app.php          # RESTful API route definitions
│   └── public/                # Static assets & entry point
│
├── start.bat                  # One-click start (frontend + backend)
└── stop.bat                   # One-click stop
```

## API Endpoints

| Group       | Endpoint                        | Method   | Description               |
|-------------|---------------------------------|----------|---------------------------|
| **Auth**    | `/auth/login`                   | POST     | User login                |
|             | `/auth/register`                | POST     | User registration         |
|             | `/auth/info`                    | GET      | Get current user info     |
|             | `/auth/users`                   | GET      | List all users            |
| **Products**| `/product/list`                 | GET      | List products             |
|             | `/product/add`                  | POST     | Add product               |
|             | `/product/update/:id`           | PUT      | Update product            |
|             | `/product/delete/:id`           | DELETE   | Delete product            |
| **Customers**| `/customer/list`               | GET      | List customers            |
|             | `/customer/levels`              | GET      | List customer tiers       |
| **Suppliers**| `/supplier/list`               | GET      | List suppliers            |
| **Sales**   | `/sales/list`                   | GET      | List sales orders         |
|             | `/sales/create`                 | POST     | Create sales order        |
| **Purchase**| `/purchase/list`                | GET      | List purchase orders      |
|             | `/purchase/create`              | POST     | Create purchase order     |
| **Stats**   | `/stats/overview`               | GET      | Dashboard overview        |
|             | `/stats/customer-ranking`       | GET      | Top customers             |
|             | `/stats/product-ranking`        | GET      | Top products              |
| **Upload**  | `/upload/image`                 | POST     | Upload product image      |

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

5. **Run database migrations**

   Import the SQL files in the `backend/` directory to set up the required tables:
   ```
   create_users_table.sql
   create_customer_level_table.sql
   update_product_table.sql
   update_sales_orders_table.sql
   ```

6. **Start the application**

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
