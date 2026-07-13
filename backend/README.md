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

### `POST /api/prices`

Creates a market price record. Requires a JWT (`Authorization: Bearer <token>`) with the `coop_admin` or `super_admin` role. The `admin_id` is taken from the token — any value sent in the body is ignored.

| Field         | Type   | Required | Notes                              |
| ------------- | ------ | -------- | ---------------------------------- |
| `market_name` | string | yes      | Max 80 characters                  |
| `crop_type`   | string | yes      | Max 80 characters                  |
| `price_rwf`   | number | yes      | Must be positive                   |
| `unit`        | string | no       | Max 20 characters, defaults to `kg` |

Responses: `201` with the created record, `400` on invalid input, `401` without a valid token, `403` for non-admin roles.
