const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.argv.length > 2 ? Number(process.argv[2]) : 4000;

function sendError(res, statusCode, message, extra = {}) {
  res.status(statusCode).json({ error: message, ...extra });
}

function sendNotFound(res, message = 'Not found') {
  sendError(res, 404, message);
}

function sendServerError(res, error, fallbackMessage = 'Internal server error') {
  sendError(res, 500, fallbackMessage, {
    details: error?.message || fallbackMessage,
  });
}

app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.static('public'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'inkspace-service' });
});

app.use('/api', (_req, res) => {
  sendNotFound(res);
});

app.use((error, _req, res, _next) => {
  sendServerError(res, error);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Service listening on http://localhost:${port}`);
});
