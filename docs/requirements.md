# Hinga — Requirements Document

Status: draft, awaiting peer review (see [#6](https://github.com/nshutilancelot3/Hinga_Project/issues/6))
Source: [Hinga Project Proposal](../Croissant_ProjectProposal.pdf), Chapter 1 (Scope) and Chapter 3 (System Analysis and Design)

## 1. Roles

Every protected route requires a valid JWT. The token carries the user's `role`, which route
middleware checks against the table below. There are four roles, matching the `role` column on
the `users` table (`farmer`, `buyer`, `coop_admin`, `super_admin`).

| Role | Can do | Cannot do |
|---|---|---|
| **Farmer** | View market prices, view district weather forecast, upload a photo for disease diagnosis, create/edit/cancel their own produce listings, view enquiries received on their listings | Edit other farmers' listings, enter market prices, manage users |
| **Buyer** | View market prices, browse marketplace listings, send an enquiry to a farmer on a listing | Create listings, enter market prices, manage users |
| **Cooperative Admin (`coop_admin`)** | Everything a Buyer can view, plus create/update/delete market price entries for the 5 markets | Manage user accounts, delete other admins' price entries |
| **Super Admin (`super_admin`)** | Everything a Cooperative Admin can do, plus create/update/delete/deactivate any user account | — |

Registration collects `full_name`, `email`, `password`, `district`, `role`, and `language_pref`
(default `rw`), matching the `users` table (proposal §3.5).

## 2. Feature Scope

### In scope (MVP, 6 weeks)

| Feature | Description | Primary owner |
|---|---|---|
| Auth | Register/login, JWT issuance, role middleware | Axcel |
| Market price dashboard | Coop/Super admins enter prices for 5 markets (Kimironko, Nyabugogo, Musanze, Huye, Rubavu); all users view crop, price (RWF/kg), last updated | Lancelot |
| Weather forecast | 5-day forecast for the user's district via OpenWeatherMap, server-cached 3 hours | Celio |
| Disease diagnosis | Farmer uploads a plant photo; backend proxies to Plant.id; top result + confidence + treatment shown | Lancelot |
| Marketplace | Farmers post produce listings (crop, quantity, price, pickup area); buyers browse and send enquiries; no payments | Beni (listings), Dianah (buyer flow), Celio (enquiries) |
| Bilingual UI | Every page available in Kinyarwanda and English, switchable at any time via next-intl | Dianah |
| Admin panel | Super admin user CRUD; coop admin price CRUD | Lancelot |

### Out of scope (explicit exclusions, proposal §1.5)

- Live payment processing (MTN MoMo or otherwise) — enquiries are offline-pay only
- A native/from-scratch mobile app — web-responsive only
- A custom-trained ML model — Plant.id's pre-trained model is used as-is
- SMS or USSD delivery
- A live data feed from e-Soko — prices are admin-entered manually

## 3. API Specification

Base URL: `/api/v1`. All request/response bodies are JSON. Routes marked **Auth** require an
`Authorization: Bearer <JWT>` header; the required role is listed where narrower than "any
authenticated user."

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/auth/register` | No | — | Create a user account |
| POST | `/auth/login` | No | — | Authenticate, returns JWT |
| GET | `/prices` | No | — | List market prices (filter by `market`, `crop`) |
| POST | `/prices` | Yes | coop_admin, super_admin | Create a price entry |
| PUT | `/prices/:id` | Yes | coop_admin, super_admin | Update a price entry |
| DELETE | `/prices/:id` | Yes | coop_admin, super_admin | Delete a price entry |
| GET | `/weather/:district` | Yes | any | 5-day forecast, served from cache if < 3h old |
| POST | `/diagnosis` | Yes | farmer | Upload photo, proxy to Plant.id, return diagnosis |
| GET | `/listings` | No | — | Browse active listings (filter by `district`, `crop`) |
| POST | `/listings` | Yes | farmer | Create a listing |
| PATCH | `/listings/:id` | Yes | farmer (owner) | Update status (e.g. mark sold/cancelled) |
| POST | `/listings/:id/enquiries` | Yes | buyer | Send an enquiry on a listing |
| GET | `/listings/:id/enquiries` | Yes | farmer (owner) | View enquiries received on own listing |
| GET | `/admin/users` | Yes | super_admin | List all users |
| PATCH | `/admin/users/:id` | Yes | super_admin | Update role/deactivate a user |
| DELETE | `/admin/users/:id` | Yes | super_admin | Remove a user account |
| GET | `/health` | No | — | Service liveness check (already implemented) |

Error responses use `{ "error": "message" }` with a matching 4xx/5xx status code.

## 4. Non-Functional Requirements

- **Bilingual**: All user-facing strings pass through next-intl; Kinyarwanda (`rw`) is the
  default locale and English (`en`) is the alternate, switchable from any page without a reload.
- **Mobile responsiveness**: Layouts use Tailwind's responsive utilities; every page must render
  usably at a 360px viewport width, since most target users access Hinga from a phone browser.
- **Secure API key handling**: OpenWeatherMap and Plant.id keys live only in backend environment
  variables (`backend/.env`, never committed) and are never sent to or readable from the browser;
  the frontend calls Hinga's own `/weather` and `/diagnosis` proxy routes, not the external APIs
  directly.
- **Data minimization**: Diagnosis photos are forwarded to Plant.id and discarded after the
  response is received — they are not persisted to disk or the database (proposal §1.7).
- **Performance**: Weather responses are cached server-side for 3 hours per district to stay
  within the OpenWeatherMap free-tier rate limit and to keep page loads fast on 3G connections.
