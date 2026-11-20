/**
 * Local Call Rewind demo — search sample deal → populate all cards.
 * No CRM, no AI, no tokens.
 */

const $ = (sel) => document.querySelector(sel);

const SAMPLE_DEAL_ID = "321741-demo";
const THE_BUTTON_URL = "https://the-button.flint.shopify.io/";

const DEMO = {
  source: {
    dealId: SAMPLE_DEAL_ID,
    dealName: "Northstar Ceramics — Plus + B2B",
    merchant: "Northstar Ceramics",
    callDate: "2026-11-19T19:30:00Z",
    callTitle: "Technical discovery — franchise catalogs & company hierarchy",
    retrieval: "demo"
  },
  seNextSteps: [
    "Send Jordan a 1-pager: native B2B company/location limits vs their HQ → region → store model (by Fri EOD).",
    "Book 45-min architecture follow-up with Jordan (Ops), Priya (IT), and AE — goal: confirm whether catalogs + companies cover nesting or need a partner app.",
    "Pull two Plus B2B references with multi-location assortment (ask #b2b-se); share anonymized pattern notes before the follow-up.",
    "Flag Magento B2B catalog inheritance as the comparison frame they keep using — prep a side-by-side for the next call.",
    "Park Scout draft until Priya confirms they already ruled out a custom catalog sync app (they mentioned one vendor quote)."
  ].join("\n"),
  emailSubject: "Next steps from today’s B2B catalog walkthrough — Northstar",
  followUpEmailHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Northstar follow-up</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Helvetica,Arial,sans-serif;color:#1a1f36;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e9f5;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;background:#0b1f4d;color:#fffbed;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;">
              Shopify · Solutions Engineering
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;font-size:16px;line-height:1.55;">
              <p style="margin:0 0 16px;">Hi Jordan,</p>
              <p style="margin:0 0 16px;">Thanks for walking us through Northstar’s franchise catalog model today — especially the HQ → region → store inheritance and store-level assortment locks.</p>
              <p style="margin:0 0 12px;"><strong>What I’ll send by Friday</strong></p>
              <ul style="margin:0 0 16px;padding-left:20px;">
                <li style="margin-bottom:8px;">A short diagram of how Shopify B2B <em>companies</em>, <em>locations</em>, and <em>catalogs</em> map to your three tiers</li>
                <li style="margin-bottom:8px;">Clear callouts on where native catalog inheritance stops short of Magento-style push + lock</li>
              </ul>
              <p style="margin:0 0 16px;"><strong>Ask:</strong> can we book <strong>45 minutes next week</strong> with you and Priya to validate the hierarchy against your ~200 locations and decide whether a partner catalog sync is in or out of scope?</p>
              <p style="margin:0 0 16px;">Happy to work around your kiln-week blackout if needed.</p>
              <p style="margin:0 0 4px;">Thanks,</p>
              <p style="margin:0 0 20px;">Alex<br /><span style="color:#5b6478;font-size:14px;">Solutions Engineer, Shopify</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;background:#f8faff;color:#5b6478;font-size:12px;border-top:1px solid #e4e9f5;">
              Draft from Call Rewind local demo — fictional merchant.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  followUpEmailText: `Hi Jordan,

Thanks for walking us through Northstar’s franchise catalog model today — especially the HQ → region → store inheritance and store-level assortment locks.

What I’ll send by Friday
• A short diagram of how Shopify B2B companies, locations, and catalogs map to your three tiers
• Clear callouts on where native catalog inheritance stops short of Magento-style push + lock

Ask: can we book 45 minutes next week with you and Priya to validate the hierarchy against your ~200 locations and decide whether a partner catalog sync is in or out of scope?

Happy to work around your kiln-week blackout if needed.

Thanks,
Alex
Solutions Engineer, Shopify`,
  nextMeetingPrep: [
    "Goal: Decide if native B2B companies + catalogs cover Northstar’s 3-tier franchise model, or if a partner/custom catalog sync is required for Plus.",
    "Open questions: max nesting depth they need; who edits assortment at region vs store; SKU lock rules; ERP still system of record?",
    "Risk: they equate Magento B2B catalog inheritance with Shopify catalogs — set expectation early.",
    "Demo / bring: admin companies/locations walkthrough; one catalog assigned to two locations; limitation callout slide; partner app shortlist (2 options max).",
    "Attendees: Jordan Lee (Ops champion), Priya Shah (IT), AE; optional ERP analyst if available.",
    "Exit criteria: written yes/no on native fit + next commercial step (architecture deep-dive vs commercial path)."
  ].join("\n"),
  productFeedback:
    "Brief gap: Northstar needs HQ→region→store catalog inheritance with store-level assortment locks. Native B2B companies/locations + catalogs don’t support that nesting without a custom or partner sync — blocking Plus confidence vs Magento B2B.",
  scoutMessage: `@Scout

Want: Franchise HQ can push a master catalog to regions while each store locks a subset of assortment without rebuilding catalogs from scratch
Why: Their 3-tier franchise model needs inheritance plus lock-downs; today's company/location + catalog model forces manual rebuilds or a custom app, which stalls Plus evaluation.
Product: Shopify B2B / Catalogs / Companies
Merchant: Northstar Ceramics, prospect, no shop yet

Merchant-stated context: B2B wholesale + franchise retail, evaluating Plus, ~200 locations across 3 tiers, ERP-owned assortment today
Deal context: Open, Technical discovery, Mid-Market. Competitor named: Magento B2B
Status: At Risk
Workaround checked: Native company locations + catalogs; custom catalog sync app quote — falls short on nested inheritance with store-level locks
Pattern: unknown — single call
Related: not checked
Evidence: 2026-11-19 Technical discovery — franchise catalogs & company hierarchy`
};

