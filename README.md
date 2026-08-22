# GlobeTrotter

> **Empowering Personalized Travel Planning**

GlobeTrotter is a full-stack, personalized travel planning platform designed to help travelers discover destinations, construct multi-city trips, organize day-wise itineraries, track trip budgets, visualize schedules, and share itineraries with the global travel community.

---

## 🎯 Problem Statement

Travelers often struggle with fragmented tools when planning multi-city journeys—switching between mapping services, weather apps, spreadsheet budget trackers, and static blog posts. GlobeTrotter addresses this by providing a unified, end-to-end travel planning application where users can:

- Build customized multi-city travel itineraries
- Assign travel dates, day-wise activities, and estimated expenses
- Dynamically search and discover destinations and local points of interest
- View interactive cost breakdowns and budget analytics
- Visualize trip schedules using timeline and calendar views
- Share travel plans publicly via unique shareable links
- Duplicate public itineraries directly into their personal account for customized travel

All user-specific travel data—including trips, stops, itinerary items, expenses, and saved destinations—is reliably persisted in a relational PostgreSQL database.

---

## 💡 Solution

GlobeTrotter delivers a seamless, centralized platform for complete travel orchestration:

- **Personalized Trip Planning**: Create draft or active trips with customized titles, date ranges, and target budgets.
- **Multi-City Itineraries**: Add ordered city stops with specific arrival and departure dates.
- **Dynamic Destination & Activity Discovery**: Search worldwide cities and filter attractions, culture, dining, outdoors, and shopping without relying on static datasets.
- **Day-Wise Schedule Organization**: Group activities by day numbers and time slots.
- **Real-Time Budget Analytics**: Track total and category-wise trip expenses with interactive visual charts.
- **Calendar & Timeline Visualization**: View multi-city journeys across daily timelines and calendars.
- **Integrated Weather Forecasts**: Access current weather and 7-day forecasts for any destination.
- **Community Sharing & Copy Trip**: Publish trips to the community, share read-only links, and copy shared itineraries with a single click.
- **Responsive Modern UI**: Fast, mobile-friendly interface designed for on-the-go travelers.

---

## 🚀 Key Features

### 🔐 Authentication
- User registration and secure login
- Password hashing with `bcrypt` and session tokens with JSON Web Tokens (`JWT`)
- Protected application routes and user-isolated travel data

### 📊 Dashboard
- Overview of upcoming and recent trips
- Quick actions for instant trip creation and destination search
- Travel summary stats (total trips, active itineraries, saved spots)

### 🌍 Explore & Discovery
- **Dynamic City Search**: Worldwide location geocoding powered by live external APIs
- **Activity & Attraction Search**: Search points of interest filtered by category (`attractions`, `culture`, `dining`, `outdoors`, `entertainment`, `shopping`)
- **Distance & Price Indicators**: Real-time Haversine distance calculations (in km) and price category badges (`Free`, `$`, `$$`, `$$$`)
- **Categorized Recommendations**: Instant suggestions grouped by place type

### 🧳 Trip Planning & Itineraries
- **Multi-City Route Builder**: Add, reorder, and update trip stops with arrival/departure dates
- **Day-Wise Activity Scheduler**: Map activities to specific days, times, and locations
- **Expense Association**: Log estimated or actual expenses directly against itinerary items

### 💰 Budget & Analytics
- **Cost Overview**: Track total spent against target trip budget
- **Category Breakdowns**: Expenses categorized into Transport, Accommodation, Activities, Meals, and Other
- **Visual Analytics**: Interactive budget charts rendered with `Recharts`

### 📅 Calendar & Timeline
- Visual trip timeline showing city transitions
- Day-by-day activity agenda view for easy schedule management

### 🌤️ Weather Integration
- Destination-based weather forecasts
- Current temperature, weather condition, wind speed, and 7-day weather outlook via Open-Meteo

### 🌐 Community & Public Sharing
- **Shareable Links**: Publish trips to generate a unique `shareId` link for read-only public viewing
- **Copy Trip**: Clone any public itinerary directly into your personal trip planner
- **Community Wall & Likes**: Browse public travel stories and like community trips

### 👤 Profile Management
- Manage user profile information and bio
- View personal saved destinations catalog

