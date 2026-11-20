/**
 * Vault CRM credentials for Call Rewind (browser / Quick).
 *
 * CRM MCP requires:
 *   1) Personal Vault API token (Bearer)
 *   2) Cloudflare WARP on the machine that dials vault.shopify.io
 *
 * Quick's /api/http proxy runs in the cloud (no WARP) → valid tokens fail with
 * "Cloudflare WARP connection required". So we call a local proxy on this Mac
 * (scripts/crm-proxy.mjs) which has WARP + CORS.
 *
 * Create / copy token: https://vault.shopify.io/api_token
 * Help: #crm-mcp · #help-vault
 */

const LS_TOKEN = "call-rewind.vault.crm.token";
const LS_META = "call-rewind.vault.crm.meta";
export const CRM_MCP_URL = "https://vault.shopify.io/crm/mcp";
export const CRM_LOCAL_PROXY = "http://127.0.0.1:8787/mcp";
export const VAULT_TOKEN_URL = "https://vault.shopify.io/api_token";
export const VAULT_ORIGIN = "https://vault.shopify.io";
export const RESOURCE_CRM = CRM_MCP_URL;

function loadJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCrmAuth() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_META);
}

export function hasCrmAccessToken() {
  return Boolean(getStoredToken());
}

function getStoredToken() {
  const meta = loadJson(LS_META);
  if (meta?.access_token) return String(meta.access_token).trim();
  const raw = localStorage.getItem(LS_TOKEN);
  return raw ? String(raw).trim() : "";
}

export function getCrmAccessToken() {
  return getStoredToken() || null;
}

/** Normalize pasted Vault API tokens (quotes, Bearer prefix, whitespace). */
export function sanitizeVaultToken(raw) {
  let t = String(raw ?? "");
  t = t.split(/\r?\n/)[0] || "";
  t = t.trim();
  t = t.replace(/^["'`]+|["'`]+$/g, "");
  t = t.replace(/^Bearer\s+/i, "");
  t = t.replace(/^(vault\s*)?(api\s*)?token\s*[:=]\s*/i, "");
  t = t.replace(/\s+/g, "");
  return t;
}

/**
 * Save token locally and verify it against CRM MCP via local WARP proxy.
 */
export async function saveAndVerifyCrmToken(token) {
  const cleaned = sanitizeVaultToken(token);
  if (!cleaned) {
    const err = new Error("Paste your Vault API token to connect CRM.");
    err.code = "CRM_AUTH";
    throw err;
  }
  if (cleaned.length < 20) {
    const err = new Error(
      "That doesn’t look like a full Vault API token. Paste the whole token from the api_token page (no quotes)."
    );
    err.code = "CRM_AUTH";
    throw err;
  }

  await verifyCrmToken(cleaned);

  localStorage.setItem(LS_TOKEN, cleaned);
  localStorage.setItem(
    LS_META,
    JSON.stringify({
      access_token: cleaned,
      connected_at: Date.now(),
      source: "vault_api_token"
    })
  );
  return true;
}

function parseCrmErrorPayload(text) {
  const raw = String(text || "");
  const candidates = [raw];
  if (raw.includes("data:")) {
    for (const line of raw.split(/\n/)) {
      if (line.startsWith("data:")) candidates.push(line.slice(5).trim());
    }
  }
  for (const c of candidates) {
    try {
      const j = JSON.parse(c);
      const msg = j?.error?.message || j?.message || j?.hint || j?.error || "";
      const instructions = j?.error?.data?.instructions || j?.instructions || j?.hint || "";
      if (msg || instructions || j?.error) {
        return {
          message: typeof msg === "string" ? msg : String(msg || ""),
          instructions: typeof instructions === "string" ? instructions : "",
          json: j
        };
      }
    } catch {
      /* next */
    }
  }
  return { message: raw.slice(0, 240), instructions: "", json: null };
}

export function isHttpsPage() {
  return typeof location !== "undefined" && location.protocol === "https:";
}

export function localPreviewUrl() {
  return "http://call-rewind.quick.localhost:1337/";
}

export async function checkLocalCrmProxy() {
  if (isHttpsPage()) return false;
  try {
    const res = await fetch("http://127.0.0.1:8787/health", {
      method: "GET",
      cache: "no-store"
    });
    if (!res.ok) return false;
    const j = await res.json().catch(() => ({}));
    return Boolean(j?.ok);
  } catch {
    return false;
  }
}

/**
 * POST to CRM MCP via local WARP proxy only.
 * Never use Quick /api/http (cloud egress has no WARP → Vault rejects Bearer).
 * Never call localhost from the deployed HTTPS site (browser blocks mixed content).
 */
export async function postCrmMcp(body, { bearer, sessionId } = {}) {
  if (isHttpsPage()) {
    const err = new Error(
      `CRM Connect can’t run on the deployed HTTPS site (no WARP path). Open the local preview instead: ${localPreviewUrl()} — with WARP on and node scripts/crm-proxy.mjs running.`
    );
    err.code = "CRM_PROXY";
    throw err;
  }

  const token = bearer || (await ensureCrmBearer());
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${token}`
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const proxyUp = await checkLocalCrmProxy();
  if (!proxyUp) {
    const err = new Error(
      "Local CRM proxy not reachable. In Terminal: node scripts/crm-proxy.mjs — keep Cloudflare WARP Connected, then retry on http://call-rewind.quick.localhost:1337/"
    );
    err.code = "CRM_PROXY";
    throw err;
  }

  let response;
  try {
    response = await fetch(CRM_LOCAL_PROXY, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
  } catch (error) {
    const err = new Error(
      `CRM proxy unreachable (${error.message}). Run: node scripts/crm-proxy.mjs — WARP on — use http://call-rewind.quick.localhost:1337/`
    );
    err.code = "CRM_PROXY";
    throw err;
  }

  const text = await response.text();
  const sid = response.headers.get("mcp-session-id");
  return { response, text, sessionId: sid };
}

