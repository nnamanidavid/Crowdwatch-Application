const { Router } = require('express');
const proxy = require('express-http-proxy');

const router = Router();

// Each service URL comes from environment variables.
// In Kubernetes, these will be the internal cluster DNS names:
// e.g. AUTH_SERVICE_URL=http://auth-service.default.svc.cluster.local:3000
// Services are NOT reachable from the internet — only the Gateway is.

const AUTH_URL    = process.env.AUTH_SERVICE_URL;
const REPORTS_URL = process.env.REPORTS_SERVICE_URL;
const MEDIA_URL   = process.env.MEDIA_SERVICE_URL;

// Fail loudly at startup if any upstream URL is missing —
// better to crash with a clear message than silently forward to nothing.
const REQUIRED = { AUTH_SERVICE_URL: AUTH_URL, REPORTS_SERVICE_URL: REPORTS_URL, MEDIA_SERVICE_URL: MEDIA_URL };
for (const [name, val] of Object.entries(REQUIRED)) {
  if (!val) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

// proxy() forwards the full request (headers, body, method) to the upstream
// and streams the response back to the client transparently.

router.use('/auth', proxy(AUTH_URL, {
  proxyReqPathResolver: (req) => `/auth${req.url}`,
}));

router.use('/reports', proxy(REPORTS_URL, {
  proxyReqPathResolver: (req) => `/reports${req.url}`,
}));

router.use('/media', proxy(MEDIA_URL, {
  proxyReqPathResolver: (req) => `/media${req.url}`,
}));

module.exports = router;
