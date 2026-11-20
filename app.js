import OpenAI from "./vendor/openai.esm.js";
import { lookupCrmTranscript } from "./crm.js";
import {
  completeCrmConnectIfPresent,
  hasCrmAccessToken,
  clearCrmAuth,
  saveAndVerifyCrmToken,
  openVaultTokenPage,
  isHttpsPage,
  localPreviewUrl,
  checkLocalCrmProxy
} from "./crm-auth.js";

const $ = (sel) => document.querySelector(sel);
const dealIdInput = $("#dealId");
const merchantInput = $("#merchant");
const transcriptInput = $("#transcript");
const statusEl = $("#status");
const form = $("#rewindForm");
const runBtn = $("#runBtn");
const lookupBtn = $("#lookupBtn");
const clearBtn = $("#clearBtn");
const connectCrmBtn = $("#connectCrmBtn");
const crmStatus = $("#crmStatus");
const connectPanel = $("#connectPanel");
const crmTokenInput = $("#crmTokenInput");
const saveCrmTokenBtn = $("#saveCrmTokenBtn");
const cancelConnectBtn = $("#cancelConnectBtn");
const disconnectCrmBtn = $("#disconnectCrmBtn");
const openVaultTokenBtn = $("#openVaultTokenBtn");
const connectStatus = $("#connectStatus");
const cards = $("#cards");
const sourceCard = $("#sourceCard");
const sourceMeta = $("#sourceMeta");
const scoutCard = $("#scoutCard");
const scoutImpactCard = $("#scoutImpactCard");
const accessBanner = $("#accessBanner");
const matchList = $("#matchList");

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const CAL_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const NONE_FEEDBACK = "None — no product gap surfaced.";

let latest = null;
let me = null;
let googleToken = null;

const openai = new OpenAI({
  baseURL: "/api/ai",
  apiKey: "not-needed",
  dangerouslyAllowBrowser: true
});

function setStatus(message, kind = "") {
  statusEl.textContent = message;
  statusEl.classList.toggle("is-error", kind === "error");
  statusEl.classList.toggle("is-ok", kind === "ok");
}

function showAccessBanner(show) {
  if (!accessBanner) return;
  accessBanner.hidden = !show;
  if (!show) {
    accessBanner.textContent =
      "CRM needs Connect CRM once. Then retry — or use Drive/paste fallback.";
  }
}

function setConnectStatus(message, kind = "") {
  if (!connectStatus) return;
  connectStatus.textContent = message || "";
  connectStatus.classList.toggle("is-error", kind === "error");
  connectStatus.classList.toggle("is-ok", kind === "ok");
}

async function showConnectPanel(show) {
  if (!connectPanel) return;
  connectPanel.hidden = !show;
  if (disconnectCrmBtn) disconnectCrmBtn.hidden = !hasCrmAccessToken();
  const httpsWarn = $("#httpsCrmWarn");
  if (httpsWarn) {
    httpsWarn.hidden = !isHttpsPage();
  }
  if (show && isHttpsPage()) {
    setConnectStatus(
      `Switch to local preview for CRM: ${localPreviewUrl()}`,
      "error"
    );
  } else if (show) {
    const up = await checkLocalCrmProxy();
    setConnectStatus(
      up
        ? "Local CRM proxy is up — paste your Vault token and Save & verify."
        : "Start proxy: node scripts/crm-proxy.mjs (WARP on)",
      up ? "ok" : "error"
    );
  }
  if (show && crmTokenInput && !isHttpsPage()) {
    crmTokenInput.value = "";
    crmTokenInput.focus();
  }
}

function refreshCrmStatus() {
  if (!crmStatus || !connectCrmBtn) return;
  const ready = hasCrmAccessToken();
  crmStatus.hidden = !ready;
  crmStatus.textContent = ready ? "CRM connected" : "";
  crmStatus.classList.toggle("is-ready", ready);
  connectCrmBtn.textContent = ready ? "CRM settings" : "Connect CRM";
  if (disconnectCrmBtn) disconnectCrmBtn.hidden = !ready;
}

function clearMatchList() {
  if (!matchList) return;
  matchList.hidden = true;
  matchList.innerHTML = "";
}

