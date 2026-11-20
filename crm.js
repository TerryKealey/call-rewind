/**
 * Vault CRM MCP client for Call Rewind (browser / Quick).
 *
 * Uses local WARP proxy (scripts/crm-proxy.mjs) + Vault API token in localStorage.
 * Quick /api/http cannot reach CRM with Bearer (no WARP on cloud egress).
 *
 * Help: #crm-mcp · #help-vault
 */

import {
  ensureCrmBearer,
  hasCrmAccessToken,
  refreshCrmAccessToken,
  clearCrmAuth,
  postCrmMcp
} from "./crm-auth.js";

let sessionId = null;
let requestId = 1;

function nextId() {
  requestId += 1;
  return requestId;
}

function toolResultText(result) {
  if (!result) return "";
  if (typeof result === "string") return result;
  const parts = result.content || result;
  if (Array.isArray(parts)) {
    return parts
      .map((p) => (typeof p === "string" ? p : p?.text || ""))
      .filter(Boolean)
      .join("\n");
  }
  if (result.text) return String(result.text);
  return JSON.stringify(result);
}

function parseMcpPayload(text, contentType = "") {
  if (contentType.includes("text/event-stream") || text.includes("data:")) {
    const dataLines = text
      .split(/\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);
    let last = null;
    for (const line of dataLines) {
      try {
        last = JSON.parse(line);
      } catch {
        /* skip */
      }
    }
    if (last) return last;
  }
  return JSON.parse(text);
}

async function mcpRpc(method, params = {}) {
  const body = {
    jsonrpc: "2.0",
    id: nextId(),
    method,
    params
  };

  let bearer = await ensureCrmBearer();
  try {
    const { response, text, sessionId: sid } = await postCrmMcp(body, {
      bearer,
      sessionId
    });
    if (sid) sessionId = sid;

    if (!response.ok) {
      let detail = text.slice(0, 280);
      try {
        const j = JSON.parse(text);
        detail =
          j?.error?.data?.instructions ||
          j?.error?.message ||
          j?.hint ||
          j?.error ||
          detail;
      } catch {
        /* keep */
      }
      const err = new Error(
        response.status === 401 || response.status === 403
          ? `CRM auth failed. ${detail}`
          : `CRM MCP HTTP ${response.status}: ${detail}`
      );
      err.code =
        response.status === 401 || response.status === 403
          ? "CRM_AUTH"
          : /warp|proxy/i.test(String(detail))
            ? "CRM_PROXY"
            : "CRM_HTTP";
      err.status = response.status;
      throw err;
    }

    const payload = parseMcpPayload(text, response.headers.get("content-type") || "");
    if (payload?.error) {
      const msg = payload.error.message || JSON.stringify(payload.error);
      const instructions = payload.error?.data?.instructions || "";
      const err = new Error(`CRM MCP: ${msg}${instructions ? ` — ${instructions}` : ""}`);
      err.code = /auth|unauthor|forbidden|401|403|credential|token|warp/i.test(
        `${msg} ${instructions}`
      )
        ? /warp/i.test(`${msg} ${instructions}`)
          ? "CRM_PROXY"
          : "CRM_AUTH"
        : "CRM_TOOL";
      throw err;
    }
    return payload?.result;
  } catch (error) {
    if (error.code === "CRM_PROXY") throw error;
    if (error.code === "CRM_AUTH" || error.status === 401) {
      try {
        bearer = await refreshCrmAccessToken();
        sessionId = null;
        const { response, text, sessionId: sid } = await postCrmMcp(body, { bearer });
        if (sid) sessionId = sid;
        if (!response.ok) throw error;
        const payload = parseMcpPayload(text);
        if (payload?.error) throw error;
        return payload?.result;
      } catch (refreshError) {
        clearCrmAuth();
        sessionId = null;
        const err = new Error(
          refreshError.message ||
            "CRM session expired — Connect CRM again with your Vault API token."
        );
        err.code = refreshError.code || "CRM_AUTH";
        throw err;
      }
    }
    throw error;
  }
}

export async function ensureCrmSession() {
  if (!hasCrmAccessToken()) {
    const err = new Error(
      "Connect CRM once with your Vault API token (from vault.shopify.io/api_token)."
    );
    err.code = "CRM_AUTH";
    throw err;
  }
  await mcpRpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "call-rewind", version: "0.5.4" }
  });
  try {
    await mcpRpc("notifications/initialized", {});
  } catch {
    /* optional */
  }
}

export async function crmCallTool(name, args) {
  if (!sessionId) {
    await ensureCrmSession();
  }
  try {
    const result = await mcpRpc("tools/call", { name, arguments: args });
    return toolResultText(result);
  } catch (error) {
    if (
      error.code === "CRM_HTTP" ||
      error.code === "CRM_AUTH" ||
      /session|initialize/i.test(error.message || "")
    ) {
      sessionId = null;
      await ensureCrmSession();
      const result = await mcpRpc("tools/call", { name, arguments: args });
      return toolResultText(result);
    }
    throw error;
  }
}

