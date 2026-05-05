# Oakcast Studio

Premium woodworking portfolio and e-commerce-ready foundation built with React (Vite), Tailwind CSS, Framer Motion, GSAP, Node.js (Express), Sequelize, and PostgreSQL.

## Project Structure

- `frontend`: React + Vite + Tailwind + Framer Motion + GSAP
- `backend`: Express + Sequelize + PostgreSQL models and APIs
- `docker-compose.yml`: Spins up frontend, backend, and database containers

## Quick Start

```bash
docker compose up --build
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:5001/api`  
Health check: `http://localhost:5001/api/health`

## Included API Endpoints

**Public**

- `GET /api/projects`
- `GET /api/projects/:id`
- `GET /api/inquiries`
- `POST /api/inquiries`

**Admin** (Bearer JWT after login — uploads stored under `backend/uploads`, served at `/uploads/...`)

- `POST /api/admin/login` — body: `{ "username", "password" }` (from env)
- `POST /api/admin/upload` — `multipart/form-data` field `images` (multiple files)
- `GET /api/admin/projects`
- `POST /api/admin/projects` — JSON including `image_urls` (array of paths returned from upload)
- `PUT /api/admin/projects/:id`
- `DELETE /api/admin/projects/:id`

## Hidden admin UI

Open `http://localhost:5173/hiddenadmin` — sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`. Create projects, upload multiple images per project, delete entries.

Set a strong `ADMIN_JWT_SECRET` in production. Defaults in `docker-compose.yml` are placeholders only.

## Notes

- Sequelize auto-sync is enabled in development using `sequelize.sync({ alter: true })`.
- Frontend uses lazy-loaded images and viewport-based animation triggers for smoother performance.
- i18n is configured with EN/LT language toggle in the frontend.
- Add your custom images in `frontend/public/images`.
- Projects support multiple images: `image_urls` (JSON array); `image_url` mirrors the first image for compatibility.
- Each project has **`title_en`**, **`title_lt`**, **`description_en`**, and **`description_lt`** — the site picks title and description by the active language (with fallbacks).
- **`sale_status`**: `for_sale` or `sold` — shown as a pill on the gallery and detail modal; set in the admin form or via the list dropdown.
