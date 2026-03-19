import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9222;
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4200';
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!email || !password || !supabaseUrl || !supabaseAnonKey) {
  throw new Error('TEST_EMAIL, TEST_PASSWORD, VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios.');
}

const userDataDir = mkdtempSync(path.join(os.tmpdir(), 'vera-cruz-chrome-'));
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=' + debugPort,
    '--user-data-dir=' + userDataDir,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWebSocketUrl() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const data = await response.json();
      const page = data.find((entry) => entry.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome DevTools não respondeu.');
}

const wsUrl = await getWebSocketUrl();
const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      reject(new Error(message.error.message));
    } else {
      resolve(message.result);
    }
  }
});

function send(method, params = {}) {
  const id = nextId;
  nextId += 1;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

await send('Page.enable');
await send('Runtime.enable');

const authClient = createClient(supabaseUrl, supabaseAnonKey);
const signInResult = await authClient.auth.signInWithPassword({ email, password });
if (signInResult.error || !signInResult.data.session) {
  throw new Error(signInResult.error?.message || 'Falha ao criar sessão Supabase.');
}

const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
const storageKey = `sb-${projectRef}-auth-token`;
const sessionPayload = JSON.stringify(signInResult.data.session);

await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `
    (() => {
      try {
        localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(sessionPayload)});
      } catch (error) {
        console.error(error);
      }
    })();
  `,
});

async function waitFor(checkExpression, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await send('Runtime.evaluate', {
      expression: checkExpression,
      returnByValue: true,
    });
    if (result.result?.value) return result.result.value;
    await sleep(300);
  }
  throw new Error(`Timeout aguardando condição: ${checkExpression}`);
}

await send('Page.navigate', { url: `${baseUrl}/leads` });
await waitFor(`document.readyState === 'complete'`);
await waitFor(`window.location.pathname === '/leads'`);
await waitFor(`document.querySelector('.user-role')?.textContent?.includes('Gestor')`);
await waitFor(`document.querySelectorAll('tbody tr').length > 0`);

const summary = await send('Runtime.evaluate', {
  expression: `
    (() => ({
      pathname: window.location.pathname,
      role: document.querySelector('.user-role')?.textContent?.trim() || null,
      name: document.querySelector('.user-name')?.textContent?.trim() || null,
      rows: document.querySelectorAll('tbody tr').length,
      firstLead: document.querySelector('tbody tr td a')?.textContent?.trim() || null
    }))()
  `,
  returnByValue: true,
});

console.log(JSON.stringify(summary.result.value, null, 2));

ws.close();
chrome.kill('SIGKILL');
await sleep(500);
try {
  rmSync(userDataDir, { recursive: true, force: true });
} catch {}