export function parseDealFromCrmText(text) {
  const accountId =
    text.match(/\*\*Account:\*\*[^\n]*\(ID:\s*(\d+)\)/i)?.[1] ||
    text.match(/accounts\/(\d+)/i)?.[1] ||
    text.match(/Account ID[:\s]+(\d+)/i)?.[1] ||
    "";
  const dealName =
    text.match(/\*\*Name:\*\*\s*\[[^\]]*\]\([^)]+\)\s*([^\n]+)/i)?.[1]?.trim() ||
    text.match(/\*\*Name:\*\*\s*\[([^\]]+)\]/i)?.[1]?.trim() ||
    "";
  const merchant = text.match(/\*\*Account:\*\*\s*\[([^\]]+)\]/i)?.[1]?.trim() || "";
  return { accountId, dealName, merchant };
}

export function parseMeetingsFromActivities(text) {
  const meetings = [];
  for (const line of String(text || "").split(/\n/)) {
    if (!/Meeting/i.test(line)) continue;
    const id =
      line.match(/Meeting ID:\s*(\d+)/i)?.[1] ||
      line.match(/meetings\/(\d+)/i)?.[1] ||
      line.match(/\|\s*Meeting\s*\|\s*(\d+)\s*\|/i)?.[1];
    if (!id) continue;
    const when = line.match(/\|\s*(\d{4}-\d{2}-\d{2}[^|]*)\|/)?.[1]?.trim() || "";
    const title =
      line.match(/met — ([^|(]+)/i)?.[1]?.trim() ||
      line.match(/Meetings\s*\|\s*([^|]+)\|/i)?.[1]?.trim() ||
      `Meeting ${id}`;
    meetings.push({
      id,
      when: when.replace(/\s+/g, " ").trim(),
      title: title.replace(/\s+/g, " ").trim()
    });
  }
  return meetings.sort((a, b) => String(b.when).localeCompare(String(a.when)));
}

export function formatCrmTranscript(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";

  const jsonStart = text.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(text.slice(jsonStart));
      const turns = parsed.transcript || parsed.turns || [];
      if (Array.isArray(turns) && turns.length) {
        return turns
          .map((t) => {
            const speaker = t.speaker || t.speaker_name || "Speaker";
            const body = t.text || t.speaker_text || "";
            return body ? `${speaker}: ${body}` : "";
          })
          .filter(Boolean)
          .join("\n");
      }
    } catch {
      /* use raw */
    }
  }

  return text.replace(/^#+\s*/gm, "").replace(/\*\*/g, "").trim();
}

export async function lookupCrmTranscript({ dealId, accountId, meetingId, merchant }) {
  let resolvedAccountId = accountId || "";
  let dealName = "";
  let merchantName = merchant || "";
  let sourceDealId = dealId || "";

  if (meetingId) {
    const raw = await crmCallTool("crm_get_meeting_transcript", {
      meeting: Number(meetingId) || meetingId
    });
    const transcript = formatCrmTranscript(raw);
    if (!transcript) throw new Error(`CRM meeting ${meetingId} has no readable transcript.`);
    return {
      transcript,
      source: {
        dealId: sourceDealId,
        dealName: "",
        merchant: merchantName,
        callDate: "",
        callTitle: `Meeting ${meetingId}`,
        retrieval: "crm"
      }
    };
  }

  if (dealId) {
    const dealText = await crmCallTool("crm_get_deal", { deal: Number(dealId) || dealId });
    const parsed = parseDealFromCrmText(dealText);
    resolvedAccountId = parsed.accountId || resolvedAccountId;
    dealName = parsed.dealName || "";
    merchantName = merchantName || parsed.merchant || "";
    sourceDealId = String(dealId);
    if (!resolvedAccountId) {
      throw new Error(`CRM deal ${dealId} loaded but no account ID found.`);
    }
  }

  if (!resolvedAccountId && merchantName) {
    const searchText = await crmCallTool("crm_search", {
      query: merchantName,
      category: "account",
      limit: 5
    });
    resolvedAccountId =
      searchText.match(/accounts\/(\d+)/i)?.[1] ||
      searchText.match(/\(ID:\s*(\d+)\)/)?.[1] ||
      "";
    if (!merchantName) {
      merchantName = searchText.match(/\[([^\]]+)\]/)?.[1] || merchantName;
    }
    if (!resolvedAccountId) {
      throw new Error(`No CRM account matched “${merchantName}”.`);
    }
  }

  if (!resolvedAccountId) {
    throw new Error("Need a Vault deal URL/ID, meeting URL, or merchant name for CRM lookup.");
  }

  const activities = await crmCallTool("crm_list_activities", {
    account: Number(resolvedAccountId) || resolvedAccountId,
    type: "meetings",
    limit: 25
  });
  const meetings = parseMeetingsFromActivities(activities);
  if (!meetings.length) {
    throw new Error(`CRM account ${resolvedAccountId} has no recent meetings with transcripts.`);
  }

  let lastError = null;
  for (const meeting of meetings.slice(0, 5)) {
    try {
      const raw = await crmCallTool("crm_get_meeting_transcript", {
        meeting: Number(meeting.id) || meeting.id
      });
      const transcript = formatCrmTranscript(raw);
      if (!transcript || transcript.length < 40) continue;
      return {
        transcript,
        source: {
          dealId: sourceDealId,
          dealName,
          merchant: merchantName,
          callDate: meeting.when || "",
          callTitle: meeting.title || `Meeting ${meeting.id}`,
          retrieval: "crm"
        }
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Found CRM meetings but none returned a usable transcript.");
}
