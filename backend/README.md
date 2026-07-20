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

### `GET /api/listings`

Returns all active marketplace listings, newest first. Public, no authentication required. Each listing includes the farmer's name under `farmer.full_name`.

Optional query parameters (case-insensitive):

| Parameter  | Description          | Example             |
| ---------- | -------------------- | ------------------- |
| `crop`     | Filter by crop type  | `?crop=maize`       |
| `district` | Filter by district   | `?district=musanze` |

Example:

```
GET /api/listings?crop=maize&district=musanze
```

```json
[
  {
    "listing_id": "…",
    "farmer_id": "…",
    "crop_type": "Maize",
    "quantity_kg": "500",
    "price_per_kg": "400",
    "district": "Musanze",
    "description": "Freshly harvested",
    "status": "active",
    "created_at": "2026-07-18T00:00:00.000Z",
    "farmer": { "full_name": "…" }
  }
]
```

### `POST /api/listings`

Creates a produce listing. Requires a JWT (`Authorization: Bearer <token>`) with the `farmer` role. The `farmer_id` is taken from the token — any value sent in the body is ignored. `status` defaults to `active`.

| Field          | Type   | Required | Notes                 |
| -------------- | ------ | -------- | --------------------- |
| `crop_type`    | string | yes      | Max 80 characters     |
| `quantity_kg`  | number | yes      | Must be positive      |
| `price_per_kg` | number | yes      | Must be positive      |
| `district`     | string | yes      | Max 50 characters     |
| `description`  | string | no       | Free text             |

Responses: `201` with the created listing, `400` on invalid input, `401` without a valid token, `403` for non-farmer roles.

### `PUT /api/listings/:id`

Updates a listing. Requires a JWT with the `farmer` role, and the caller must be the farmer who owns the listing. Send any subset of the fields below; at least one is required.

| Field          | Type   | Notes                                    |
| -------------- | ------ | ---------------------------------------- |
| `quantity_kg`  | number | Must be positive                         |
| `price_per_kg` | number | Must be positive                         |
| `description`  | string | Non-empty                                |
| `status`       | string | One of `active`, `sold`, `cancelled`     |

Responses: `200` with the updated listing, `400` on invalid input, `401` without a valid token, `403` if the caller does not own the listing, `404` if it does not exist.

### `DELETE /api/listings/:id`

Deletes a listing. Requires a JWT with the `farmer` role, and the caller must be the farmer who owns the listing.

Responses: `204` on success, `401` without a valid token, `403` if the caller does not own the listing, `404` if it does not exist.

### `POST /api/enquiries`

Sends a buyer enquiry about a listing. Requires a JWT (`Authorization: Bearer <token>`) with the `buyer` role. The `buyer_id` is taken from the token. `status` defaults to `pending`.

| Field        | Type   | Required | Notes                                  |
| ------------ | ------ | -------- | -------------------------------------- |
| `listing_id` | string | yes      | UUID of an active listing              |
| `message`    | string | yes      | Free text                              |

The listing must exist and still be `active`, and a buyer cannot enquire about their own listing.

Responses: `201` with the created enquiry, `400` on invalid input or own-listing enquiry, `401` without a valid token, `403` for non-buyer roles, `404` if the listing does not exist or is inactive.

### `GET /api/enquiries?listing_id=`

Returns all enquiries on one listing, newest first, for the farmer who owns it. Requires a JWT. Each enquiry includes the buyer's name under `buyer.full_name`.

| Parameter    | Description                    | Required |
| ------------ | ------------------------------ | -------- |
| `listing_id` | UUID of the farmer's listing   | yes      |

```json
[
  {
    "enquiry_id": "…",
    "listing_id": "…",
    "buyer_id": "…",
    "message": "Is this still available?",
    "status": "pending",
    "created_at": "2026-07-19T00:00:00.000Z",
    "buyer": { "full_name": "…" }
  }
]
```

Responses: `200` with the enquiries, `400` on a missing or invalid `listing_id`, `401` without a valid token, `403` if the listing belongs to another farmer, `404` if the listing does not exist.
