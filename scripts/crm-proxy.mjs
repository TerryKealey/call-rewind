#!/usr/bin/env node
/**
 * Local CRM MCP proxy for Call Rewind (browser).
 *
 * Vault CRM Bearer auth requires Cloudflare WARP on the dialing machine.
 * Quick /api/http is cloud-side (no WARP). This proxy runs on your Mac.
 *
 * Uses `curl` for upstream calls — more reliable than Node fetch with WARP.
 *
 *   node scripts/crm-proxy.mjs
 *   → http://127.0.0.1:8787/mcp
 */

import http from "node:http";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const PORT = Number(process.env.CALL_REWIND_CRM_PROXY_PORT || 8787);
const TARGET = "https://vault.shopify.io/crm/mcp";

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Mcp-Session-Id",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Expose-Headers": "Mcp-Session-Id, Content-Type",
    ...headers
  });
  res.end(payload);
}

function curlPost({ auth, contentType, accept, sessionId, body }) {
  return new Promise((resolve, reject) => {
    const id = randomBytes(6).toString("hex");
    const bodyPath = join(tmpdir(), `cr-crm-body-${id}.json`);
    const hdrPath = join(tmpdir(), `cr-crm-hdr-${id}.txt`);
    writeFileSync(bodyPath, body);

    const args = [
      "-sS",
      "-X",
      "POST",
      TARGET,
      "-H",
      `Authorization: ${auth}`,
      "-H",
      `Content-Type: ${contentType || "application/json"}`,
      "-H",
      `Accept: ${accept || "application/json, text/event-stream"}`,
      "-D",
      hdrPath,
      "--data-binary",
      `@${bodyPath}`
    ];
    if (sessionId) {
      args.push("-H", `Mcp-Session-Id: ${sessionId}`);
    }

    const child = spawn("curl", args, { stdio: ["ignore", "pipe", "pipe"] });
    const out = [];
    const err = [];
    child.stdout.on("data", (c) => out.push(c));
    child.stderr.on("data", (c) => err.push(c));
    child.on("close", (code) => {
      try {
        unlinkSync(bodyPath);
      } catch {
        /* ignore */
      }
      let headerText = "";
      try {
        headerText = readFileSync(hdrPath, "utf8");
        unlinkSync(hdrPath);
      } catch {
        /* ignore */
      }
      if (code !== 0) {
        reject(new Error(Buffer.concat(err).toString() || `curl exit ${code}`));
        return;
      }
      const statusMatch = headerText.match(/HTTP\/\d(?:\.\d)?\s+(\d+)/);
      const status = statusMatch ? Number(statusMatch[1]) : 502;
      const sid = headerText.match(/mcp-session-id:\s*(\S+)/i)?.[1];
      resolve({
        status,
        sessionId: sid || null,
        text: Buffer.concat(out).toString("utf8")
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 204, "");
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
    send(res, 200, { ok: true, target: TARGET, warp: "required on this machine" });
    return;
  }

  if (req.method !== "POST" || (req.url !== "/mcp" && req.url !== "/")) {
    send(res, 404, { error: "POST /mcp only" });
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const auth = req.headers.authorization || "";
  if (!auth) {
    send(res, 401, { error: "Missing Authorization Bearer token" });
    return;
  }

  try {
    const upstream = await curlPost({
      auth,
      contentType: req.headers["content-type"],
      accept: req.headers.accept,
      sessionId: req.headers["mcp-session-id"],
      body
    });
    send(
      res,
      upstream.status,
      upstream.text,
      upstream.sessionId ? { "Mcp-Session-Id": upstream.sessionId } : {}
    );
  } catch (error) {
    send(res, 502, {
      error: "Upstream CRM request failed",
      detail: String(error?.message || error),
      hint: "Is Cloudflare WARP connected on this Mac?"
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[call-rewind crm-proxy] http://127.0.0.1:${PORT}/mcp → ${TARGET}`);
  console.log("Keep this running + Cloudflare WARP on, then Connect CRM in the browser.");
});
