# RAA Compliance Triage Bot

Internal pre-production compliance check for UX and content teams.

Live: https://asmithdigital.github.io/compliance-triage-bot/

## What it does

Checks UX copy, screen flows, emails, forms, and promotions against:

- Australian Consumer Law (ACL)
- Privacy Act 1988 (Cth)
- Spam Act 2003 (Cth)
- ASIC RG 234
- General Insurance Code of Practice (GICOP)
- AANA Code of Ethics
- WCAG 2.1 AA
- ACCC dark patterns guidance

## Usage

1. Fill in the content details form
2. Optionally add an Anthropic API key to run a live AI analysis (key is never stored)
3. Click **Run triage** — or click **Load example** to see a demo report

Without an API key, a detailed pre-built demo report is shown using the example quote flow.

## Setup

```bash
npm install
npm run dev        # local dev server
npm run build      # production build
npm run deploy     # deploy to GitHub Pages
```

## Disclaimer

Not legal advice. Final approval requires sign-off by an admitted Australian legal practitioner.