async function verifyCrmToken(token) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "call-rewind", version: "0.5.4" }
    }
  };

  const { response, text } = await postCrmMcp(body, { bearer: token });
  const parsed = parseCrmErrorPayload(text);

  const warpHit = /warp/i.test(
    `${parsed.message} ${parsed.instructions} ${JSON.stringify(parsed.json || {})}`
  );

  if (!response.ok || parsed.json?.error || warpHit) {
    if (warpHit) {
      const err = new Error(
        "Vault saw a non-WARP client. Use http://call-rewind.quick.localhost:1337/ (not the .quick.shopify.io HTTPS site), keep WARP Connected, and run: node scripts/crm-proxy.mjs"
      );
      err.code = "CRM_PROXY";
      err.status = response.status;
      throw err;
    }
    const vaultMsg = parsed.message || `HTTP ${response.status}`;
    const err = new Error(
      response.status === 401 || response.status === 403 || parsed.json?.error
        ? [
            `CRM rejected this credential (${vaultMsg}).`,
            `Copy the personal token from ${VAULT_TOKEN_URL} (the UUID on that page is the token).`,
            "Paste only the token — no Bearer prefix."
          ].join(" ")
        : `CRM verify failed (${response.status}): ${parsed.instructions || vaultMsg}`
    );
    err.code = "CRM_AUTH";
    err.status = response.status;
    throw err;
  }
}

export async function ensureCrmBearer() {
  const token = getStoredToken();
  if (token) return token;

  const err = new Error(
    "Connect CRM once with your Vault API token (same value shown on vault.shopify.io/api_token)."
  );
  err.code = "CRM_AUTH";
  throw err;
}

export async function completeCrmConnectIfPresent() {
  return false;
}

export function openVaultTokenPage() {
  window.open(VAULT_TOKEN_URL, "vault-api-token", "noopener,noreferrer");
}

export async function refreshCrmAccessToken() {
  clearCrmAuth();
  const err = new Error("CRM credential rejected — Connect CRM again with your Vault API token.");
  err.code = "CRM_AUTH";
  throw err;
}
