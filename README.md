# ScamMirror AI

A responsive hackathon prototype for first-encounter scam screening and community pattern reporting.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm start
```

Open http://localhost:3000. No npm dependencies are required.

## Optional Gemini integration

1. Copy `.env.example` to `.env` and add your Gemini API key.
2. Start with environment variables set. For example, on macOS/Linux:

```bash
export GEMINI_API_KEY="your-key"
export GEMINI_MODEL="gemini-2.5-flash"
npm start
```

On Windows PowerShell:

```powershell
$env:GEMINI_API_KEY="your-key"
$env:GEMINI_MODEL="gemini-2.5-flash"
npm start
```

The browser never receives the API key. If Gemini is unavailable, the server falls back to transparent local signal checks. Do not commit a real `.env` file or expose the key in frontend JavaScript.

## Features

- Responsive landing page and message checker.
- Shared first-encounter detector used by both browser fallback and backend: payment pressure, unrealistic returns, urgency, credential requests, job/prize claims, impersonation patterns, and URL structure signals.
- Deterministic findings are merged with Gemini results so an LLM response cannot silently downgrade local warning signals.
- Optional server-side Gemini structured analysis.
- Risk findings with plain-language explanations and safer next steps.
- Community pattern feed with browser-local storage, simple similarity matching, and an explicit unverified/review state.
- Copyable report summary, sample message, category filter, and resettable demo data.

## Demo flow (2 minutes)

1. Click **Try a sample**.
2. Click **Analyze risk signals** and explain the findings.
3. Click **Add anonymous pattern** to show the community feed update.
4. Analyze a similar message to demonstrate the prototype's basic pattern grouping.
5. Reset demo patterns if you want to start clean.

## Important prototype limitations

- This is a prototype, not a production security service.
- The numeric score is a heuristic, not a calibrated probability.
- The community feed is stored in the current browser only; it does not sync between users.
- Similarity matching is a simple word-overlap heuristic and can produce false matches or miss related messages.
- The app does not open or fetch submitted URLs, scan files, run OCR, or check a live threat-intelligence database. URL structure checks are heuristic and cannot confirm whether a site is malicious.
- No detector catches every scam. Scores are warning-signal scores, not probabilities or proof of wrongdoing.
- A real multi-user deployment needs a shared database, rate limiting, abuse prevention, moderation, retention rules, privacy review, and safe handling of malicious URLs.
- Do not publish allegations about identifiable people based on unverified submissions. Reports are explicitly marked as unverified.


## Multi-threat coverage

The detector includes explainable local heuristic checks for phishing/account impersonation, credential and identity theft, malware-related download instructions, fake technical support/remote-access requests, investment and advance-fee job scams, shopping/refund patterns, delivery impersonation, social engineering, blackmail/sextortion wording, and suspicious URLs. These checks can flag a first-seen message without community reports. They are screening heuristics, not a guarantee of detection or proof that a sender/site/file is malicious. The app does not open submitted URLs or scan uploaded files. Optional Gemini analysis requires a key in `.env`; local checks still run without it.

## Run locally

1. Install Node.js 18 or later.
2. Extract the ZIP and open a terminal in the folder containing `package.json`.
3. Run `npm start`.
4. Open `http://localhost:3000`.
5. Optional: copy `.env.example` to `.env` and set `GEMINI_API_KEY` to enable Gemini. Never put the API key in browser code.
