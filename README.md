# Hinga

A bilingual web platform for Rwanda's smallholder farmers: market prices, weather forecast, crop disease diagnosis, and a produce marketplace in Kinyarwanda and English.

## Live Demo

- **App (frontend):** https://hinga-frontend.onrender.com
- **API health check:** https://hinga-backend-8qfy.onrender.com/health

> Hosted on Render's free tier, so the services sleep after inactivity — the first request may take ~50 seconds to wake them.

- **App demo link:** https://youtu.be/K5xcOEQ6o1Q

## Design

[Wireframes on Figma](https://www.figma.com/design/DvsgrmtfWybZK8p3MtUV9P/Hinga-wireframes?node-id=0-1) (user flow, mobile and desktop screens)

## Team

| Name | Role | GitHub |
|------|------|--------|
| Ishimwe Axcel | Backend Lead & Auth Engineer | [@iaxcel-ai](https://github.com/iaxcel-ai) |
| Rugwiro Celio Derrick | Integrations Engineer & Enquiries API | [@rderrick-ux](https://github.com/rderrick-ux) |
| Teta Dianah | Frontend Engineer & Marketplace Buyer Flow | [@Teta-Dianah](https://github.com/Teta-Dianah) |
| Imanzi Beni | Database Engineer & Listings API | [@imz-beni](https://github.com/imz-beni) |
| Nshuti Lancelot | Market Prices API & Admin Panel | [@nshutilancelot3](https://github.com/nshutilancelot3) |

## Tech Stack

- **Frontend:** Next.js 14, Tailwind CSS, next-intl
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL (Render managed)
- **Testing:** Jest + Supertest, run against a throwaway Postgres instance ([backend/TESTING.md](backend/TESTING.md))
- **Deployment:** Render
- **External APIs:** OpenWeatherMap, Plant.id

## API Documentation

Full endpoint reference: [backend/README.md](backend/README.md). Roles, feature scope, and the API contract: [docs/requirements.md](docs/requirements.md).
