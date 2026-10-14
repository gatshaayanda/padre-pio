# Padre Pio Medical Centre — Digital Reception

Mobile-first patient-facing website and installable PWA for Padre Pio Medical Centre, Plot 16739, Gaborone West Phase 1, Gaborone, Botswana.

## Product outcome

Help visitors recognise the clinic, find verified information, request an appointment, and understand what happens next. Reception staff need a secure queue to review requests and communicate accurate status updates.

## Non-negotiable boundaries

- A submitted appointment request is not a confirmed appointment.
- Do not invent opening hours, services, practitioner credentials, prices, medical-aid acceptance, or contact channels. Verify them with the clinic before publishing.
- Do not collect detailed medical history or use this application as an EMR, diagnostic tool, prescription system, or AI doctor.
- Keep patient information private. Admin access must be enforced by server and database authorization, not just hidden links.
- Use a dedicated Firebase project and independent credentials. Never reuse The Plug's backend, customer data, or secrets.
- The entrance video at `public/videos/padre.mp4` is a recognisable location cue, not a substitute for accessible text or a still fallback.
- Installation is optional; the website must remain usable without installing the PWA.

## Architecture

Next.js App Router, React, TypeScript, Tailwind CSS, and Firebase SDKs inherited from the mandatory The Plug foundation. The application identity has been reset; clinic-specific workflows and isolated infrastructure remain to be implemented and verified.

## Verification status

No local dependency install, typecheck, lint, production build, Firebase rules test, browser/device test, or deployment test is claimed by this repository note. See `AGENTS.md` and the clone-reset checklist for the evidence ledger and required gates.

## Development

```bash
npm ci
npm run dev
```

Do not connect Firebase, deploy rules, configure production hosting, or deploy the app until the dedicated project and target environment have been explicitly verified.