---

## 🛠️ Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (v18) + Vite | UI library and fast bundler |
| | JavaScript (ES6+) | Application logic |
| | Tailwind CSS | Utility-first styling |
| | React Router (v6) | Single Page Application routing |
| | Axios | HTTP API client |
| | Recharts | Interactive budget data visualization |
| | Lucide React | Modern iconography |
| **Backend** | Node.js | JavaScript runtime environment |
| | Express.js | REST API web framework |
| **Database** | PostgreSQL | Relational database management system |
| | Prisma ORM | Type-safe ORM & database migrations |
| **Authentication** | JWT (`jsonwebtoken`) | Stateless authentication tokens |
| | `bcrypt` / `bcryptjs` | Password hashing |
| **External APIs** | Geoapify (Geocoding & Places) | Live destination and activity search |
| | Open-Meteo | Live weather & 7-day forecast API |
| **Development** | Git & GitHub | Version control & collaboration |

---

## 🏗️ Architecture

GlobeTrotter follows a clean, decoupled client-server architecture:

```text
┌─────────────────────────────────────────────────────────┐
│                      React Frontend                     │
│               (React Router, Tailwind, Axios)           │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP / REST APIs
┌────────────────────────────▼────────────────────────────┐
│                    Node.js Express API                  │
│             (Auth, Middleware, Controllers)             │
└───────┬────────────────────┬────────────────────┬───────┘
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│ PostgreSQL DB  │  │ Geoapify API    │  │ Open-Meteo API  │
│ (via Prisma)   │  │ (Travel/Places) │  │ (Weather)      │
└────────────────┘  └─────────────────┘  └────────────────┘
```

### Key Security & API Isolation Principles:
- **Server-Side API Keys**: Third-party API keys (`GEOAPIFY_API_KEY`) remain strictly on the Express backend and are never exposed to the client.
- **Response Normalization**: Raw external responses are transformed into clean, consistent GlobeTrotter contract models before reaching the frontend.

---

## 🗄️ Database Model (PostgreSQL + Prisma)

GlobeTrotter utilizes a relational PostgreSQL database schema defined via Prisma ORM:

```text
User ───► Trips ───┬───► TripStops ───► ItineraryItems
                   ├───► Expenses
                   ├───► CommunityLikes
                   └───► CommunityPosts
```

### Relational Entities:
- **`User`**: System accounts, authentication credentials, and user profiles.
- **`Trip`**: Core trip container (title, date range, budget, status, public sharing flags).
- **`TripStop`**: Multi-city journey stops associated with a trip (city, country, arrival/departure dates, coordinates).
- **`ItineraryItem`**: Day-wise activity items linked to trips and stops.
- **`Expense`**: Individual budget expense logs categorized by expense type.
- **`SavedDestination`**: User's bookmarked destination catalog.
- **`CommunityPost` & `CommunityLike`**: Community sharing posts and user likes.

---

## 🌐 Dynamic Travel Data

GlobeTrotter relies **100% on real-time, dynamic external data** rather than static JSON datasets:

- **Geoapify Geocoding API**: Powering worldwide city search with OpenStreetMap Nominatim secondary live fallback.
- **Geoapify Places API**: Powering live point-of-interest and activity discovery across standard travel categories.
- **Open-Meteo API**: Delivering keyless, highly reliable current weather and 7-day daily forecasts.

> Full API contracts, request payloads, and field dictionaries are documented in [`server/API_CONTRACTS.md`](./server/API_CONTRACTS.md).

---

## 📡 API Overview

### 🔍 Explore & Travel APIs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/explore/cities?q=Paris` | Search worldwide destinations |
| `GET` | `/api/explore/activities?city=Paris&category=attractions` | Search activities & places |
| `GET` | `/api/explore/recommendations?city=Paris` | Get categorized place recommendations |

