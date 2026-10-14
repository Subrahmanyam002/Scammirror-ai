# 🪞 ScamMirror AI
### See the red flags before they become your problem.

**An AI-powered cyber safety platform that helps people recognize suspicious messages, phishing attempts, impersonation, fake job offers, malicious download instructions, and other online scam patterns — even when a threat appears for the first time.**

<p align="center">
  <strong>🛡️ Detect · 🔍 Understand · 🚨 Stay Safe</strong>
</p>

---

## 🌐 About the Project

Online scams are evolving rapidly. A suspicious message might arrive as a delivery notification, a job offer, a fake customer-support request, an investment opportunity, or an urgent warning from an impersonated account.

**ScamMirror AI helps users pause, analyze the warning signs, and make safer decisions.**

Instead of presenting only a risk score, ScamMirror explains *why* a message looks suspicious and suggests practical next steps.

Built as a responsive hackathon prototype, the project combines transparent local detection rules with optional server-side Google Gemini analysis.

Live demo:https://scammirror-ai.onrender.com/

## ✨ Key Features

- 🧠 **AI-Assisted Analysis** — Optional Gemini integration provides additional analysis of suspicious content.
- 🔍 **Multi-Threat Screening** — Checks for phishing, identity theft, fake jobs, advance-fee requests, shopping and refund scams, delivery impersonation, tech-support fraud, blackmail wording, and suspicious URL patterns.
- 🚩 **Explainable Risk Signals** — Highlights suspicious wording and explains why it deserves attention.
- 🛡️ **Safer Next Steps** — Offers practical guidance to help users avoid risky actions.
- 🌐 **First-Encounter Screening** — Local detection rules can flag suspicious patterns without needing a previous community report.
- 👥 **Community Pattern Demo** — Groups potentially similar reports in a browser-local feed and marks submissions as unverified.
- 📱 **Responsive Interface** — Designed for use on desktop and mobile screens.
- 🔐 **Server-Side API Key Handling** — The Gemini key stays on the server rather than being sent to the browser.

## 🚀 How It Works

1. **Submit** — Paste a suspicious message or text for analysis.
2. **Analyze** — Local detection rules identify warning signals; optional Gemini analysis adds another layer of interpretation.
3. **Understand** — Review the risk score, findings, and plain-language explanations.
4. **Act Safely** — Follow the recommended next steps before replying, clicking, sharing information, or making a payment.
5. **Recognize Patterns** — Explore the community-pattern demo to see how similar reports can be grouped.

## 🧪 Try the Demo

1. Launch the application locally or open the deployed website.
2. Click **Try a sample**.
3. Select **Analyze risk signals**.
4. Review the findings and recommended actions.
5. Add an anonymous pattern to explore the community feed.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML, CSS, JavaScript | Responsive frontend |
| Node.js | Backend server |
| Local detection rules | Transparent, deterministic warning-signal checks |
| Google Gemini API (optional) | Additional AI-assisted analysis |
| Browser local storage | Demo community-pattern persistence |

## ⚙️ Run Locally

**Requirements:** Node.js 18 or later.

```bash
git clone https://github.com/Subrahmanyam002/Scammirror-ai.git
cd Scammirror-ai
npm start
```

Open **http://localhost:3000** in your browser.

No additional npm dependencies are required for the basic prototype.

### Enable optional Gemini analysis

1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Create a `.env` file in the project root based on `.env.example`.
3. Add your key and model:

```env
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-2.5-flash
```

4. Restart the server.

Keep `.env` private and never commit your real API key. If Gemini is unavailable, the application can fall back to its local detection rules.

## 🎯 Why ScamMirror AI?

Many people encounter suspicious messages before those messages have been reported by anyone else. ScamMirror focuses on **explainable first-encounter screening**, helping users recognize warning signs instead of relying entirely on previous reports.

Its goal is simple: make cybersecurity awareness more accessible, understandable, and actionable.

## ⚠️ Important Limitations

ScamMirror AI is a hackathon prototype, not a complete security or threat-intelligence service.

- Risk scores are heuristic indicators, not calibrated probabilities or proof of malicious activity.
- Detection rules and AI analysis can produce false positives or miss threats.
- Submitted URLs are not opened or checked against a live threat-intelligence database.
- Uploaded files are not scanned, and the application does not perform OCR.
- Community reports are stored in the current browser and do not synchronize across users.
- Community similarity matching is basic and may incorrectly group or miss reports.
- Production deployment would require shared storage, rate limiting, abuse prevention, moderation, privacy safeguards, and security testing.

**Safety reminder:** Do not click suspicious links, share verification codes, disclose passwords, install unknown software, or send money simply because a message appears legitimate.

## 🔮 Future Scope

- Live URL reputation checks using trusted threat-intelligence services.
- Safe image and screenshot analysis for suspicious messages.
- Malware-file scanning through an isolated, trusted scanning service.
- A shared community reporting database with moderation.
- Multilingual scam screening.
- Improved detection evaluation using labeled test datasets.
- Privacy-preserving analytics and abuse protection.

## 👨‍💻 Built for a Safer Internet

ScamMirror AI is a cybersecurity hackathon prototype exploring how explainable detection and AI-assisted analysis can help people make more informed decisions online.

**Think before you click. Verify before you trust.**

---

*Disclaimer: ScamMirror AI provides screening guidance for educational purposes. It cannot guarantee that a message, website, or sender is safe or malicious.*
