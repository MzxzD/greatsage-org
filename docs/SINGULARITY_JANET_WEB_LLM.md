# Singularity Protocol — Janet Web LLM

**Decision question:** Should we add a super lightweight in-browser LLM (Janet) to greatsage.org to explain our mission?

**Branch:** `explore/janet-web-llm`  
**Date:** 2026-03-20  
**Protocol:** [PROMPT_TEMPLATE_SINGULARITY.md](../../power-of-less-than-3-will-set-you-free/PROMPT_TEMPLATE_SINGULARITY.md)

---

## Recommendation

**Proceed** — with conditions (see Next steps).

---

## Confidence

**4 / 5**

---

## Rationale (per persona)

### Lynda (Strategy, positioning)

- **Strengthens brand:** "AI on your device" is literally demonstrated on the site. Investors and visitors can try it immediately — no signup, no API key.
- **Differentiator:** Most AI companies show demos that hit their cloud. We show AI running in *your* browser. That's the pitch.
- **Caveat:** If the experience is slow or broken, it could hurt first impression. Must have clear loading state and graceful fallback.

### Janet (UX, ethics, constitutional fit)

- **Perfect alignment:** In-browser = no cloud, no data leaves the device. Constitutional axiom (privacy) is honored by design.
- **"AI on your device"** — the site preaches it; the demo proves it.
- **UX requirements:** Optional entry point (don't force it); clear "loading model" state; fallback for unsupported browsers so no one hits a dead end.

### Darkness (Technical feasibility)

- **WebLLM + SmolLM2-360M:** ~200MB download, WebGPU-accelerated, chat-capable. Model served from Hugging Face / MLC CDN — no self-host needed.
- **Fallback:** If WebGPU unavailable (~30% of users), show static mission summary or "Try a modern browser (Chrome, Edge, Safari)" — no broken experience.
- **Alternatives considered:** transformers.js + GPT-2 (smaller but weaker for chat); Llama-3.2-1B (better quality, ~600MB — consider for v2).

### Lumina (UI/UX, accessibility)

- **Placement:** Floating "Ask Janet" button bottom-right; doesn't obscure hero or nav.
- **Chat panel:** Modal/drawer; matches purple/lavender theme; dark mode support via existing `data-theme`.
- **Accessibility:** Keyboard (Escape to close, Tab navigation); focus trap; `aria-label` for screen readers; `prefers-reduced-motion` respected.

### Blaze (Marketing)

- **Demo value:** "Try it now" — instant gratification. No friction.
- **First impression:** "They eat their own dog food." Credibility boost.
- **CTA:** "Ask Janet" — friendly, on-brand, invites interaction.

### Sentinel (Risk, compliance)

- **Privacy:** 100% client-side inference. No data sent to our servers or third parties. Compliant with privacy-first positioning.
- **Bandwidth:** ~200MB first load — disclose in UI ("Downloading model… ~200MB, one-time").
- **Browser support:** WebGPU ~70% globally. Fallback required; no silent failure.

### Archivist (Documentation)

- **Location:** This document in `greatsage-web/docs/`. Add entry to `GREAT_SAGE_WEB_PLAN.md` when feature ships.
- **Track:** Experiment status, model choice, fallback behavior — all in this doc or linked README.

### Lily (Cost)

- **No API cost:** Inference is client-side. No per-request charges.
- **Model hosting:** Served from Hugging Face / MLC CDN. No hosting cost for The Great Sage.
- **Bandwidth:** User's connection; not our infra.

---

## Dissent

**None.** All personas support proceeding, with the conditions below.

---

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Static FAQ** | Zero complexity, instant load | No "AI on your device" demo; less memorable |
| **Rule-based chatbot** | Lightweight, no model download | Feels scripted; doesn't demonstrate real AI |
| **Link to heyjanet.bot** | Full Janet, already exists | Requires connection; contradicts "offline" message |
| **Defer** | No risk now | Misses opportunity to differentiate; competitors may do similar |

---

## Next steps (if approved)

1. **Prototype scope:**
   - "Ask Janet" floating button (bottom-right)
   - Chat panel (modal) with input + response area
   - WebLLM + SmolLM2-360M; system prompt: mission-focused Janet persona
   - Loading state: "Downloading model… ~200MB, one-time. Runs 100% in your browser."
   - Fallback: If WebGPU unavailable → show static mission summary + "Try Chrome, Edge, or Safari for the full experience."

2. **Files to create/modify:**
   - `index.html` — button, panel markup
   - `js/janet-web-llm.js` — WebLLM init, chat logic
   - `css/janet-chat.css` — panel styling
   - `i18n/*.json` — new keys: `janet.ask`, `janet.loading`, `janet.fallback`, etc.

3. **System prompt (draft):**
   > You are Janet, The Great Sage's AI companion. Explain our mission: privacy-first, voice-first AI that runs on your devices. No cloud. No subscription. Constitutional AI, open source. J.A.N.E.T. Glasses. Keep answers concise and friendly. If asked about something outside our mission, gently steer back.

4. **Update docs:** Add to `GREAT_SAGE_WEB_PLAN.md` when merged.

---

## Human verification

- [x] **Approved** — proceed to Phase 5 (exploration implementation)
- [ ] **Rejected** — close branch, document rationale
- [ ] **Revise** — iterate on this document, re-verify

---

*Power of <3. All personas. One decision. Human verifies.*
