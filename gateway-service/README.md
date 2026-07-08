# Gateway Service

The single entry point for all client requests. Verifies JWTs and proxies
traffic to the correct upstream service. This is the only service exposed
to the internet via the ALB — all other services are private.

## Environment Variables

| Variable               | Description                                    |
|------------------------|------------------------------------------------|
| `JWT_SECRET`           | Shared secret to verify JWTs                   |
| `AUTH_SERVICE_URL`     | Internal URL of Auth Service                   |
| `REPORTS_SERVICE_URL`  | Internal URL of Reports Service                |
| `MEDIA_SERVICE_URL`    | Internal URL of Media Service                  |
| `PORT`                 | Port to listen on (default: 3004)              |

## Kubernetes Internal URLs

In production these will use Kubernetes cluster DNS:
```
AUTH_SERVICE_URL=http://auth-service.default.svc.cluster.local:3000
REPORTS_SERVICE_URL=http://reports-service.default.svc.cluster.local:3001
MEDIA_SERVICE_URL=http://media-service.default.svc.cluster.local:3002
```
Replace `default` with your actual namespace if different.

## Route Mapping

| Incoming path    | Proxied to         |
|------------------|--------------------|
| /auth/*          | Auth Service       |
| /reports/*       | Reports Service    |
| /media/*         | Media Service      |

## Public vs Protected

`/auth/signup`, `/auth/login`, and `/health` are public.
Every other route requires a valid `Authorization: Bearer <token>` header.

## Setup

```bash
npm install
npm start
```
