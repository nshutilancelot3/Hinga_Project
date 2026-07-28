# Hinga Backend

Express API with Prisma ORM against PostgreSQL.
Deployed on Render. Live at [hinga-backend-8qfy.onrender.com/health](https://hinga-backend-8qfy.onrender.com/health).

See [TESTING.md](TESTING.md) for running the automated test suite and seeding a fresh database.

## API

### `GET /health`

Health check. Returns `{ "status": "ok" }`.

### `POST /api/auth/register`

Creates a user account. Public. `role` is limited to `farmer`, `buyer`, or `coop_admin` — a `super_admin` account can only be created by an existing super admin (via the admin panel or the seed script), never through public registration.

| Field           | Type   | Required | Notes                                     |
| --------------- | ------ | -------- | ------------------------------------------ |
| `full_name`     | string | yes      |                                              |
| `email`         | string | yes      | Must be unique                              |
| `password`      | string | yes      | Minimum 8 characters                        |
| `role`          | string | yes      | One of `farmer`, `buyer`, `coop_admin`      |
| `district`      | string | yes      |                                              |
| `language_pref` | string | no       | `rw` or `en`                                |

Responses: `201` with `{ user_id, email, role }`, `400` with `{ error: "MISSING_FIELD", field }`, `{ error: "INVALID_ROLE" }`, or `{ error: "PASSWORD_TOO_SHORT" }`, `409` with `{ error: "EMAIL_TAKEN" }`.

### `POST /api/auth/login`

Authenticates and returns a JWT. Public.

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | yes      |
| `password` | string | yes      |

Responses: `200` with `{ token, user }`, `401` with `{ error: "INVALID_CREDENTIALS" }` for a wrong email or password (deliberately the same message for both, so a caller can't tell which was wrong).

### `GET /api/prices`

Returns all market prices ordered by most recent first. Public, no authentication required.

Optional query parameters (case-insensitive):

| Parameter | Description           | Example             |
| --------- | ---------------------- | -------------------- |
| `crop`    | Filter by crop type    | `?crop=maize`         |
| `market`  | Filter by market name  | `?market=kimironko`   |

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

Creates a market price record. Requires a JWT with the `coop_admin` or `super_admin` role. The `admin_id` is taken from the token — any value sent in the body is ignored.

| Field         | Type   | Required | Notes                                |
| ------------- | ------ | -------- | -------------------------------------- |
| `market_name` | string | yes      | Max 80 characters                      |
| `crop_type`   | string | yes      | Max 80 characters                      |
| `price_rwf`   | number | yes      | Must be positive                       |
| `unit`        | string | no       | Max 20 characters, defaults to `kg`    |

Responses: `201` with the created record, `400` on invalid input, `401` without a valid token, `403` for non-admin roles.

### `PUT /api/prices/:id`

Updates a price entry. Requires a JWT with the `coop_admin` or `super_admin` role, and the caller must be the admin who created the entry (a `super_admin` can edit any entry regardless of who created it). Send any subset of the fields below.

| Field         | Type   | Notes                                |
| ------------- | ------ | -------------------------------------- |
| `price_rwf`   | number | Must be positive                       |
| `unit`        | string |                                         |
| `market_name` | string |                                         |

Responses: `200` with the updated record, `400` on invalid input, `401` without a valid token, `403` if the caller is a `coop_admin` who didn't create this entry, `404` if it doesn't exist.

### `DELETE /api/prices/:id`

Deletes a price entry. Same role and ownership rules as `PUT`.

Responses: `204` on success, `401` without a valid token, `403` per the ownership rule above, `404` if it doesn't exist.

### `GET /api/listings`

Returns all active marketplace listings, newest first. Public, no authentication required. Each listing includes the farmer's name under `farmer.full_name`.

Optional query parameters (case-insensitive):

| Parameter  | Description          | Example             |
| ---------- | --------------------- | -------------------- |
| `crop`     | Filter by crop type   | `?crop=maize`         |
| `district` | Filter by district    | `?district=musanze`   |

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

### `GET /api/listings/mine`

Returns every listing belonging to the logged-in farmer, regardless of status (`active`, `sold`, `cancelled`), newest first. Requires a JWT with the `farmer` role. Powers the "my listings" management page.

Responses: `200` with the listings array, `401` without a valid token, `403` for non-farmer roles.

### `POST /api/listings`

Creates a produce listing. Requires a JWT with the `farmer` role. The `farmer_id` is taken from the token. `status` defaults to `active`.

| Field          | Type   | Required | Notes                 |
| -------------- | ------ | -------- | --------------------- |
| `crop_type`    | string | yes      | Max 80 characters      |
| `quantity_kg`  | number | yes      | Must be positive       |
| `price_per_kg` | number | yes      | Must be positive       |
| `district`     | string | yes      | Max 50 characters      |
| `description`  | string | no       | Free text              |

Responses: `201` with the created listing, `400` on invalid input, `401` without a valid token, `403` for non-farmer roles.

### `PUT /api/listings/:id`

Updates a listing. Requires a JWT with the `farmer` role, and the caller must own the listing. Send any subset of the fields below.

| Field          | Type   | Notes                                    |
| -------------- | ------ | ------------------------------------------ |
| `quantity_kg`  | number | Must be positive                            |
| `price_per_kg` | number | Must be positive                            |
| `description`  | string | Non-empty                                   |
| `status`       | string | One of `active`, `sold`, `cancelled`        |

Responses: `200` with the updated listing, `400` on invalid input, `401` without a valid token, `403` if the caller doesn't own the listing, `404` if it doesn't exist.

### `DELETE /api/listings/:id`

Deletes a listing. Requires a JWT with the `farmer`, `coop_admin`, or `super_admin` role. A farmer may only delete their own listing; `coop_admin` and `super_admin` may delete any listing (marketplace moderation). Deleting a listing also removes any enquiries on it (cascade).

Responses: `204` on success, `401` without a valid token, `403` if a farmer doesn't own the listing, `404` if it doesn't exist.

### `POST /api/enquiries`

Sends a buyer enquiry about a listing. Requires a JWT with the `buyer` role. The `buyer_id` is taken from the token. `status` defaults to `pending`.

| Field        | Type   | Required | Notes                       |
| ------------ | ------ | -------- | ----------------------------- |
| `listing_id` | string | yes      | UUID of an active listing      |
| `message`    | string | yes      | Free text                      |

The listing must exist and still be `active`, and a buyer cannot enquire about their own listing.

Responses: `201` with the created enquiry, `400` on invalid input or an own-listing enquiry, `401` without a valid token, `403` for non-buyer roles, `404` if the listing doesn't exist or is inactive.

### `GET /api/enquiries/received`

Returns every enquiry across all of the logged-in farmer's listings, newest first. Requires a JWT with the `farmer` role. Each enquiry includes the buyer's name and email, and the listing it refers to.

```json
[
  {
    "enquiry_id": "…",
    "listing_id": "…",
    "buyer_id": "…",
    "message": "Is this still available?",
    "status": "pending",
    "created_at": "2026-07-19T00:00:00.000Z",
    "buyer": { "full_name": "…", "email": "…" },
    "listing": { "listing_id": "…", "crop_type": "Maize", "district": "Musanze" }
  }
]
```

Responses: `200` with the enquiries, `401` without a valid token, `403` for non-farmer roles.

### `PUT /api/enquiries/:id`

Marks an enquiry as resolved (or back to pending) once the farmer has followed up with the buyer. Requires a JWT with the `farmer` role, and the caller must own the listing the enquiry belongs to.

| Field    | Type   | Required | Notes                          |
| -------- | ------ | -------- | -------------------------------- |
| `status` | string | yes      | One of `pending`, `resolved`      |

Responses: `200` with the updated enquiry, `400` on an invalid status, `401` without a valid token, `403` if the caller doesn't own the listing, `404` if it doesn't exist.

### `GET /api/weather/:district`

Returns a 5-day forecast for one of Rwanda's 30 districts. Requires a JWT (any role). Served from a 3-hour cache; if OpenWeatherMap is unreachable, a stale cache entry is served instead, marked `stale: true`, rather than failing outright.

Responses: `200` with `{ district, cached, stale?, fetched_at, forecast }`, `401` without a valid token, `404` for an unrecognized district name, `502` if OpenWeatherMap is unavailable and there's no cache to fall back on.

### `POST /api/diagnosis`

Uploads a crop photo for disease diagnosis. Requires a JWT with the `farmer` role. The photo is forwarded to Plant.id and never written to disk or the database — only the result is stored.

| Field       | Type   | Required | Notes                                              |
| ----------- | ------ | -------- | ----------------------------------------------------- |
| `image`     | string | yes      | Base64, or a data URL (`data:image/jpeg;base64,...`)    |
| `crop_type` | string | yes      | Max 80 characters                                      |

Responses: `201` with `{ session_id, crop_type, disease_name, confidence, treatment, is_healthy, note }`, `400` on invalid input, `401` without a valid token, `403` for non-farmer roles, `422` with `{ error: "NOT_A_PLANT" }` if Plant.id detects the photo isn't a plant, `422` if no disease suggestion could be produced, `502` if Plant.id is unavailable.

### `GET /api/admin/users?page=&limit=&role=`

Paginated list of all users, optionally filtered by role. Requires a JWT with the `super_admin` role — every route under `/api/admin` is super-admin only.

| Parameter | Description                          | Default |
| --------- | -------------------------------------- | ------- |
| `page`    | Page number                            | `1`     |
| `limit`   | Results per page, max 100              | `20`    |
| `role`    | Filter by `farmer`/`buyer`/`coop_admin`/`super_admin` | —       |

Responses: `200` with `{ users, total, page, limit }` (password hash never included), `400` for an invalid role filter, `401`/`403` for non-super-admins.

### `PUT /api/admin/users/:id/role`

Changes a user's role. Requires a JWT with the `super_admin` role.

| Field  | Type   | Required | Notes                                              |
| ------ | ------ | -------- | ----------------------------------------------------- |
| `role` | string | yes      | One of `farmer`, `buyer`, `coop_admin`, `super_admin`   |

Responses: `200` with the updated user, `400` for an invalid role, `404` if the user doesn't exist.

### `DELETE /api/admin/users/:id`

Removes a user account. Requires a JWT with the `super_admin` role. A super admin cannot delete their own account, and a user still owning prices, listings, diagnoses, or enquiries cannot be deleted (their data would need to be removed or reassigned first).

Responses: `204` on success, `400` when attempting to delete your own account, `404` if the user doesn't exist, `409` if the user still owns other records.
