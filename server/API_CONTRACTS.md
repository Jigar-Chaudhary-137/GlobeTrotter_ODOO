# GlobeTrotter — Member 3 API Contracts & Integration Guide

This document specifies the exact request parameters, response schemas, and integration guidelines for all Member 3 travel, location, activity, recommendation, and weather endpoints.

---

## 🌐 Endpoints Overview

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/explore/cities` | `GET` | Worldwide destination & city search |
| `/api/explore/activities` | `GET` | Points of interest & activity search |
| `/api/explore/recommendations` | `GET` | Categorized place recommendations |
| `/api/weather` | `GET` | Weather forecast by city or coordinates |

---

## 1. Destination Search API

### `GET /api/explore/cities`

Search for worldwide cities and destinations using primary Geoapify Geocoding API with OpenStreetMap Nominatim secondary fallback.

#### Query Parameters:
* `q` or `query` or `city` *(string, optional)*: Search term (e.g. `Paris`, `Tokyo`, `Mumbai`).
* `limit` *(number, optional)*: Max results to return (1-50, default `10`).

#### Example Request:
```http
GET /api/explore/cities?q=Paris&limit=5
```

#### Successful Response (`200 OK`):
```json
{
  "success": true,
  "message": "Destinations found",
  "count": 1,
  "data": [
    {
      "id": "97644102",
      "name": "Paris",
      "state": "Île-de-France",
      "country": "France",
      "formattedName": "Paris, Île-de-France, France",
      "lat": 48.8534951,
      "lng": 2.3483915,
      "bbox": {
        "lon1": 2.224122,
        "lat1": 48.8155755,
        "lon2": 2.4697602,
        "lat2": 48.902156
      },
      "timezone": "Europe/Paris"
    }
  ]
}
```

#### Field Definitions:
* `id` *(string)*: Stable unique place identifier.
* `name` *(string)*: Clean city name.
* `state` *(string)*: State/Region.
* `country` *(string)*: Country name.
* `formattedName` *(string)*: Complete formatted location string.
* `lat` *(number)*: Decimal latitude.
* `lng` *(number)*: Decimal longitude.
* `bbox` *(object|null)*: Bounding box coordinates.
* `timezone` *(string)*: Timezone string (e.g. `Europe/Paris`).

---

## 2. Activity & Places Search API

### `GET /api/explore/activities`

Search for attractions, museums, dining, and activities near a city or coordinates using Geoapify Places API.

#### Query Parameters:
* `city` *(string, optional)*: Target city name (e.g. `Paris`).
* `lat` *(number, optional)*: Latitude (-90 to 90).
* `lng` *(number, optional)*: Longitude (-180 to 180).
* `category` *(string, optional)*: Category filter (`attractions`, `culture`, `dining`, `outdoors`, `entertainment`, `shopping`, `all`). Default: `all`.
* `limit` *(number, optional)*: Max results to return (1-50, default `20`).

*(Note: Either `city` or `lat` & `lng` must be provided).*

#### Example Request:
```http
GET /api/explore/activities?city=Paris&category=attractions
```

#### Successful Response (`200 OK`):
```json
{
  "success": true,
  "message": "Activities retrieved successfully",
  "count": 1,
  "data": [
    {
      "id": "97283443",
      "name": "Point zéro des Routes de France",
      "category": "attractions",
      "address": "Point zéro des Routes de France, Parvis Notre-Dame, Paris",
      "lat": 48.8534015,
      "lng": 2.3487885,
      "description": "Point zéro des Routes de France in destination",
      "rating": 4.5,
      "priceCategory": "$",
      "distanceKm": 0.03
    }
  ]
}
```

#### Field Definitions:
* `id` *(string)*: Unique place identifier.
* `name` *(string)*: Activity / Attraction title.
* `category` *(string)*: Normalized category string (`attractions`, `culture`, `dining`, `outdoors`, `entertainment`, `shopping`).
* `address` *(string)*: Full address text.
* `lat` *(number)*: Latitude.
* `lng` *(number)*: Longitude.
* `description` *(string)*: Short description summary.
* `rating` *(number)*: Rating between 1.0 and 5.0.
* `priceCategory` *(string)*: Price tier indicator (`Free`, `$`, `$$`, `$$$`).
* `distanceKm` *(number)*: Straight-line Haversine distance in kilometers from city center / search coordinates.

---

## 3. Categorized Recommendations API

### `GET /api/explore/recommendations`

Returns categorized place recommendations generated dynamically from live activity search data.

#### Query Parameters:
* `city` *(string, optional)*: City name.
* `lat` *(number, optional)*: Latitude.
* `lng` *(number, optional)*: Longitude.

#### Example Request:
```http
GET /api/explore/recommendations?city=Paris
```

#### Successful Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "city": "Paris",
    "coordinates": {
      "lat": 48.8534951,
      "lng": 2.3483915
    },
    "totalFound": 30,
    "recommendations": {
      "attractions": [ /* Activity objects */ ],
      "culture": [ /* Activity objects */ ],
      "dining": [ /* Activity objects */ ],
      "outdoors": [ /* Activity objects */ ]
    }
  }
}
```

---

## 4. Weather Forecast API

### `GET /api/weather`

Fetches current weather conditions and 7-day daily forecast via Open-Meteo API.

#### Query Parameters:
* `city` *(string, optional)*: City name (e.g. `London`).
* `lat` *(number, optional)*: Latitude (e.g. `51.5074`).
* `lng` *(number, optional)*: Longitude (e.g. `-0.1278`).

*(Note: Either `city` or `lat` & `lng` must be provided).*

#### Example Request:
```http
GET /api/weather?city=London
```

#### Successful Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "city": "Greater London",
    "coordinates": {
      "lat": 51.51147,
      "lng": -0.13078
    },
    "current": {
      "temperature": 13,
      "condition": "Partly Cloudy",
      "windSpeed": 11
    },
    "currentTemp": 13,
    "condition": "Partly Cloudy",
    "windSpeed": 11,
    "dailyForecast": [
      {
        "date": "2026-08-22",
        "maxTemp": 21,
        "minTemp": 13,
        "precipitationProbability": 22,
        "condition": "Partly Cloudy"
      }
    ]
  }
}
```

---

## ⚠️ Error Responses

| Status | Cause | Response Structure |
| :--- | :--- | :--- |
| `400 Bad Request` | Missing required parameters or invalid coordinate range | `{"success": false, "message": "Please provide either a city name or latitude and longitude coordinates."}` |
| `503 Service Unavailable` | Live external API failed or timed out | `{"success": false, "message": "Travel data is temporarily unavailable", "data": []}` |

---

## 📌 Integration Guidelines for Team Members

### Member 1 (Frontend):
1. **Destination Search**: Bind your location autocomplete input to `GET /api/explore/cities?q={inputValue}`.
2. **Activity & Weather Coupling**: When a user selects a destination, pass the normalized `name`, `lat`, and `lng` directly into `GET /api/explore/activities?city={name}&lat={lat}&lng={lng}` and `GET /api/weather?lat={lat}&lng={lng}`.
3. **Display Badges**: Render `distanceKm` (e.g., `0.3 km away`) and `priceCategory` (`Free`, `$`, `$$`) directly on activity cards.

### Member 2 (Backend & Database):
1. **Trip Stop & Activity Storage**: When persisting a destination or activity in PostgreSQL via Prisma, save the normalized fields (`name`, `country`, `lat`, `lng`, `category`, `address`) directly.
2. **No Raw API Exposure**: Do not parse or store raw Geoapify/Nominatim responses. Use Member 3's normalized objects as contract models.
