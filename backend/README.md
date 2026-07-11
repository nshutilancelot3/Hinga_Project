# Hinga Backend

Express API with Prisma ORM against PostgreSQL. 
Deployed on Render. Live at [hinga-backend-8qfy.onrender.com](https://hinga-backend-8qfy.onrender.com).

## API

### `GET /health`

Health check. Returns `{ "status": "ok" }`.

### `GET /api/prices`

Returns all market prices ordered by most recent first. Public, no authentication required.

Optional query parameters (case-insensitive):

| Parameter | Description                        | Example          |
| --------- | ---------------------------------- | ---------------- |
| `crop`    | Filter by crop type                | `?crop=maize`    |
| `market`  | Filter by market name              | `?market=kimironko` |

Example:

```
GET /api/prices?crop=beans&market=kimironko
```

```json
[
  {
    "price_id": "…",
    "market_name": "Kimironko",
    "crop_type": "Beans",
    "price_rwf": "880",
    "unit": "kg",
    "admin_id": "…",
    "recorded_at": "2026-07-10T00:00:00.000Z"
  }
]
```
