# Call Rewind — output schema

Produce these four artifacts. Keep labels identical so the Quick site and skill stay interchangeable.

## 1. SE Next Steps

Plain text suitable for CRM **SE Next Steps** (or Opportunity next-step notes).

- 3–7 short bullets or a tight paragraph
- Owner-implied actions for the SE / AE
- Include dates only when stated on the call
- Start with the single most important next move
- If nothing was committed: `No firm next steps discussed — propose [X] based on open questions.`

## 2. Merchant follow-up

Copy-paste email body only (no subject required unless obvious).

```
Hi [Name],

[1 short context line]

[Answers / recap of what they asked — 2–4 short paragraphs or bullets]

[Clear ask / next step]

Thanks,
```

- Match the call's energy (casual vs formal)
- Public URLs only
- Stop at the sign-off — no auto-signature block
- CC note for SE (internal): mention if AE should CC the SE; do not put internal commentary in the merchant body

## 3. Next-meeting prep

SE-only bullets:

- Goal of the next touch
- Open questions to resolve
- Risks / objections heard
- What to demo or bring
- Who should be in the room

## 4. Product Feedback → Scout

OneList stopped 2026-06-30. **New gaps go to Scout.**

If a Shopify capability gap blocked a merchant need on the call:

1. Fill `productFeedback` with a short SE-facing summary (problem + impact).
2. Fill `scoutMessage` with a **copy-ready Scout post** (the SE posts it — DM Scout or `@Scout` in an internal thread). Never auto-post.
3. Fill `scoutImpactInternal` with PBR / deal $ context for chat only — **not** part of the Scout message.

Scout message format (exact labels):

```text
@Scout

Want: [Outcome the merchant wants — unmet intent, not "Shopify should add X"]
Why: [What breaks today and why it matters now — ≤2 sentences]
Product: [Specific Shopify product area]
Merchant: [Name], shop ID [id] or [store].myshopify.com (or "prospect, no shop yet")

Merchant-stated context: […]
Deal context: [Won / Lost / Open], [stage], [segment]. Competitor if named.
Status: [Blocker / At Risk / Already Lost / Expansion blocked / Unknown]
Workaround checked: […]
Pattern: [counts only if known; else "unknown — single call"]
Related: [existing Scout / GSD / OneList history if known; else "not checked"]
Evidence: [call date/title]; [public Help/dev links if any]
```

If no gap: `productFeedback` = `None — no product gap surfaced.`, `scoutMessage` = `""`, `scoutImpactInternal` = `""`.

When a gap exists, the Cursor skill should also offer to run `product-gap-tracker` for Scout de-dup before the SE posts.

## Shared JSON shape (Quick site)

```json
{
  "source": {
    "dealId": "",
    "dealName": "",
    "merchant": "",
    "callDate": "",
    "callTitle": "",
    "retrieval": "crm|paste|drive|calendar"
  },
  "seNextSteps": "",
  "followUpEmail": "",
  "nextMeetingPrep": "",
  "productFeedback": "None — no product gap surfaced.",
  "scoutMessage": "",
  "scoutImpactInternal": ""
}
```
