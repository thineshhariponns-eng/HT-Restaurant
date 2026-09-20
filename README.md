# TeamOmnifield — HTRestaurantErode Full-Stack Evaluation

A containerized ASP.NET Core MVC (.NET 10) application with PostgreSQL for managing orders placed on **htrestaurant.com**, fulfilled by the owners through **admin.htrestaurant.com**. The solution is intentionally designed as a practical full-stack evaluation project for Harsha and Thinesh.

## Local architecture

```text
Browser
  |
  +-- htrestaurant.com --------> Nginx :8080 --+
  |                                             |
  +-- admin.htrestaurant.com --> Nginx :8080 --> ASP.NET Core MVC :8080 --> PostgreSQL :5432
  |                                             |
  +-- teamomnifield.ai --------> Nginx :8080 --+
```

All application/runtime services are containerized. No local .NET or PostgreSQL installation is required.

## Prerequisites

- Docker Desktop with Docker Compose
- Git
- A browser

## Start

From the repository root:

```bash
docker compose up --build -d
```

Then add these lines to the machine's hosts file:

```text
127.0.0.1 htrestaurant.com
127.0.0.1 admin.htrestaurant.com
127.0.0.1 teamomnifield.ai
```

Windows hosts file:
`C:\Windows\System32\drivers\etc\hosts`

Open:

- http://htrestaurant.com:8080 — customer restaurant storefront
- http://admin.htrestaurant.com:8080 — owner/admin fulfillment console
- http://teamomnifield.ai:8080 — TeamOmnifield system dashboard
- http://localhost:8080 — health/diagnostic fallback

The root path on each named host automatically routes to the appropriate experience: restaurant storefront, admin login/dashboard, or TeamOmnifield operations.

### Seed admin login

- Email: `admin@htrestaurant.com`
- Password: `Admin@12345`

Change this immediately if this is ever used outside local evaluation.

## Spam protection

The public checkout form is protected by Cloudflare Turnstile (sitekey for `htrestaurant.com`, public and embedded in the page). Server-side verification is controlled by one environment variable:

- `TURNSTILE_SECRET_KEY` — Turnstile secret for `htrestaurant.com`. **Unset (default): soft mode** — submissions are accepted and a warning is logged, so the site works out of the box. **Set: strict mode** — checkout submissions without a valid `cf-turnstile-response` token are rejected with HTTP 400.

To enable strict mode locally: `TURNSTILE_SECRET_KEY=<secret> docker compose up --build -d` (compose passes `${TURNSTILE_SECRET_KEY:-}` through). Never commit the secret.

## Useful commands

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f postgres
docker compose down
# Delete database volume and reseed from scratch:
docker compose down -v
```

## Evaluation flow

1. Open the restaurant site.
2. Browse seeded menu categories and products.
3. Add products to cart.
4. Submit an order with customer name, phone and delivery address.
5. Open the admin console and sign in.
6. View new orders and change status: Pending → Confirmed → Preparing → Ready → OutForDelivery → Delivered.
7. Test cancellation.
8. Open TeamOmnifield dashboard and inspect operational metrics.
9. Verify PostgreSQL persistence by restarting the web container.

## Project structure

- `src/TeamOmnifield.Web` — ASP.NET Core MVC application
- `tests/TeamOmnifield.Web.Tests` — unit tests
- `nginx` — local reverse proxy and host routing
- `db` — PostgreSQL initialization
- `SPECIFICATION.md` — evaluation specification and acceptance criteria
- `CHECKLIST.md` — implementation/evaluation checklist
- `docker-compose.yml` — complete local stack

## Design principles

- MVC separation of concerns
- Controllers delegate to services
- EF Core + PostgreSQL
- Strong model validation
- Cookie authentication for the local admin area
- Anti-forgery protection on state-changing MVC forms
- Host-aware UI separation
- Container-first local setup
- Health endpoint for operational verification
- No external email dependency
- No payment gateway dependency for the evaluation MVP

