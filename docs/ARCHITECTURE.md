# GlobeTrotter — System Architecture

This document describes the high-level architecture, component responsibilities, data flow, external integrations, and security design of GlobeTrotter.

---

## 🏗️ High-Level System Architecture

GlobeTrotter uses a modern decoupled client-server architecture. The React frontend handles user interactions and visualizations, while the Node.js Express backend manages business logic, PostgreSQL data persistence via Prisma ORM, and integrations with external travel & weather APIs.

```text
+-----------------------------------------------------------------------+
|                            Browser Client                             |
|                        http://localhost:5173                          |
+-----------------------------------------------------------------------+
                                   |
                                   | HTTP / REST (Axios)
                                   v
+-----------------------------------------------------------------------+
|                         Node.js Express Backend                       |
|                        http://localhost:5000                          |
|                                                                       |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | Auth Middleware   |  | Response Normalizer| | Error Handler     |  |
|  +-------------------+  +-------------------+  +-------------------+  |
+-----------------------------------------------------------------------+
         |                          |                          |
         | Prisma ORM               | HTTP (Server-Side)       | HTTP (Keyless)
         v                          v                          v
+-----------------+        +------------------+        +----------------+
|  PostgreSQL DB  |        |  Geoapify API    |        | Open-Meteo API |
| (Data Storage)  |        | (Places & Search)|        | (Weather Data) |
+-----------------+        +------------------+        +----------------+
```

---

## 🧩 Component Responsibilities

### 1. Frontend Layer (`client/`)
* **Technology**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons.
* **Responsibilities**:
  * Single Page Application (SPA) routing (`/dashboard`, `/explore`, `/community`, `/public/trips/:shareId`, `/profile`).
  * Interactive UI components (Trip Builder, Route Stops Editor, Day Agenda, Expense Pie Charts).
  * Client-side state management (Auth Context, Toast Notifications).
  * API service abstractions (`api.js`, `tripService.js`, `communityService.js`, `travelService.js`, `weatherService.js`).

### 2. Backend API Layer (`server/`)
* **Technology**: Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, CORS middleware.
* **Responsibilities**:
  * RESTful endpoint controllers (`authController`, `tripController`, `exploreController`, `communityController`, `weatherController`).
  * Request validation and error handling middlewares.
  * Server-side API key secrecy (`GEOAPIFY_API_KEY` never reaches the browser).
  * External API normalization (mapping Geoapify/Open-Meteo raw JSON to clean GlobeTrotter contract models).

### 3. Database Layer (`server/prisma/`)
* **Technology**: PostgreSQL, Prisma ORM.
* **Responsibilities**:
  * Relational data storage for Users, Trips, City Stops, Itinerary Items, Expenses, and Community Likes.
  * Referential integrity, indexes, unique constraints (`shareId`, `email`, `userId_tripId`), and cascading deletes.

### 4. External Data Layer
* **Geoapify API**: Geocoding, worldwide city search, points-of-interest, and activity recommendations.
* **Open-Meteo API**: Live weather metrics and 7-day daily forecasts.

---

## 🔄 Core Data & Execution Flows

### 1. Authentication Flow
```text
User ──► Login Form ──► POST /api/auth/login ──► Verify Bcrypt Password ──► Generate JWT ──► Store Token in LocalStorage
```

### 2. Destination & Activity Search Flow
```text
User ──► Search "Paris" ──► GET /api/explore/cities?q=Paris ──► Backend calls Geoapify API ──► Normalize Response ──► Render City List
```

### 3. Public Sharing & Copy Trip Flow
```text
Trip Owner ──► Toggle Public ──► POST /api/trips/:id/publish ──► Share URL /public/trips/:shareId
                                                                        │
Secondary User ──► Open Link ──► GET /api/public/trips/:shareId ────────┼──► Read-Only View
                                                                        │
Secondary User ──► Click Copy ──► POST /api/public/trips/:shareId/copy ──┴──► Deep Clone Trip to User Account
```

### 4. Community Feed & Like System Flow
```text
User ──► Open /community ──► GET /api/community?sort=popular ──► Fetch Public Trips & Like Counts
                                                                           │
User ──► Click Heart ─────► POST /api/community/:id/like ───────────────┴──► Toggle CommunityLike in PostgreSQL
```

---

## 🔒 Security Architecture

* **Server-Side API Key Isolation**: Third-party API keys (`GEOAPIFY_API_KEY`) remain strictly on the Express backend server environment.
* **Stateless JWT Authorization**: Requests pass `Authorization: Bearer <token>` in HTTP headers.
* **Strict Resource Ownership**: Backend controllers verify `req.user.id === trip.userId` for all write/update/delete operations.
* **Public Read-Only Boundaries**: `/api/public/trips/:shareId` yields sanitized read-only trip data and forbids mutations.