let latest = { ...DEMO };

function queryParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      dealId: params.get("dealId")?.trim() || "",
      merchant: params.get("merchant")?.trim() || "",
      auto: params.get("auto") === "1"
    };
  } catch {
    return { dealId: "", merchant: "", auto: false };
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setStatus(message, kind = "") {
  const el = $("#status");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("is-ok", kind === "ok");
  el.classList.toggle("is-error", kind === "error");
}

function showToast(message, kind = "") {
  const toast = $("#toast");
  if (!toast) return;
  toast.hidden = false;
  toast.textContent = message;
  toast.classList.toggle("is-ok", kind === "ok");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.hidden = true;
  }, 2800);
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function theButtonUrlWithDeal(dealId) {
  const url = new URL(THE_BUTTON_URL);
  url.searchParams.set("dealId", dealId || SAMPLE_DEAL_ID);
  return url.toString();
}

function syncCtaLinks(dealId) {
  const href = theButtonUrlWithDeal(dealId);
  document.querySelectorAll(".js-open-button").forEach((el) => {
    el.setAttribute("href", href);
  });
}

function matchesSampleDeal(dealId, merchant) {
  const id = (dealId || "").trim().toLowerCase();
  const name = (merchant || "").trim().toLowerCase();
  const sampleId = SAMPLE_DEAL_ID.toLowerCase();
  const sampleMerchant = DEMO.source.merchant.toLowerCase();

  if (id && (id === sampleId || id === "321741" || id.includes("321741"))) return true;
  if (name && (name.includes("northstar") || sampleMerchant.includes(name))) return true;
  return false;
}

