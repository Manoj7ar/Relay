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
 *   GET  /health   → { ok, commandConfigured }
 *   POST /transcribe  multipart: audio (file), language (optional BCP-47)
 *                 → { text }
 *
 * Transcription:
 *   Set RELAY_STT_CMD to any local command that prints a transcript to stdout.
 *   Use {input} and {language} placeholders, e.g.:
 *   RELAY_STT_CMD='./transcribe-local.sh {input} {language}'
 *   If unset, returns placeholder text so you can verify Relay → HTTP wiring.
 *
 * Env:
 *   PORT | RELAY_LOCAL_STT_PORT  (default 9000)
 *   RELAY_STT_CMD                 local command template
 *   RELAY_LOCAL_STT_SILENT=1      return empty text (for testing empty handling)
 */

import http from 'node:http';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const execAsync = promisify(exec);

const PORT = Number(
  process.env.PORT || process.env.RELAY_LOCAL_STT_PORT || 9000,
);
const STT_CMD = process.env.RELAY_STT_CMD || '';

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

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

async function runLocalSttCommand(inputPath, language) {
  if (!STT_CMD.trim()) return '';
  const cmd = STT_CMD.replaceAll('{input}', shellQuote(inputPath)).replaceAll(
    '{language}',
    shellQuote(language || 'en'),
  );
  const { stdout } = await execAsync(cmd, {
    maxBuffer: 50 * 1024 * 1024,
    timeout: 300_000,
  });
  return stdout.trim();
}

const STUB_TEXT =
  'Local STT server is running. Set RELAY_STT_CMD to a local transcription command that prints text to stdout for real transcripts.';

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
      commandConfigured: Boolean(STT_CMD.trim()),
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
    } else if (STT_CMD.trim()) {
      text = await runLocalSttCommand(inPath, parsed.language);
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
  const base = `http://127.0.0.1:${PORT}`;
  const cmd = STT_CMD.trim() ? 'RELAY_STT_CMD=set' : 'RELAY_STT_CMD=unset (stub)';
  console.log(
    `[relay local-stt] ${base}  ${cmd}  GET /health  POST /transcribe  CORS=*`,
  );
});
