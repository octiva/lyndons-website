- [x] Verify project instructions exist.
- [x] Clarify requirements: responsive trade catalogue, quote-only checkout, preview gate, GitHub Pages; no payments.
- [x] Scaffold React + TypeScript + Vite in the workspace root.
- [x] Customize the project and source product content: 14 records, manufacturer caveats, archived catalogue and 12 branches.
- [x] Extensions: none required.
- [x] Compile, lint and run browser tests: 18 desktop/mobile cases passed; production audit clean.
- [x] Create and run preview task on port 4319.
- [x] Launch and review desktop/mobile; independent reviewer and judge pass documented.
- [x] Complete documentation: source provenance, CRM recommendation, integration roadmap and review record.
- [ ] Publish to GitHub Pages and verify the deployed site.

Use Node 22. Product claims need source URLs; never invent stock, prices or manufacturer identities. Keep customer details out of localStorage and the repository. The client-side preview gate is not security. Quote preparation must never imply a request was sent. No payment integrations. Keep customer pricing behind a future authenticated server API.