### 🌤️ Weather API
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/weather?city=London` | Fetch weather by city |
| `GET` | `/api/weather?lat=51.5074&lng=-0.1278` | Fetch weather by coordinates |

### 🔐 Authentication APIs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & get JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |

### 🧳 Trip Management APIs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/trips` | Get user's trips |
| `POST` | `/api/trips` | Create new trip |
| `GET` | `/api/trips/:id` | Get trip details with stops & itinerary |
| `PUT` | `/api/trips/:id` | Update trip details |
| `DELETE` | `/api/trips/:id` | Delete trip |
| `POST` | `/api/trips/:id/publish` | Toggle public trip sharing |
| `POST` | `/api/trips/:tripId/stops` | Add city stop to trip |
| `POST` | `/api/trips/:tripId/itinerary` | Add day-wise itinerary item |
| `POST` | `/api/trips/:tripId/expenses` | Add expense entry |

### 👥 Public & Community APIs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/public/trips/:shareId` | View read-only public trip |
| `POST` | `/api/public/trips/:shareId/copy` | Clone public trip into user account |
| `GET` | `/api/community` | Fetch public community feed |
| `POST` | `/api/community/:id/like` | Like a public trip |

---

## 📚 Repository Documentation Index

Comprehensive documentation is available in the [`docs/`](./docs) folder:

- 🏗️ **[System Architecture](docs/ARCHITECTURE.md)**: High-level client-server diagram, execution flows, and security design.
- 🗄️ **[Database Architecture](docs/DATABASE.md)**: PostgreSQL schema, Prisma models, entity relationships, and indexes.
- 🛠️ **[Developer Setup & Guide](docs/DEVELOPMENT.md)**: Local installation, environment configuration, and execution commands.
- 🎬 **[Application Demo Guide](docs/DEMO_GUIDE.md)**: Step-by-step application walkthrough and feature points.
- 📡 **[API Contracts & Dictionary](server/API_CONTRACTS.md)**: API specifications, request payloads, and field dictionary.

---

## 📁 High-Level Project Structure

```text
GlobeTrotter_ODOO/
│
├── docs/                       # Project Architecture & Application Guides
│   ├── ARCHITECTURE.md         # System Architecture & Flow Diagrams
│   ├── DATABASE.md             # Prisma Schema & PostgreSQL Specifications
│   ├── DEVELOPMENT.md          # Local Setup & Execution Guide
│   └── DEMO_GUIDE.md           # Application Walkthrough & Feature Points
│
├── client/                     # React + Vite Frontend Application
│   └── src/
│       ├── components/         # Reusable UI & Layout components
│       ├── context/            # Global State (Auth Context, Toast)
│       ├── pages/              # Route views (Login, Register, Dashboard)
│       └── services/           # Frontend API integration services
│
├── server/                     # Express.js REST API Server
│   ├── API_CONTRACTS.md        # Detailed Travel & Weather API Documentation
│   ├── prisma/
│   │   └── schema.prisma       # PostgreSQL Prisma ORM Schema
│   └── src/
│       ├── config/             # DB & Environment Configuration
│       ├── controllers/        # Express Request Handlers
│       ├── middleware/         # Auth & Error Middlewares
│       ├── routes/             # Express API Routes
│       ├── services/           # Travel & Weather External API Services
│       └── server.js           # Express Server Entry Point
│
├── .env.example                # Environment Template File
├── .gitignore                  # Git Exclusion Definitions
├── README.md                   # Project Documentation Index
└── package.json                # Monorepo NPM Scripts & Dependencies
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v14` or higher

### 1. Clone the Repository
```bash
git clone https://github.com/Jigar-Chaudhary-137/GlobeTrotter_ODOO.git
cd GlobeTrotter_ODOO
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```

Configure your local `.env` values:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/globetrotter_db?schema=public"
JWT_SECRET="your_jwt_secret_key"
PORT=5000
CLIENT_URL="http://localhost:5173"
GEOAPIFY_API_KEY="your_geoapify_api_key"
```

### 3. Install Monorepo Dependencies
Install all root, client, and server dependencies with a single command:
```bash
npm run install:all
```

### 4. Database Setup & Prisma Migrations
Generate the Prisma client and push the schema to your PostgreSQL database:
```bash
npm --prefix server run prisma:generate
npm --prefix server run prisma:push
```

---

## 🚀 Running the Application

### Start Both Frontend and Backend Concurrently (Recommended)
From the root directory, run:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

### Start Individual Services
- **Backend Server Only**: `npm run server`
- **Frontend Client Only**: `npm run client`