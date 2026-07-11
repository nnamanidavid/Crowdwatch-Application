const { Router } = require('express');
const proxy = require('express-http-proxy');

const router = Router();

const AUTH_URL = process.env.AUTH_SERVICE_URL;
const REPORTS_URL = process.env.REPORTS_SERVICE_URL;
const MEDIA_URL = process.env.MEDIA_SERVICE_URL;

const REQUIRED = {
  AUTH_SERVICE_URL: AUTH_URL,
  REPORTS_SERVICE_URL: REPORTS_URL,
  MEDIA_SERVICE_URL: MEDIA_URL
};
for (const [name, val] of Object.entries(REQUIRED)) {
  if (!val) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

// The fix: use proxyReqOptDecorator to preserve the original method
// express-http-proxy was silently converting POST to GET on redirect
router.use('/auth', proxy(AUTH_URL, {
  proxyReqPathResolver: (req) => `/auth${req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.method = srcReq.method;
    return proxyReqOpts;
  },
}));

router.use('/reports', proxy(REPORTS_URL, {
  proxyReqPathResolver: (req) => `/reports${req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.method = srcReq.method;
    return proxyReqOpts;
  },
}));

router.use('/media', proxy(MEDIA_URL, {
  proxyReqPathResolver: (req) => `/media${req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.method = srcReq.method;
    return proxyReqOpts;
  },
}));

module.exports = router;