function renderSource(source) {
  const rows = [
    ["Deal ID", source.dealId || "—"],
    ["Deal", source.dealName || "—"],
    ["Merchant", source.merchant || "—"],
    ["Call", source.callTitle || "—"],
    ["When", source.callDate ? new Date(source.callDate).toLocaleString() : "—"],
    ["Retrieved via", source.retrieval || "demo"]
  ];
  $("#sourceMeta").innerHTML = rows
    .map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`)
    .join("");
}

function renderEmail(html, subject) {
  $("#emailSubject").textContent = subject;
  $("#emailPreview").srcdoc = html;
}

function renderCards(data) {
  latest = data;
  $("#outNextSteps").textContent = data.seNextSteps;
  $("#outPrep").textContent = data.nextMeetingPrep;
  $("#outFeedback").textContent = data.productFeedback;
  $("#outScout").textContent = data.scoutMessage;
  renderEmail(data.followUpEmailHtml, data.emailSubject);
  $("#scoutCard").hidden = true;
  $("#scoutSubmitStatus").textContent = "";
  const btn = $("#submitScoutBtn");
  if (btn) {
    btn.classList.remove("is-done");
    btn.textContent = "Submit to Scout";
  }
}

function showResults(visible) {
  $("#sourceCard").hidden = !visible;
  $("#cards").hidden = !visible;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findAndPopulate() {
  const dealId = ($("#dealId")?.value || "").trim();
  const merchant = ($("#merchant")?.value || "").trim();
  const btn = $("#findDealBtn");

  if (!dealId && !merchant) {
    setStatus("Enter the sample deal ID (321741-demo) or merchant Northstar Ceramics.", "error");
    showResults(false);
    return;
  }

  if (!matchesSampleDeal(dealId, merchant)) {
    setStatus(
      `No demo deal for “${dealId || merchant}”. Use ${SAMPLE_DEAL_ID} or Northstar Ceramics.`,
      "error"
    );
    showResults(false);
    return;
  }

  btn.disabled = true;
  btn.textContent = "Finding…";
  setStatus("Looking up demo deal…");
  showResults(false);

  await sleep(450);

  const resolvedId = dealId || SAMPLE_DEAL_ID;
  const data = {
    ...DEMO,
    source: {
      ...DEMO.source,
      dealId: resolvedId.includes("321741") ? SAMPLE_DEAL_ID : resolvedId
    }
  };

  renderSource(data.source);
  renderCards(data);
  syncCtaLinks(data.source.dealId);
  showResults(true);

  const url = new URL(window.location.href);
  url.searchParams.set("dealId", data.source.dealId);
  if (merchant) url.searchParams.set("merchant", merchant);
  else url.searchParams.delete("merchant");
  window.history.replaceState({}, "", url.toString());

  setStatus(`Loaded Northstar Ceramics · deal ${data.source.dealId}`, "ok");
  showToast(`Populated · ${data.source.dealId}`, "ok");
  $("#sourceCard")?.scrollIntoView({ behavior: "smooth", block: "nearest" });

  btn.disabled = false;
  btn.textContent = "Find deal";
}

function clearResults() {
  $("#dealId").value = SAMPLE_DEAL_ID;
  $("#merchant").value = DEMO.source.merchant;
  showResults(false);
  $("#scoutCard").hidden = true;
  setStatus(`Sample deal: ${SAMPLE_DEAL_ID} · merchant: ${DEMO.source.merchant}`);
  syncCtaLinks(SAMPLE_DEAL_ID);
  const url = new URL(window.location.href);
  url.searchParams.set("dealId", SAMPLE_DEAL_ID);
  url.searchParams.set("merchant", DEMO.source.merchant);
  url.searchParams.delete("auto");
  window.history.replaceState({}, "", url.toString());
}

function prefillsFromQuery() {
  const { dealId, merchant } = queryParams();
  $("#dealId").value = dealId || SAMPLE_DEAL_ID;
  $("#merchant").value = merchant || DEMO.source.merchant;
  syncCtaLinks($("#dealId").value || SAMPLE_DEAL_ID);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const key = button.dataset.copy;
    const map = {
      seNextSteps: latest.seNextSteps,
      followUpEmailHtml: latest.followUpEmailHtml,
      followUpEmailText: latest.followUpEmailText,
      nextMeetingPrep: latest.nextMeetingPrep,
      productFeedback: latest.productFeedback,
      scoutMessage: latest.scoutMessage
    };
    const text = map[key] || "";
    try {
      await copyText(text);
      const prev = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = prev;
      }, 1100);
    } catch {
      showToast("Could not copy — select the text manually.");
    }
  });
});

$("#demoForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  findAndPopulate();
});

$("#clearBtn")?.addEventListener("click", () => clearResults());

$("#previewScoutBtn")?.addEventListener("click", () => {
  const card = $("#scoutCard");
  card.hidden = !card.hidden;
  if (!card.hidden) {
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

$("#submitScoutBtn")?.addEventListener("click", async () => {
  const btn = $("#submitScoutBtn");
  const status = $("#scoutSubmitStatus");
  try {
    await copyText(latest.scoutMessage);
    $("#scoutCard").hidden = false;
    btn.classList.add("is-done");
    btn.textContent = "Copied — paste into Scout";
    status.textContent =
      "Demo submit: Scout draft copied. Paste into a Scout DM or tag @Scout in-thread. Call Rewind does not auto-post.";
    status.classList.add("is-ok");
    showToast("Scout draft copied — paste to submit", "ok");
  } catch {
    status.textContent = "Copy failed — use Preview Scout draft, then copy manually.";
    status.classList.add("is-error");
  }
});

// Prefill sample deal; only auto-run with ?auto=1
prefillsFromQuery();
if (queryParams().auto) {
  findAndPopulate();
} else {
  setStatus("Sample deal prefilled — press Find deal to populate.");
}
