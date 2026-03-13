const http = require('http');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.PORT || 4000);
const PYTHON_BIN = process.env.PYTHON_BIN || '/usr/local/bin/python3';
const PREDICT_SCRIPT = path.join(process.cwd(), 'model', 'predict_word.py');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 15 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', reject);
  });
}

function parseImageDataUrl(imageDataUrl) {
  if (typeof imageDataUrl !== 'string') {
    throw new Error('imageDataUrl is required');
  }
  const match = imageDataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    throw new Error('imageDataUrl must be a PNG data URL');
  }
  return Buffer.from(match[1], 'base64');
}

async function handlePredict(req, res) {
  let tempDir = '';
  try {
    const rawBody = await readBody(req);
    const body = JSON.parse(rawBody || '{}');
    const imageBuffer = parseImageDataUrl(body.imageDataUrl);

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ink-predict-'));
    const imagePath = path.join(tempDir, 'input.png');
    await fs.writeFile(imagePath, imageBuffer);

    const { stdout, stderr } = await execFileAsync(PYTHON_BIN, [PREDICT_SCRIPT, imagePath], {
      cwd: process.cwd(),
      timeout: 120000,
      maxBuffer: 1024 * 1024,
    });

    const predictedWord = String(stdout).trim().split('\n').pop() || '';
    if (!predictedWord) {
      throw new Error(stderr || 'No prediction returned by Python script');
    }

    sendJson(res, 200, { predictedWord });
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Prediction failed' });
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/predict') {
    await handlePredict(req, res);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Prediction service listening on http://localhost:${PORT}`);
});
