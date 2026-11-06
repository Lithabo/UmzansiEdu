# UmzaniEdu

An early full-stack MVP of a South African online learning platform. Student registration, sign-in, subjects, lessons and lesson completion are implemented. **AI tutoring, teacher/parent/admin workflows, games, and past papers are planned, not yet implemented.**

## Prerequisites
- Node.js 20.19+ or 22+
- PostgreSQL running locally
- VS Code and Git

## Local setup (Windows PowerShell)
1. Open this folder in VS Code and open Terminal → New Terminal.
2. Run `npm install` then `npm run install:all`.
3. Copy `server/.env.example` to `server/.env` (PowerShell: `Copy-Item server/.env.example server/.env`).
4. Create an empty PostgreSQL database named `umzaniedu` and edit `DATABASE_URL` in `server/.env` with your local credentials.
5. Generate a random JWT secret and set `JWT_SECRET` in `server/.env` (never commit this file). In PowerShell: `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`.
6. Run `npm run db:generate --prefix server`.
7. Run `npm run db:migrate --prefix server -- --name init`.
8. Run `node server/prisma/seed.js` from the project root (the seed loads `server/.env` only if you run it from `server`; instead use `cd server; node prisma/seed.js; cd ..`).
9. Run `npm run dev` from the project root.
10. Visit http://localhost:5173 and register a student account.

The API health check is at http://localhost:4000/api/health.

## Security and production readiness
This is a **local-development MVP**, not a production school. Registration only creates STUDENT accounts; elevated roles cannot be self-assigned. Never commit `.env` files or student information. Before any real deployment, add age-appropriate consent and guardianship, POPIA compliance, secure cookie-based sessions or hardened token storage, email verification, password resets, audit logs, monitoring, backup/recovery, content moderation, and appropriate child safety controls. Educational content is demo material, not an official CAPS curriculum. AI integration requires separate server-side API credentials and appropriate safety controls.
