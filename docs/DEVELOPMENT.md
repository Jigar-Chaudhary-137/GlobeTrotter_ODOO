# GlobeTrotter — Developer Setup & Integration Guide

This guide provides instructions for setting up, configuring, running, testing, and troubleshooting GlobeTrotter in a local development environment.

---

## 🛠️ Prerequisites

Make sure the following tools are installed on your machine:

* **Node.js**: `v18.0.0` or higher ([nodejs.org](https://nodejs.org/))
* **npm**: `v9.0.0` or higher
* **PostgreSQL**: `v14` or higher (running locally or via cloud PostgreSQL database)
* **Git**: `v2.30` or higher

---

## 🚀 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/Jigar-Chaudhary-137/GlobeTrotter_ODOO.git
cd GlobeTrotter_ODOO
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```

Set required environment values in `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/globetrotter_db?schema=public"
JWT_SECRET="your_secure_jwt_secret_key_here"
PORT=5000
CLIENT_URL="http://localhost:5173"
GEOAPIFY_API_KEY="your_geoapify_api_key_here"
```

> ⚠️ **Security Note**: Never commit your `.env` file or real API keys to version control.

---

## 📦 Monorepo Installation & Database Setup

### 1. Install All Dependencies
Install dependencies for root, client, and server packages with a single command:
```bash
npm run install:all
```

### 2. Database Migration & Prisma Generation
Generate Prisma Client types and push the PostgreSQL database schema:
```bash
npm --prefix server run prisma:generate
npm --prefix server run prisma:push
```

*(Optional)* Seed initial data:
```bash
npm --prefix server run prisma:seed
```

---

## ⚡ Running the Application

### Option A: Single Command Startup (Recommended)
Run both the Express backend server and Vite frontend client concurrently:
```bash
npm run dev
```

Terminal output:
* **Frontend App**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)
* **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Option B: Individual Services
* **Backend Server Only**:
  ```bash
  npm run server
  ```
* **Frontend Client Only**:
  ```bash
  npm run client
  ```

---

## 🧪 Build & Quality Verification

### Run Production Build Test
Verify that the Vite React frontend compiles cleanly:
```bash
npm --prefix client run build
```

---

## 🛡️ Security & API Best Practices

1. **Server-Side API Key Concealment**: Third-party API keys (`GEOAPIFY_API_KEY`) must remain on the Express server environment.
2. **Stateless JWT Tokens**: Pass Authorization headers as `Bearer <token>`.
3. **CORS Security**: CORS is configured with `credentials: true` restricted to `CLIENT_URL`.
