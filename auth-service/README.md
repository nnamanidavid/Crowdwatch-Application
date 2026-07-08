# Auth Service

Handles user signup, login, and JWT verification for Crowdwatch.
Every other service verifies tokens using the same `JWT_SECRET` — they don't
call Auth Service on every request. Auth Service is only called directly for
signup, login, and the `/auth/me` profile endpoint.

## Environment Variables

| Variable       | Description                              |
|----------------|------------------------------------------|
| `DATABASE_URL` | Postgres connection string               |
| `JWT_SECRET`   | Secret used to sign and verify JWT tokens |
| `PORT`         | Port to listen on (default: 3000)        |
| `DATABASE_SSL` | Set to `true` on RDS (default: false)    |

## Routes

| Method | Path          | Auth | Description                        |
|--------|---------------|------|------------------------------------|
| POST   | /auth/signup  | No   | Create account, returns JWT        |
| POST   | /auth/login   | No   | Login, returns JWT                 |
| GET    | /auth/verify  | Yes  | Verify a token, returns user object|
| GET    | /auth/me      | Yes  | Get current user profile           |
| GET    | /health       | No   | Kubernetes liveness probe          |

## Setup

```bash
npm install
node src/db/migrate.js   # run once to create the users table
npm start
```

## Request Examples

**Signup**
```json
POST /auth/signup
{ "email": "czar@example.com", "password": "secret", "username": "czar" }
```

**Login**
```json
POST /auth/login
{ "email": "czar@example.com", "password": "secret" }
```

Both return: `{ "token": "eyJ...", "user": { "id": "...", "email": "...", "username": "..." } }`
