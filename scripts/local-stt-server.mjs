#!/usr/bin/env node
/**
 * Reference local STT sidecar for Relay (matches `src/services/localSttService.ts`).
 * Zero npm dependencies — only Node built-ins.
 *
 * Usage:
 *   npm run local-stt
 *
 * In another terminal: npm run dev
 * Ensure .env.local has VITE_RELAY_LOCAL_STT_URL=http://127.0.0.1:9000
 *
 * Endpoints:
 *   GET  /health   → { ok, whisper }
 *   POST /transcribe  multipart: audio (file), language (optional BCP-47)
 *                 → { text }
 *
 * Transcription:
 *   If `whisper` is on PATH (pip install -U openai-whisper; needs ffmpeg), uses OpenAI Whisper.
 *   Otherwise returns a short placeholder string so you can verify Relay → HTTP wiring.
 *
 * Env:
 *   PORT | RELAY_LOCAL_STT_PORT  (default 9000)
 *   WHISPER_MODEL                 (default tiny)
 *   RELAY_LOCAL_STT_SILENT=1      return empty text (for testing empty handling)
 */

import http from 'node:http';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';

const execFileAsync = promisify(execFile);

const PORT = Number(
  process.env.PORT || process.env.RELAY_LOCAL_STT_PORT || 9000,
);
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'tiny';

function whisperOnPath() {
  const r = spawnSync('whisper', ['-h'], { stdio: 'ignore', timeout: 12000 });
  if (r.error && r.error.code === 'ENOENT') return false;
  return r.status === 0 || r.status === 2;
}

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, body) {
  applyCors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Parse multipart/form-data from Chrome/Fetch (field `audio` + optional `language`).
 * @param {Buffer} buf
 * @param {string} boundaryParam from Content-Type (may be quoted)
 */
function parseMultipart(buf, boundaryParam) {
  const b = boundaryParam.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  const open = Buffer.from(`--${b}\r\n`, 'utf8');
  const sep = Buffer.from(`\r\n--${b}\r\n`, 'utf8');
  const end = Buffer.from(`\r\n--${b}--`, 'utf8');
  const out = { language: 'en', audio: null };

  let start = buf.indexOf(open);
  if (start === -1) {
    throw new Error('Multipart: opening boundary not found');
  }
  start += open.length;

  while (start < buf.length) {
    if (buf.subarray(start, start + end.length).equals(end)) break;

    const hdrEnd = buf.indexOf(Buffer.from('\r\n\r\n', 'utf8'), start);
    if (hdrEnd === -1) break;
    const headers = buf.subarray(start, hdrEnd).toString('utf8');
    const bodyStart = hdrEnd + 4;
    const nextSep = buf.indexOf(sep, bodyStart);
    const nextEnd = buf.indexOf(end, bodyStart);
    let bodyEnd = buf.length;
    if (nextSep !== -1) bodyEnd = nextSep;
    if (nextEnd !== -1 && nextEnd < bodyEnd) bodyEnd = nextEnd;

    const body = buf.subarray(bodyStart, bodyEnd);
    const nm = /name="([^"]+)"/.exec(headers);
    if (nm) {
      if (nm[1] === 'audio' && /filename=/i.test(headers)) out.audio = body;
      else if (nm[1] === 'language')
        out.language = body.toString('utf8').trim() || 'en';
    }

    if (nextEnd === bodyEnd) break;
    start = bodyEnd + sep.length;
  }

  return out;
}

async function runWhisper(inputPath, language) {
  const outDir = mkdtempSync(join(tmpdir(), 'relay-whisper-'));
  const baseNoExt = basename(inputPath, extname(inputPath));
  const lg = String(language || 'en')
    .split(/[-_]/)[0]
    .toLowerCase();
  try {
    await execFileAsync(
      'whisper',
      [
        inputPath,
        '--model',
        WHISPER_MODEL,
        '--language',
        lg || 'en',
        '--output_dir',
        outDir,
        '--output_format',
        'txt',
      ],
      { maxBuffer: 50 * 1024 * 1024, timeout: 300_000 },
    );
    const txtPath = join(outDir, `${baseNoExt}.txt`);
    if (!existsSync(txtPath)) {
      throw new Error(`Whisper did not write ${txtPath}`);
    }
    return readFileSync(txtPath, 'utf8').trim();
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

const STUB_TEXT =
  'Local STT server is running. Install OpenAI Whisper for real transcription: pip install -U openai-whisper and ensure ffmpeg is installed, then restart this script.';

const server = http.createServer(async (req, res) => {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
    sendJson(res, 200, {
      ok: true,
      whisper: whisperOnPath(),
      port: PORT,
      hint: 'POST /transcribe with multipart field "audio" (see localSttService.ts)',
    });
    return;
  }

  if (req.method !== 'POST' || !req.url?.startsWith('/transcribe')) {
    sendJson(res, 404, { error: 'Use GET /health or POST /transcribe' });
    return;
  }

  const ct = String(req.headers['content-type'] ?? '');
  const bm = /boundary=([^;\s]+)/i.exec(ct);
  if (!ct.toLowerCase().includes('multipart') || !bm) {
    sendJson(res, 400, { error: 'Expected multipart/form-data with boundary' });
    return;
  }

  let buf;
  try {
    buf = await readBody(req);
  } catch (e) {
    sendJson(res, 400, {
      error: e instanceof Error ? e.message : 'Body read failed',
    });
    return;
  }

  let parsed;
  try {
    parsed = parseMultipart(buf, bm[1]);
  } catch (e) {
    sendJson(res, 400, {
      error: e instanceof Error ? e.message : 'Invalid multipart',
    });
    return;
  }

  if (!parsed.audio || parsed.audio.length === 0) {
    sendJson(res, 400, { error: 'Missing multipart field "audio"' });
    return;
  }

  const tmpDir = mkdtempSync(join(tmpdir(), 'relay-stt-in-'));
  const inPath = join(tmpDir, 'clip.webm');
  let text = '';
  try {
    writeFileSync(inPath, parsed.audio);
    if (process.env.RELAY_LOCAL_STT_SILENT === '1') {
      text = '';
    } else if (whisperOnPath()) {
      text = await runWhisper(inPath, parsed.language);
    } else {
      text = STUB_TEXT;
    }
    sendJson(res, 200, { text });
  } catch (e) {
    sendJson(res, 500, {
      error: e instanceof Error ? e.message : 'Transcription failed',
    });
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const w = whisperOnPath();
  console.log(
    `[relay local-stt] http://127.0.0.1:${PORT}  whisper=${w ? 'yes' : 'no (stub text)'}`,
  );
  console.log(
    `[relay local-stt] GET /health  POST /transcribe  (CORS *)  model=${WHISPER_MODEL}`,
  );
});
