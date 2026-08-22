# GlobeTrotter — Database Architecture

This document details the PostgreSQL database schema, entity relationships, indexes, constraints, and field definitions implemented via Prisma ORM (`server/prisma/schema.prisma`).

---

## 🗄️ Entity Relationship Diagram (ERD)

```text
  +------------------+
  |       User       |
  +------------------+
    | 1          * |
    |--------------+---- SavedDestination
    |              |---- CommunityPost
    |              |---- CommunityLike
    v *            
  +------------------+
  |       Trip       |
  +------------------+
    | 1          * |
    |--------------+---- TripStop ──┐
    |              |                | 1
    |              |                v * (SetNull)
    |              |---- ItineraryItem
    |              |---- Expense
    |              |---- CommunityPost
    |              |---- CommunityLike
```

---

## 📋 Enum Definitions

### 1. `Role`
* `USER`: Standard traveler account.
* `ADMIN`: Administrative account.

### 2. `TripStatus`
* `DRAFT`: Early-stage trip draft.
* `PLANNED`: Active planned itinerary.
* `COMPLETED`: Archived past trip.

### 3. `ExpenseCategory`
* `TRANSPORT`: Flights, trains, buses, fuel, taxis.
* `ACCOMMODATION`: Hotels, hostels, rentals.
* `ACTIVITIES`: Tours, tickets, excursions, museums.
* `MEALS`: Restaurants, cafes, groceries.
* `OTHER`: Miscellaneous travel expenses.

---

## 📄 Model Specifications

### 1. `User`
Stores user authentication credentials, profiles, and associations.
* **Fields**:
  * `id` (`String`, UUID, Primary Key)
  * `name` (`String`)
  * `email` (`String`, Unique Index)
  * `password` (`String`, Bcrypt Hash)
  * `city` (`String?`)
  * `country` (`String?`)
  * `bio` (`String?`)
  * `profilePic` (`String?`)
  * `role` (`Role`, default: `USER`)
  * `createdAt` (`DateTime`, default: `now()`)
  * `updatedAt` (`DateTime`, `@updatedAt`)
* **Indexes**: `@@index([email])`

---

### 2. `Trip`
The primary container for travel itineraries.
* **Fields**:
  * `id` (`String`, UUID, Primary Key)
  * `userId` (`String`, Foreign Key -> `User.id`, Cascade Delete)
  * `title` (`String`)
  * `description` (`String?`)
  * `coverImage` (`String?`)
  * `startDate` (`DateTime?`)
  * `endDate` (`DateTime?`)
  * `totalBudget` (`Float`, default: `0`)
  * `status` (`TripStatus`, default: `PLANNED`)
  * `isPublic` (`Boolean`, default: `false`)
  * `shareId` (`String`, UUID, Unique Index)
  * `createdAt` (`DateTime`, default: `now()`)
  * `updatedAt` (`DateTime`, `@updatedAt`)
* **Indexes**: `@@index([userId])`, `@@index([shareId])`, `@@index([isPublic])`

---

### 3. `TripStop`
Represents ordered multi-city destinations within a trip.
* **Fields**:
  * `id` (`String`, UUID, Primary Key)
  * `tripId` (`String`, Foreign Key -> `Trip.id`, Cascade Delete)
  * `city` (`String`)
  * `country` (`String`)
  * `arrivalDate` (`DateTime?`)
  * `departureDate` (`DateTime?`)
  * `order` (`Int`, default: `0`)
  * `notes` (`String?`)
  * `latitude` (`Float?`)
  * `longitude` (`Float?`)
  * `createdAt` (`DateTime`, default: `now()`)
  * `updatedAt` (`DateTime`, `@updatedAt`)
* **Indexes**: `@@index([tripId])`

---

### 4. `ItineraryItem`
Day-wise scheduled activity items.
* **Fields**:
  * `id` (`String`, UUID, Primary Key)
  * `tripId` (`String`, Foreign Key -> `Trip.id`, Cascade Delete)
  * `tripStopId` (`String?`, Foreign Key -> `TripStop.id`, SetNull)
  * `dayNumber` (`Int`, default: `1`)
  * `date` (`DateTime?`)
  * `time` (`String?`)
  * `title` (`String`)
  * `description` (`String?`)
  * `category` (`ExpenseCategory`, default: `ACTIVITIES`)
  * `expense` (`Float`, default: `0`)
  * `location` (`String?`)
  * `createdAt` (`DateTime`, default: `now()`)
  * `updatedAt` (`DateTime`, `@updatedAt`)
* **Indexes**: `@@index([tripId])`, `@@index([tripStopId])`

---

### 5. `Expense`
Individual budget expense entries categorized for financial tracking.
* **Fields**:
  * `id` (`String`, UUID, Primary Key)
  * `tripId` (`String`, Foreign Key -> `Trip.id`, Cascade Delete)
  * `category` (`ExpenseCategory`)
  * `amount` (`Float`)
  * `currency` (`String`, default: `"USD"`)
  * `description` (`String`)
  * `date` (`DateTime?`)
  * `createdAt` (`DateTime`, default: `now()`)
  * `updatedAt` (`DateTime`, `@updatedAt`)
* **Indexes**: `@@index([tripId])`

---

### 6. `SavedDestination`
Bookmarked user travel destinations.
* **Fields**:
  * `id` (`String`, UUID, Primary Key)
  * `userId` (`String`, Foreign Key -> `User.id`, Cascade Delete)
  * `cityName` (`String`)
  * `countryName` (`String`)
  * `description` (`String?`)
  * `imageUrl` (`String?`)
  * `createdAt` (`DateTime`, default: `now()`)
* **Indexes**: `@@index([userId])`

---

### 7. `CommunityPost` & `CommunityLike`
Supports the community share board and trip likes.
* **`CommunityLike` Unique Constraint**: `@@unique([userId, tripId])` prevents duplicate likes per user per trip.
* **Indexes**: `@@index([tripId])`, `@@index([userId])`

---

## ⚡ Cascade & Referential Integrity Rules
* **Cascade Delete**: Deleting a `User` automatically deletes all their `Trips`, `SavedDestinations`, and `CommunityLikes`. Deleting a `Trip` automatically deletes all associated `TripStops`, `ItineraryItems`, `Expenses`, and `CommunityLikes`.
* **SetNull**: Deleting a `TripStop` unlinks `ItineraryItem.tripStopId` without deleting the activity item itself.
