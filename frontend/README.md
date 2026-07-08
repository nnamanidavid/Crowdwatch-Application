# Crowdwatch Frontend

React + Vite web app. Shows a live map of incident reports, lets users
submit new reports with photos, and handles login/signup.

## Environment Variables

| Variable           | Description                                        |
|--------------------|----------------------------------------------------|
| `VITE_GATEWAY_URL` | Full URL of the Gateway (e.g. https://api.yourapp.com) |

Copy `.env.example` to `.env` and fill in your Gateway URL.

## Pages

| Route     | Page               | Auth Required |
|-----------|--------------------|---------------|
| /         | Map (live reports) | Yes           |
| /submit   | Submit a report    | Yes           |
| /login    | Login form         | No            |
| /signup   | Signup form        | No            |

## Setup (Development)

```bash
npm install
cp .env.example .env    # fill in VITE_GATEWAY_URL
npm run dev             # runs on http://localhost:5173
```

In dev, all `/api/*` requests are proxied to `VITE_GATEWAY_URL`
automatically by Vite — no CORS issues.

## Build (Production)

```bash
npm run build
```

Output goes to `dist/`. Serve as static files via S3 + CloudFront or Nginx.

## Stack

- **React 18** — UI framework
- **Vite** — dev server and bundler
- **React Router** — client-side routing
- **Leaflet + React-Leaflet** — interactive map
- **Axios** — HTTP client (auto-attaches JWT on every request)
