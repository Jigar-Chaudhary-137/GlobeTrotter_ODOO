# GlobeTrotter — Hackathon Judge Demo Guide

This guide outlines the recommended step-by-step presentation flow, key technical highlights, and judge talking points for evaluating GlobeTrotter.

---

## 🎯 Demo Objective

Demonstrate an end-to-end multi-city travel planning application that integrates live external travel/weather APIs, persistent PostgreSQL data via Prisma ORM, interactive budget analytics, and public itinerary sharing & cloning.

---

## 🎬 Recommended 2-Minute Judge Walkthrough

```text
REGISTER ➔ LOGIN ➔ DASHBOARD ➔ EXPLORE ➔ SEARCH CITY ➔ VIEW ACTIVITIES 
➔ PLACE DETAILS ➔ CREATE MULTI-CITY TRIP ➔ ADD ACTIVITIES & EXPENSES ➔ BUDGET 
➔ CALENDAR ➔ WEATHER ➔ PUBLISH TRIP ➔ COPY SHARE LINK ➔ OPEN PUBLIC TRIP 
➔ COMMUNITY BOARD ➔ LIKE TRIP ➔ COPY TRIP ➔ DASHBOARD ➔ EDIT COPIED TRIP
```

### Step 1: Registration & Authentication
* Open [http://localhost:5173](http://localhost:5173) and click **Login / Register**.
* Register a new user account or log in with test credentials.
* *Highlight*: JWT token generation & password hashing with Bcrypt.

### Step 2: Dashboard Overview
* Land on the **Personalized Travel Dashboard**.
* *Highlight*: Overview of upcoming trips, active itineraries, and travel summary statistics.

### Step 3: Dynamic Destination Discovery (Explore)
* Navigate to **Explore** and search for **Paris** or **Tokyo**.
* *Highlight*: 100% live geocoding powered by Geoapify API without hardcoded static JSON datasets.

### Step 4: Activity & Point of Interest Filter
* Filter activities by category (*Attractions, Culture, Dining, Outdoors, Shopping*).
* Click an activity to view place details, coordinates, and distance indicators.

### Step 5: Check Live Weather Forecast
* View destination weather metrics (current temperature, conditions, 7-day outlook).
* *Highlight*: Live Open-Meteo API integration.

### Step 6: Create Multi-City Trip
* Click **Create Trip** (e.g. *"European Explorer"*). Set start/end dates and budget ($5,000).
* Add ordered route stops (*Paris ➔ London ➔ Amsterdam*).
* *Highlight*: Relational `TripStop` database entities with cascading relationships.

### Step 7: Day-Wise Activity & Expense Logging
* Assign activities to specific days and time slots. Log category expenses (*Transport, Lodging, Meals*).
* *Highlight*: Real-time budget analytics & Recharts category breakdown.

### Step 8: Public Sharing & Copy Link
* Toggle **Make Public** in Trip Builder to generate a public `shareId` link.
* Click **Copy Link** to test Clipboard API integration, then click **Open Public View**.
* *Highlight*: Strictly read-only public trip isolation (`/public/trips/:shareId`).

### Step 9: Community Board & Trip Cloning
* Navigate to **Community**. View public feed sorted by **Popular** or **Newest**.
* Click **Heart** to like a trip, then click **Copy Trip**.
* *Highlight*: Deep cloning of public trips, route stops, itinerary items, and expenses into the user's account.

---

## 🌟 Strong Technical Highlights

1. **Relational Database Integrity**: Multi-level schema (Users ➔ Trips ➔ Stops ➔ Items & Expenses) backed by PostgreSQL & Prisma ORM.
2. **100% Dynamic Travel Data**: Zero reliance on static catalog fallbacks. Live data fetched from Geoapify and Open-Meteo APIs.
3. **Clean API Architecture**: Server-side API key concealment and normalized JSON API contracts.
4. **Deep Copy Trip Mechanism**: One-click duplication of complex relational itineraries.
5. **Polished UX & Error Handling**: Skeletons, 400ms search debouncing, custom 404 error cards, and responsive Tailwind styling.

---

## 💬 Judge Talking Points

> *"GlobeTrotter eliminates fragmented travel planning tools by bringing multi-city route building, live activity discovery, weather forecasts, and budget tracking into a single unified platform."*

> *"Unlike static travel concepts, 100% of our destination and activity search results are powered live by external APIs, securely normalized on our Node.js backend."*

> *"Travelers can publish their trip with a single click, and community members can duplicate the entire multi-city itinerary directly into their personal planner for instant customization."*
