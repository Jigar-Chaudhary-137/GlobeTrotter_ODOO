# GlobeTrotter

GlobeTrotter is a modern, full-stack travel planning and itinerary management application designed for seamless trip orchestration and community sharing.

## Technology Stack

### Frontend
- **Framework**: React + Vite (JavaScript)
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Icons & UI**: Lucide React
- **Data Visualization**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Middleware**: CORS, Dotenv, Body Parsers

### Database & ORM
- **Database**: PostgreSQL
- **ORM**: Prisma ORM

### Authentication (Pre-configured)
- **Password Hashing**: bcrypt
- **Token Management**: jsonwebtoken

---

## Prerequisites

Before setting up and running the project, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- [PostgreSQL](https://www.postgresql.org/) database server (v14 or higher)

---

## Environment Variables Setup

1. Copy the template `.env.example` to `.env` in the root directory (or as needed):
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your local configurations:
   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/globetrotter_db?schema=public"
   JWT_SECRET="your_jwt_secret_key"
   PORT=5000
   CLIENT_URL=http://localhost:5173
   GEOAPIFY_API_KEY="your_geoapify_api_key"
   ```

---

## Installation

Install dependencies across the entire monorepo from the root directory:

```bash
# Install root orchestration packages
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

Alternatively, use the root helper script:
```bash
npm run install:all
```

---

## Running the Application

### 1. Start Both Frontend and Backend Concurrently (Recommended)
From the root directory, run:
```bash
npm run dev
```
This will launch:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

### 2. Start Frontend Only
From the root directory:
```bash
npm run client
```
Or directly inside the `client/` directory:
```bash
cd client
npm run dev
```

### 3. Start Backend Only
From the root directory:
```bash
npm run server
```
Or directly inside the `server/` directory:
```bash
cd server
npm run dev
```

---

## API Health Check

Once the server is running, verify backend connectivity by making a GET request to:
`http://localhost:5000/api/health`

**Response:**
```json
{
  "success": true,
  "message": "GlobeTrotter API is running"
}
```

---

## Shared Repository Structure

```
GlobeTrotter_ODOO/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── common/
│       │   ├── layout/
│       │   └── ui/
│       ├── features/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── trips/
│       │   ├── explore/
│       │   ├── calendar/
│       │   ├── community/
│       │   ├── profile/
│       │   └── admin/
│       ├── pages/
│       ├── hooks/
│       ├── context/
│       ├── services/
│       ├── utils/
│       ├── routes/
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│
├── server/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       │   ├── travel/
│       │   └── weather/
│       ├── validators/
│       ├── utils/
│       └── server.js
│
├── .env.example
├── .gitignore
├── README.md
├── package.json
└── package-lock.json
```