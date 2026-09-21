- [x] Verify project instructions exist.
- [x] Clarify requirements: responsive trade catalogue, quote-only checkout, preview gate, GitHub Pages; no payments.
- [x] Scaffold React + TypeScript + Vite in the workspace root.
- [x] Expand catalogue: 2,061 public pages / 3,853 variants, 2,063 downloaded photos, 28 verified brand-level supplier resources; missing manufacturer/details explicitly flagged.
- [x] Download PDFs: Lyndons November 2022 (4-page expired offers flyer, NOT full-range catalogue), 20-page capability statement, Flextool v33 supplier catalogue. No complete current Lyndons PDF verified.
- [x] Extensions: none required.
- [x] Compile, lint and run browser tests: 22 desktop/mobile cases plus 3 extractor tests passed after catalogue expansion; production audit clean.
- [x] Create and run preview task on port 4319.
- [x] Launch and review desktop/mobile; independent reviewer and judge pass documented.
- [x] Complete documentation: source provenance, CRM recommendation, integration roadmap and review record.
- [x] Publish expanded catalogue to https://octiva.github.io/lyndons-website/; workflow 35596388696 succeeded. Live 3,853 result count, pagination/category controls, CSV/PDF downloads and local product photo verified. No test email sent.

Use Node 22. Product claims need source URLs; never invent stock, prices or manufacturer identities. Keep customer details out of localStorage and the repository. The client-side preview gate is not security. Quote preparation must never imply a request was sent. No payment integrations. Keep customer pricing behind a future authenticated server API.