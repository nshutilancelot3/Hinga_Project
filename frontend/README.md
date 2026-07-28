# Hinga Frontend

Next.js 14 app (Tailwind CSS, next-intl for Kinyarwanda/English).

Deployed on Render. Live at [hinga-frontend.onrender.com](https://hinga-frontend.onrender.com).

## Pages

| Route          | Description                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| `/`            | Home page: tagline and feature highlights                                    |
| `/login`       | Sign in                                                                       |
| `/register`    | Create an account (farmer, buyer, or cooperative admin)                      |
| `/prices`      | Market prices, with crop/market filters and price trend charts               |
| `/weather`     | 5-day forecast by district                                                   |
| `/diagnosis`   | Upload a crop photo for disease diagnosis                                    |
| `/marketplace` | Browse listings, post/manage your own (farmers), send enquiries (buyers)     |
| `/enquiries`   | A farmer's received enquiries, with the ability to mark them resolved        |
| `/admin`       | Super-admin panel: user management and price CRUD                           |

All text passes through `next-intl` — see `messages/en.json` and `messages/rw.json` for the bilingual strings, and `lib/` for translation helpers covering dynamic content (crop names, disease names, weather conditions) that come from the database or external APIs already in English.