function setBusy(busy) {
  runBtn.disabled = busy;
  lookupBtn.disabled = busy;
  runBtn.textContent = busy ? "Working…" : "Rewind call";
}

async function bootIdentity() {
  try {
    const user = await window.quick?.id?.waitForUser?.();
    me = user || null;
    $("#whoAmI").textContent = user
      ? `${user.fullName || user.name || "SE"} · ${user.email || ""}`
      : "Local preview";
  } catch {
    $("#whoAmI").textContent = "Identity unavailable";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeDriveQuery(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function hasScoutGap(data) {
  const feedback = (data?.productFeedback || "").trim();
  const scout = (data?.scoutMessage || "").trim();
  if (!scout) return false;
  if (!feedback || feedback === NONE_FEEDBACK) return false;
  return true;
}

function slugToName(slug) {
  return String(slug || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pull deal id + merchant hints from a Vault CRM deal/account URL (or bare id). */
function parseVaultOrDealInput(raw) {
  const value = String(raw || "").trim();
  if (!value) return { dealId: "", merchantHints: [] };

  const dealMatch = value.match(
    /vault\.shopify\.io\/crm\/accounts\/(\d+)(?:-[^/?#]+)?\/deals\/(\d+)(?:-([^/?#]+))?/i
  );
  if (dealMatch) {
    const accountSlug = value.match(/accounts\/\d+-([^/?#]+)/i)?.[1] || "";
    const dealSlug = dealMatch[3] || "";
    return {
      dealId: dealMatch[2],
      accountId: dealMatch[1],
      merchantHints: [
        slugToName(accountSlug),
        slugToName(dealSlug).replace(/\b(retail|payments|pos|plus|b2b|shopify)\b/gi, " ").replace(/\s+/g, " ").trim()
      ].filter(Boolean)
    };
  }

  const accountMatch = value.match(/vault\.shopify\.io\/crm\/accounts\/(\d+)(?:-([^/?#]+))?/i);
  if (accountMatch) {
    return {
      dealId: "",
      accountId: accountMatch[1],
      merchantHints: [slugToName(accountMatch[2] || "")].filter(Boolean)
    };
  }

  const meetingMatch = value.match(/vault\.shopify\.io\/crm\/meetings\/(\d+)/i);
  if (meetingMatch) {
    return { dealId: "", accountId: "", merchantHints: [], meetingId: meetingMatch[1] };
  }

  if (/^\d+$/.test(value) || /^006[a-z0-9]+$/i.test(value)) {
    return { dealId: value, accountId: "", merchantHints: [] };
  }

  return { dealId: value, accountId: "", merchantHints: [] };
}

function applyVaultParseToForm() {
  const parsed = parseVaultOrDealInput(dealIdInput.value);
  if (parsed.dealId && parsed.dealId !== dealIdInput.value.trim()) {
    dealIdInput.value = parsed.dealId;
  }
  if (!merchantInput.value.trim() && parsed.merchantHints?.[0]) {
    merchantInput.value = parsed.merchantHints[0];
  }
  return parsed;
}

function searchTerms() {
  const parsed = applyVaultParseToForm();
  const merchant = merchantInput.value.trim();
  const dealId = (parsed.dealId || dealIdInput.value.trim()).replace(/^.*\/deals\/(\d+).*$/i, "$1");
  const terms = [];

  const pushTerm = (term) => {
    const t = String(term || "").trim();
    if (!t) return;
    terms.push(t);
    const stripped = t
      .replace(/\.(myshopify\.com|com|io|co)$/i, "")
      .replace(/\b(inc|llc|ltd|corp|corporation)\b/gi, "")
      .replace(/[^a-z0-9\s&'-]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (stripped && stripped.toLowerCase() !== t.toLowerCase()) terms.push(stripped);
    const parts = stripped.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) terms.push(parts.slice(0, 2).join(" "));
  };

  pushTerm(merchant);
  for (const hint of parsed.merchantHints || []) pushTerm(hint);

  return {
    merchant: merchant || parsed.merchantHints?.[0] || "",
    dealId,
    accountId: parsed.accountId || "",
    meetingId: parsed.meetingId || "",
    terms: [...new Set(terms.filter(Boolean))]
  };
}

async function lookupFromCrm() {
  const { merchant, dealId, accountId, meetingId } = searchTerms();
  if (!dealId && !accountId && !meetingId && !merchant) {
    throw new Error("Paste a Vault deal URL, deal ID, meeting URL, or merchant name for CRM lookup.");
  }
  const who = me?.email || me?.fullName || "you";
  setStatus(`Looking up CRM transcript as ${who}…`);
  return lookupCrmTranscript({ dealId, accountId, meetingId, merchant });
}

async function ensureGoogle(scopes = [DRIVE_SCOPE, CAL_SCOPE]) {
  if (!window.quick?.auth?.getToken) {
    throw new Error("Quick Google auth is unavailable in this preview. Paste a transcript instead.");
  }
  if (!window.quick?.http?.get) {
    throw new Error("Quick HTTP client is unavailable. Paste a transcript instead.");
  }
  googleToken = await window.quick.auth.getToken(scopes);
  if (!googleToken?.access_token) {
    throw new Error("Google authorization failed. Allow Drive + Calendar, or paste a transcript.");
  }
  return googleToken;
}

async function googleGet(url, { as = "json" } = {}) {
  const token = await ensureGoogle();
  const response = await window.quick.http.get(url, {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const err = new Error(
      response.status === 401 || response.status === 403
        ? "Google Drive/Calendar access was denied. Re-authorize when prompted, or paste a transcript."
        : `Google API error (${response.status}). ${body.slice(0, 180)}`
    );
    if (response.status === 401 || response.status === 403) err.code = "ACCESS_DENIED";
    throw err;
  }
  return as === "text" ? response.text() : response.json();
}

function scoreDriveFile(file, terms) {
  const name = (file.name || "").toLowerCase();
  let score = 0;
  if (/transcript/.test(name)) score += 8;
  if (/meeting notes|notes from|gemini notes|meet notes/.test(name)) score += 6;
  if (/discovery|demo|technical|scoping/.test(name)) score += 2;
  for (const term of terms) {
    if (name.includes(term.toLowerCase())) score += 4;
  }
  const modified = Date.parse(file.modifiedTime || "") || 0;
  score += Math.min(3, Math.floor(modified / 1e12)); // mild recency nudge
  return score;
}

async function searchDriveDocs(terms) {
  const files = [];
  const seen = new Set();

  for (const term of terms) {
    const q = [
      `mimeType = 'application/vnd.google-apps.document'`,
      `trashed = false`,
      `(name contains '${escapeDriveQuery(term)}' or fullText contains '${escapeDriveQuery(term)}')`
    ].join(" and ");

    const data = await googleGet(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}` +
        `&pageSize=15&fields=files(id,name,mimeType,modifiedTime,webViewLink)` +
        `&orderBy=modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`
    );

    for (const file of data.files || []) {
      if (seen.has(file.id)) continue;
      seen.add(file.id);
      files.push(file);
    }
  }

  return files
    .map((file) => ({ ...file, _score: scoreDriveFile(file, terms) }))
    .sort((a, b) => b._score - a._score || String(b.modifiedTime).localeCompare(String(a.modifiedTime)));
}

async function exportDriveDoc(fileId) {
  const text = await googleGet(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`,
    { as: "text" }
  );
  return String(text || "").trim();
}

async function searchCalendarEvents(terms) {
  const timeMax = new Date();
  const timeMin = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const seen = new Set();
  const events = [];
  const lowerTerms = terms.map((t) => t.toLowerCase());

  for (const term of terms.slice(0, 3)) {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: "40",
      singleEvents: "true",
      orderBy: "startTime",
      q: term
    });

    const data = await googleGet(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`
    );

    for (const event of data.items || []) {
      if (!event.id || seen.has(event.id)) continue;
      const blob = `${event.summary || ""} ${event.description || ""}`.toLowerCase();
      if (!lowerTerms.some((t) => blob.includes(t))) continue;
      seen.add(event.id);
      events.push(event);
    }
  }

  // Newest first
  return events.sort((a, b) => {
    const aStart = Date.parse(a.start?.dateTime || a.start?.date || 0);
    const bStart = Date.parse(b.start?.dateTime || b.start?.date || 0);
    return bStart - aStart;
  });
}

async function lookupFromWorkspace() {
  const { merchant, dealId, terms } = searchTerms();
  if (!terms.length) {
    throw new Error(
      "Enter a merchant name for Drive/Calendar fallback, or use CRM with a Vault deal URL."
    );
  }

  setStatus(`Searching Drive for Meet notes / transcripts matching “${terms[0]}”…`);
  await ensureGoogle([DRIVE_SCOPE, CAL_SCOPE]);

  let files = [];
  try {
    files = await searchDriveDocs(terms);
  } catch (error) {
    if (error.code === "ACCESS_DENIED") throw error;
    console.warn("Drive search failed", error);
  }

  if (files.length) {
    const top = files.slice(0, 5);
    renderMatchChoices(top, "drive");
    const chosen = top[0];
    setStatus(`Loading “${chosen.name}” from Drive…`);
    const transcript = await exportDriveDoc(chosen.id);
    if (!transcript) {
      throw new Error(`Found “${chosen.name}” but it exported empty. Open it in Drive or paste the transcript.`);
    }
    return {
      transcript,
      source: {
        dealId,
        dealName: "",
        merchant: merchant || terms[0],
        callDate: chosen.modifiedTime || "",
        callTitle: chosen.name || "",
        retrieval: "drive"
      }
    };
  }

  setStatus(`No Drive doc yet — checking Calendar for “${terms[0]}”…`);
  let events = [];
  try {
    events = await searchCalendarEvents(terms);
  } catch (error) {
    if (error.code === "ACCESS_DENIED") throw error;
    console.warn("Calendar search failed", error);
  }

  if (events.length) {
    const event = events[0];
    const title = event.summary || "Calendar meeting";
    const when = event.start?.dateTime || event.start?.date || "";
    // Second Drive pass using the calendar title
    const titled = await searchDriveDocs([title, ...terms].filter(Boolean));
    if (titled.length) {
      renderMatchChoices(titled.slice(0, 5), "calendar→drive");
      const chosen = titled[0];
      const transcript = await exportDriveDoc(chosen.id);
      if (transcript) {
        return {
          transcript,
          source: {
            dealId,
            dealName: "",
            merchant: merchant || terms[0],
            callDate: when,
            callTitle: chosen.name || title,
            retrieval: "calendar"
          }
        };
      }
    }

    throw new Error(
      `Found calendar event “${title}” (${when || "recent"}) but no linked Meet notes doc in Drive. Open the event’s notes, paste the transcript, or wait for Gemini/Meet notes to sync.`
    );
  }

  throw new Error(
    `No Drive Meet-notes doc matched “${terms[0]}”. Prefer CRM lookup (deal URL + Vault token), or paste the transcript.`
  );
}

function renderMatchChoices(files, via) {
  if (!matchList || !files.length) return;
  matchList.hidden = false;
  matchList.innerHTML = `
    <h3>Candidates (${escapeHtml(via)})</h3>
    <ul>
      ${files
        .map(
          (f, i) => `<li data-file-id="${escapeHtml(f.id)}" class="${i === 0 ? "is-selected" : ""}">
            <strong>${escapeHtml(f.name)}</strong>
            <span>${escapeHtml((f.modifiedTime || "").slice(0, 10) || "—")}</span>
          </li>`
        )
        .join("")}
    </ul>
    <p class="match-hint">Using the top match. Click another row to load it instead, then Rewind.</p>
  `;

  matchList.querySelectorAll("li[data-file-id]").forEach((li) => {
    li.addEventListener("click", async () => {
      const fileId = li.getAttribute("data-file-id");
      const name = li.querySelector("strong")?.textContent || "Drive doc";
      matchList.querySelectorAll("li").forEach((el) => el.classList.remove("is-selected"));
      li.classList.add("is-selected");
      setBusy(true);
      showAccessBanner(false);
      try {
        setStatus(`Loading “${name}”…`);
        const transcript = await exportDriveDoc(fileId);
        if (!transcript) throw new Error("That doc exported empty — try another or paste.");
        transcriptInput.value = transcript;
        renderSource({
          dealId: dealIdInput.value.trim(),
          dealName: "",
          merchant: merchantInput.value.trim(),
          callDate: "",
          callTitle: name,
          retrieval: "drive"
        });
        setStatus("Transcript loaded. Click Rewind call to generate artifacts.", "ok");
      } catch (error) {
        handleRunError(error);
      } finally {
        setBusy(false);
      }
    });
  });
}

function systemPrompt() {
  return `You are Call Rewind, an SE post-call closeout assistant for Shopify Solutions Engineers.
Return ONLY valid JSON with this shape:
{
  "source": { "dealId": "", "dealName": "", "merchant": "", "callDate": "", "callTitle": "", "retrieval": "crm|paste|drive|calendar" },
  "seNextSteps": "",
  "followUpEmail": "",
  "nextMeetingPrep": "",
  "productFeedback": "None — no product gap surfaced.",
  "scoutMessage": "",
  "scoutImpactInternal": ""
}
Rules:
- Draft only. Do not invent attendees or commitments.
- SE Next Steps: CRM-ready, 3-7 bullets or a tight paragraph; say explicitly if no next steps were discussed.
- Merchant follow-up: copy-paste email body, public links only, stop at sign-off.
- Next-meeting prep: SE-only bullets (goal, open questions, risks, demo, attendees).
- Product gaps go to Scout (OneList stopped 2026-06-30). Never draft OneList / CRM Product_Feedback__c entries.
- If a real Shopify platform capability gap blocked a merchant need on the call:
  - productFeedback: short SE-facing summary (problem + impact).
  - scoutMessage: copy-ready Scout post starting with "@Scout" then blank line, then exact labels:
    Want / Why / Product / Merchant / Merchant-stated context / Deal context / Status / Workaround checked / Pattern / Related / Evidence
  - Want = unmet merchant intent (not "Shopify should add X"). Why ≤ 2 sentences. Product = specific Shopify product area.
  - Merchant: include shop ID or myshopify.com when known; else "prospect, no shop yet".
  - Pattern: counts only if known; else "unknown — single call". Related: "not checked" if unknown.
  - scoutImpactInternal: PBR / deal $ / CRM link for chat only. NEVER put dollar figures or other merchants in scoutMessage.
- If no gap: productFeedback exactly "${NONE_FEEDBACK}", scoutMessage "", scoutImpactInternal "".
- Preserve any provided dealId/merchant/call metadata in source.`;
}

async function generateArtifacts({ transcript, source }) {
  const userPayload = {
    dealId: source.dealId || dealIdInput.value.trim(),
    merchant: source.merchant || merchantInput.value.trim(),
    callDate: source.callDate || "",
    callTitle: source.callTitle || "",
    retrieval: source.retrieval || "paste",
    transcript
  };

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt() },
      {
        role: "user",
        content: `Create Call Rewind artifacts from this call context.\n\n${JSON.stringify(userPayload)}`
      }
    ]
  });

  const raw = response.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Model returned non-JSON output. Try again.");
  }

  const productFeedback = parsed.productFeedback || NONE_FEEDBACK;
  const scoutMessage = (parsed.scoutMessage || "").trim();
  const scoutImpactInternal = (parsed.scoutImpactInternal || "").trim();
  const gap =
    productFeedback !== NONE_FEEDBACK &&
    scoutMessage.length > 0;

  return {
    source: {
      dealId: parsed.source?.dealId || userPayload.dealId,
      dealName: parsed.source?.dealName || "",
      merchant: parsed.source?.merchant || userPayload.merchant,
      callDate: parsed.source?.callDate || userPayload.callDate,
      callTitle: parsed.source?.callTitle || userPayload.callTitle,
      retrieval: parsed.source?.retrieval || userPayload.retrieval
    },
    seNextSteps: parsed.seNextSteps || "",
    followUpEmail: parsed.followUpEmail || "",
    nextMeetingPrep: parsed.nextMeetingPrep || "",
    productFeedback,
    scoutMessage: gap ? scoutMessage : "",
    scoutImpactInternal: gap ? scoutImpactInternal : ""
  };
}

function renderSource(source) {
  const rows = [
    ["Deal ID", source.dealId || "—"],
    ["Deal", source.dealName || "—"],
    ["Merchant", source.merchant || "—"],
    ["Call", source.callTitle || "—"],
    ["When", source.callDate || "—"],
    ["Retrieved via", source.retrieval || "—"]
  ];
  sourceMeta.innerHTML = rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join("");
  sourceCard.hidden = false;
}

function renderCards(data) {
  $("#outNextSteps").textContent = data.seNextSteps || "";
  $("#outFollowUp").textContent = data.followUpEmail || "";
  $("#outPrep").textContent = data.nextMeetingPrep || "";
  $("#outFeedback").textContent = data.productFeedback || "";

  const gap = hasScoutGap(data);
  scoutCard.hidden = !gap;
  scoutImpactCard.hidden = !(gap && (data.scoutImpactInternal || "").trim());
  $("#outScout").textContent = gap ? data.scoutMessage : "";
  $("#outScoutImpact").textContent = gap ? (data.scoutImpactInternal || "") : "";

  cards.hidden = false;
  latest = data;
}

async function resolveTranscript({ requireTranscript = true } = {}) {
  const pasted = transcriptInput.value.trim();
  const { merchant, dealId, accountId, meetingId, terms } = searchTerms();

  if (pasted) {
    clearMatchList();
    return {
      transcript: pasted,
      source: {
        dealId,
        dealName: "",
        merchant,
        callDate: "",
        callTitle: "",
        retrieval: "paste"
      }
    };
  }

  // 1) CRM first whenever we have a deal / account / meeting / merchant
  if (dealId || accountId || meetingId || merchant) {
    try {
      const found = await lookupFromCrm();
      transcriptInput.value = found.transcript;
      clearMatchList();
      return found;
    } catch (error) {
      // Auth errors should surface (need token). Other CRM misses fall through to Drive.
      if (error.code === "CRM_AUTH") throw error;
      console.warn("CRM lookup failed, trying Drive/Calendar", error);
      setStatus(`${error.message} — trying Drive/Calendar…`);
    }
  }

  if (terms.length) {
    const found = await lookupFromWorkspace();
    transcriptInput.value = found.transcript;
    return found;
  }

  if (requireTranscript) {
    throw new Error("Paste a Vault deal URL (CRM), a merchant name, or a transcript.");
  }
  throw new Error("Paste a Vault deal URL or merchant name to look up.");
}

function handleRunError(error) {
  console.error(error);
  const accessDenied =
    error?.code === "ACCESS_DENIED" ||
    error?.code === "CRM_AUTH" ||
    error?.code === "CRM_PROXY" ||
    /Google Drive\/Calendar access was denied|re-authorize|authorization failed|Connect CRM|CRM auth|CRM session|crm-proxy|WARP/i.test(
      error?.message || String(error)
    );
  showAccessBanner(accessDenied);
  if (accessBanner && (error?.code === "CRM_AUTH" || error?.code === "CRM_PROXY")) {
    accessBanner.innerHTML =
      error?.code === "CRM_PROXY"
        ? `Vault CRM needs <strong>Cloudflare WARP</strong> + local proxy. In Terminal run <code>node scripts/crm-proxy.mjs</code>, keep it open, then Connect CRM again.`
        : `Click <strong>Connect CRM</strong>. The UUID on the Vault api_token page <em>is</em> your token — paste it after starting <code>node scripts/crm-proxy.mjs</code> (WARP on).`;
    showConnectPanel(true);
  }
  setStatus(error.message || String(error), "error");
}

async function onSaveCrmToken() {
  setConnectStatus("Verifying with CRM…");
  saveCrmTokenBtn.disabled = true;
  try {
    await saveAndVerifyCrmToken(crmTokenInput?.value || "");
    if (crmTokenInput) crmTokenInput.value = "";
    refreshCrmStatus();
    showConnectPanel(false);
    showAccessBanner(false);
    setConnectStatus("");
    setStatus("CRM connected. Paste a Vault deal URL and Find in CRM.", "ok");
  } catch (error) {
    setConnectStatus(error.message || String(error), "error");
  } finally {
    saveCrmTokenBtn.disabled = false;
  }
}

async function runRewind() {
  setBusy(true);
  showAccessBanner(false);
  try {
    const resolved = await resolveTranscript({ requireTranscript: true });
    setStatus("Drafting closeout artifacts…");
    const artifacts = await generateArtifacts(resolved);
    renderSource(artifacts.source);
    renderCards(artifacts);
    const scoutNote = hasScoutGap(artifacts)
      ? " Scout draft ready — copy and post yourself (DM Scout or @Scout)."
      : "";
    setStatus(`Ready — copy into CRM / email.${scoutNote}`, "ok");
  } catch (error) {
    handleRunError(error);
  } finally {
    setBusy(false);
  }
}

async function runLookupOnly() {
  setBusy(true);
  showAccessBanner(false);
  try {
    const resolved = await resolveTranscript({ requireTranscript: false });
    renderSource(resolved.source);
    cards.hidden = true;
    scoutCard.hidden = true;
    scoutImpactCard.hidden = true;
    setStatus("Transcript loaded into the box. Click Rewind call to generate artifacts.", "ok");
  } catch (error) {
    handleRunError(error);
  } finally {
    setBusy(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runRewind();
});

lookupBtn.addEventListener("click", () => runLookupOnly());

connectCrmBtn?.addEventListener("click", () => {
  showAccessBanner(false);
  const open = Boolean(connectPanel?.hidden);
  showConnectPanel(open);
  if (open) setStatus("Connect CRM with your Vault API token (browser-only).");
});

openVaultTokenBtn?.addEventListener("click", () => openVaultTokenPage());
saveCrmTokenBtn?.addEventListener("click", () => onSaveCrmToken());
cancelConnectBtn?.addEventListener("click", () => {
  showConnectPanel(false);
  setConnectStatus("");
});
disconnectCrmBtn?.addEventListener("click", () => {
  clearCrmAuth();
  refreshCrmStatus();
  showConnectPanel(false);
  setStatus("CRM disconnected in this browser.");
});
crmTokenInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    onSaveCrmToken();
  }
});

clearBtn.addEventListener("click", () => {
  form.reset();
  cards.hidden = true;
  sourceCard.hidden = true;
  scoutCard.hidden = true;
  scoutImpactCard.hidden = true;
  showAccessBanner(false);
  clearMatchList();
  latest = null;
  setStatus("Paste a Vault deal URL, then Find in CRM — or paste a transcript.");
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!latest) return;
    const key = button.dataset.copy;
    const text = latest[key] || "";
    try {
      await navigator.clipboard.writeText(text);
      const prev = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = prev; }, 1200);
    } catch {
      setStatus("Could not copy — select the text manually.", "error");
    }
  });
});

const DEMO_DEAL_ID = "321741-demo";
const DEMO_MERCHANT = "Northstar Ceramics";
const THE_BUTTON_URL = "https://the-button.flint.shopify.io/";

function applyQueryToForm() {
  const params = new URLSearchParams(window.location.search);
  const dealId = params.get("dealId")?.trim();
  const merchant = params.get("merchant")?.trim();
  if (dealId && dealIdInput) dealIdInput.value = dealId;
  if (merchant && merchantInput) merchantInput.value = merchant;
  return { dealId, merchant };
}

function theButtonUrl() {
  const dealId = dealIdInput?.value?.trim() || DEMO_DEAL_ID;
  const url = new URL(THE_BUTTON_URL);
  url.searchParams.set("dealId", dealId);
  return url.toString();
}

function wireDemoCtas() {
  document.querySelectorAll(".js-open-demo").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      window.open(theButtonUrl(), "_blank", "noopener,noreferrer");
    });
  });
}

(async function boot() {
  const fromQuery = applyQueryToForm();
  wireDemoCtas();
  refreshCrmStatus();
  await bootIdentity();
  try {
    await completeCrmConnectIfPresent();
  } catch (error) {
    handleRunError(error);
  }
  if (fromQuery.dealId) {
    setStatus(`Deal ID loaded (${fromQuery.dealId}). Connect CRM or paste a transcript, then Rewind.`, "ok");
  } else if (!hasCrmAccessToken()) {
    setStatus("Connect CRM once, then paste a Vault deal URL — or paste a transcript.");
  }
})();
