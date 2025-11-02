# ☕ Tea Boys Management System

A complete, production-ready **multi-tenant billing and inventory management system** built with React, TypeScript, and Supabase.

![Status](https://img.shields.io/badge/status-production%20ready-success)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![Build](https://img.shields.io/badge/build-passing-success)

---

## 🎯 Overview

Tea Boys Management System is a comprehensive business management solution designed for retail and service businesses. It handles sales, inventory, purchases, expenses, and customer management with complete multi-tenant support.

### ✨ Key Features

- 🛒 **Point of Sale (POS)** - Fast, intuitive sales interface
- 📊 **Sales Management** - Track and manage all transactions
- 📦 **Inventory Management** - Real-time stock tracking with auto-updates
- 🛍️ **Purchase Orders** - Create POs and receive inventory
- 💰 **Expense Tracking** - Categorized expense management
- 👥 **Customer Management** - Customer database with credit tracking
- 📈 **Dashboard** - Real-time business metrics
- 🏢 **Multi-Tenant** - Complete store isolation
- 🔒 **Secure** - Row Level Security (RLS) on all tables
- ⚡ **Automated** - 43 database triggers for automation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd tea-boys-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**
   
   All migrations are in the `database/` folder. Apply them in order through your Supabase dashboard.

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Create admin account**
   
   Open `create-admin.html` in your browser and create your first admin account.

7. **Login and start using!**
   
   Navigate to http://localhost:5174 and login with your credentials.

📖 **For detailed setup instructions, see [QUICK_START.md](QUICK_START.md)**

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Step-by-step setup guide
- **[PROJECT_COMPLETE.md](PROJECT_COMPLETE.md)** - Complete project overview
- **[create-admin-sql.md](create-admin-sql.md)** - Admin account creation guide
- **Phase Documentation** - Detailed feature documentation in `PHASE_*_COMPLETE.md` files

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Lucide React** - Icons

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Database
- **Row Level Security** - Data security
- **Database Triggers** - Automation
- **RPC Functions** - Business logic

---

## 📊 Features Overview

### 🛒 Point of Sale (POS)
- Product search and selection
- Shopping cart management
- Multiple payment methods (Cash, Card, UPI, Credit)
- Customer selection
- Automatic inventory updates
- Invoice generation

### 📈 Sales Management
- View all sales with advanced filtering
- Sale details with invoice view
- Payment history tracking
- Record partial payments
- Balance tracking
- Payment status management

### 📦 Inventory Management
- Real-time stock levels
- Automatic updates on sales/purchases
- Low stock alerts
- Stock movement tracking
- Product categorization
- SKU and barcode support

### 🛍️ Purchase Management
- Create purchase orders
- Add multiple products
- Mark as received (auto-updates inventory)
- Payment tracking
- Supplier management

### 💰 Expense Tracking
- 10 predefined categories
- Payment method tracking
- Category breakdown
- Date-based filtering
- Edit and delete functionality

### 👥 Customer Management
- Customer database
- Credit limit management
- Outstanding balance tracking
- Purchase history
- GST details

### 📊 Dashboard
- Today's sales, purchases, expenses
- Pending payments
- Low stock alerts
- Customer and product counts
- Real-time metrics

---

## 🔒 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Multi-tenant data isolation
- ✅ Role-based access control (Admin, Manager, Staff)
- ✅ Secure authentication with Supabase Auth
- ✅ SQL injection protection
- ✅ XSS protection

---

## 🗄️ Database Schema

- **19 Tables** with complete multi-tenancy
- **13 RPC Functions** for business logic
- **43 Triggers** for automation
- **6 Views** for optimized queries
- **39 RLS Policies** for security

Key tables:
- `stores` - Multi-tenant stores
- `profiles` - User profiles with roles
- `products` - Product catalog
- `inventory` - Stock levels
- `sales` / `sale_items` - Sales transactions
- `purchases` / `purchase_items` - Purchase orders
- `customers` - Customer database
- `expenses` - Expense tracking
- `payments` - Payment records

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Environment Variables

Make sure to set these in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)

---

## 📞 Support

For issues and questions:
- Check the [QUICK_START.md](QUICK_START.md) guide
- Review the phase documentation files
- Check the browser console for errors
- Verify Supabase connection

---

## 🎉 Status

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: November 2, 2025

---

**Built with ❤️ for small businesses**
