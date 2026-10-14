(function (root, factory) {
  const detect = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = detect;
  if (root) root.ScamMirrorDetector = detect;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function analyze(message, suppliedUrl) {
    const original = `${message || ""} ${suppliedUrl || ""}`;
    const text = original.toLowerCase().replace(/[’‘]/g, "'");
    const findings = [];
    const add = (key, title, detail, points) => {
      if (!findings.some(item => item.key === key)) findings.push({ key, title, detail, points });
    };

    // Money requests: tolerate natural phrasing and spelling variation around the amount.
    const moneyAsk = /\b(send|pay|transfer|deposit|invest|investment|lend|loan|recharge|top\s?up|processing fee|registration fee|advance fee|send me|pay me)\b/i.test(text)
      || /\b(?:₹|rs\.?\s*)\s?\d+/i.test(text)
      || /\b\d[\d,]*\s?(?:inr|rupees|rupee)\b/i.test(text)
      || /\b(send|pay|transfer)\s+(?:me\s+)?\d[\d,]*/i.test(text);
    if (moneyAsk) add("money", "Upfront money or investment request", "The sender asks for money, a transfer, or an investment. Verify the person and platform independently before paying.", 25);

    if (/\b(?:urgent|immediately|expires|last chance|act now|limited time|hurry|within\s*\d+\s*(?:minutes?|mins?|min|hours?|hrs?)|in\s*\d+\s*(?:minutes?|mins?|min|hours?|hrs?)|\d+\s*(?:minutes?|mins?|min)\b)\b/i.test(text)) {
      add("urgency", "Pressure to act quickly", "A short deadline can pressure you to act before checking the claim. Pause and verify independently.", 20);
    }

    const hasAmount = /(?:₹\s?\d[\d,]*|\b\d[\d,]{2,}\b|\b(?:double|triple|10x|14x)\b)/i.test(text);
    const hasReturnLanguage = /\b(return|give back|pay back|earn|profit|make|turn|send back|receive|get back|will give|will return)\b/i.test(text);
    const hasMoneyContext = /\b(invest|investment|money|rupees?|inr|return|profit|platform|send me|pay me)\b/i.test(text);
    const hasFastPromise = /\b(?:within|in)\s*\d+\s*(?:minutes?|mins?|min|hours?|hrs?)\b/i.test(text);
    const amountMentions = [...text.matchAll(/(?:₹\s*)?(\d[\d,]*)/g)].map(m => Number(m[1].replace(/,/g, ""))).filter(Number.isFinite);
    const exaggeratedNumericReturn = amountMentions.length >= 2 && Math.max(...amountMentions) >= 5000 && Math.min(...amountMentions) > 0 && Math.max(...amountMentions) / Math.min(...amountMentions) >= 3;
    if ((hasAmount && hasReturnLanguage && hasMoneyContext) || (exaggeratedNumericReturn && hasMoneyContext) || (hasFastPromise && hasMoneyContext && hasAmount)) {
      add("unrealistic-return", "Unrealistic or guaranteed investment return", "The message appears to promise unusually high returns, especially within minutes. This is a major warning sign; no return should be assumed guaranteed.", 35);
    }

    if (/\b(?:otp|one time password|password|\bpin\b|\bcvv\b|bank details|account details|card details|verify your account|share your credentials|account suspended|account blocked)\b/i.test(text)) {
      add("credentials", "Sensitive information or account pressure", "Never share an OTP, password, PIN, CVV, or full banking details in response to an unsolicited message.", 27);
    }
    if (/\b(?:selected|winner|won|prize|lottery|reward|guaranteed income|easy money|double your money|free gift|claim your)\b/i.test(text)) {
      add("too-good", "Prize or unusually attractive promise", "Unexpected rewards and easy-money promises should be verified independently, especially if payment or personal details are requested.", 15);
    }
    if (/\b(?:job|recruit(?:er|ment)?|joining letter|salary|work from home|remote job|hiring|vacancy|work opportunity|task job)\b/i.test(text)) {
      add("job", "Employment claim needs verification", "Check the vacancy through the employer's official website or independently sourced contact details. Upfront job fees are a strong warning sign.", 10);
    }
    if (/\b(?:click here|open this link|download apk|install this app|short link|login to claim|verify now)\b/i.test(text) || /\b(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|is\.gd)\b/i.test(text)) {
      add("link", "Link or download request", "Avoid unknown links and files. Navigate to the official website yourself instead of using a message link.", 18);
    }
    if (/\b(?:whatsapp|telegram|personal number|only on chat|don't tell|do not tell|keep secret|secret|no need to tell anyone)\b/i.test(text)) {
      add("off-channel", "Unusual communication or secrecy", "Requests to keep a transaction secret or move away from official channels make independent verification harder.", 10);
    }
    if (/\b(?:crypto|cryptocurrency|bitcoin|forex|trading signals|double your capital|guaranteed returns|risk free investment|risk-free)\b/i.test(text)) {
      add("investment-claim", "High-risk investment claim", "Investment pitches promising certainty or extraordinary returns deserve careful independent verification.", 15);
    }
    if (/\b(?:police|arrest|court case|digital arrest|customs|parcel seized|electricity disconnected|sim blocked|fine pending)\b/i.test(text) && /\b(?:pay|transfer|otp|click|immediately|today|verify)\b/i.test(text)) {
      add("threat", "Threat or authority impersonation pattern", "Threats of arrest, disconnection, or penalties paired with payment or verification demands are common social-engineering signals. Verify through an official channel.", 25);
    }
    if (/\b(?:refund|cashback|kyc update|kyc expired|account will be closed|account closure|bank update)\b/i.test(text) && /\b(?:link|click|otp|pay|verify|update|send)\b/i.test(text)) {
      add("account-action", "Account, KYC, or refund action request", "Unsolicited account or refund requests can be used for phishing. Contact the organization using its official app or number.", 18);
    }

    // Cyber-specific patterns beyond payment fraud.
    if (/\b(?:verify your account|account suspended|account blocked|password reset|sign in to avoid|login to restore|unusual login|security alert|confirm your password|update your credentials|bank account will be blocked)\b/i.test(text)) {
      add("phishing", "Phishing or account impersonation", "The message imitates an account/security workflow or pressures you to sign in. Open the official app or type the known website address yourself.", 24);
    }
    if (/\b(?:install anydesk|anydesk|teamviewer|remote access|screen sharing|share your screen|remote support|disable antivirus|turn off defender|support agent|technical support number|call support immediately)\b/i.test(text)) {
      add("tech-support", "Remote-access or fake support pattern", "Unexpected requests for remote access, screen sharing, or disabling security tools can expose your device and accounts. Contact official support independently.", 25);
    }
    if (/\b(?:apk file|install this apk|unknown app|download attachment|enable macros|run this script|disable security|password protected zip|cracked software|mod apk|malware|ransomware)\b/i.test(text)) {
      add("malware", "Potentially unsafe download or execution", "The message encourages a risky download or execution step. Do not install unknown apps or run files from untrusted senders; text screening cannot confirm whether a file is infected.", 22);
    }
    if (/\b(?:aadhaar|aadhar|pan card|social security number|identity document|identity proof|upload your id|send your id|recovery code|backup code|otp|one time password|cvv|pin)\b/i.test(text)) {
      add("identity", "Identity or account-secret exposure risk", "The message involves sensitive identity or authentication information. Do not send OTPs, recovery codes, PINs, or identity documents to unverified contacts.", 24);
    }
    if (/\b(?:parcel seized|customs duty|delivery failed|pay redelivery|track your parcel|courier fee|package held|shipping fee)\b/i.test(text)) {
      add("delivery", "Delivery or parcel impersonation pattern", "Unexpected delivery notices with payment or verification demands can be used to steal card details or credentials. Check tracking through the courier's official site.", 18);
    }
    if (/\b(?:fake store|too cheap|flash sale|refund pending|cashback|order cancelled|payment failed|seller asks|outside the platform|pay outside|marketplace buyer|marketplace seller)\b/i.test(text)) {
      add("shopping", "Online shopping or marketplace risk", "The message includes a shopping, refund, or off-platform transaction pattern. Keep payments inside the official marketplace and verify refunds in the app.", 16);
    }
    if (/\b(?:romance|dating app|love you|emergency money|flight ticket|sick relative|gift parcel|gift customs fee|online boyfriend|online girlfriend)\b/i.test(text) && /\b(?:send|money|pay|transfer|gift|fee|urgent|emergency)\b/i.test(text)) {
      add("romance", "Relationship or emotional manipulation pattern", "A relationship or emotional appeal combined with a money request deserves independent verification. Do not send funds to someone you have not reliably verified.", 20);
    }
    if (/\b(?:blackmail|sextortion|leaked photos|share your photos|private video|pay or expose|send intimate|webcam recording|we will publish|publish your private photos|publish your photos|publish your videos|expose your photos|release your photos)\b/i.test(text)) {
      add("extortion", "Blackmail or sextortion warning", "Threats to publish private material may be coercion or extortion. Do not pay or send more material; preserve evidence and seek help from a trusted person or relevant authorities.", 35);
    }
    if (/\b(?:police|cyber crime officer|digital arrest|court case|arrest warrant|customs officer|government officer|income tax officer)\b/i.test(text) && /\b(?:video call|pay|transfer|fine|arrest|secret|do not disconnect|immediately|otp)\b/i.test(text)) {
      add("authority-impersonation", "Possible authority impersonation", "Threats from someone claiming to be an official, especially with payment demands or instructions to stay on a call, are a major social-engineering warning. Verify through official public contact channels.", 26);
    }
    if (/\b(?:vote for me|forward this to 20|send this to everyone|your account will be deleted unless|keep this confidential|don't tell anyone|do not tell anyone)\b/i.test(text)) {
      add("social-engineering", "Manipulation or secrecy pressure", "The message uses secrecy, threats, or forwarding pressure. Verify the request through another trusted channel before acting.", 12);
    }

    const rawUrl = String(suppliedUrl || "").trim();
    const embeddedUrls = original.match(/https?:\/\/[^\s<>'"]+/gi) || [];
    const candidateUrl = rawUrl || embeddedUrls[0] || "";
    if (candidateUrl) {
      try {
        const normalized = /^https?:\/\//i.test(candidateUrl) ? candidateUrl : "https://" + candidateUrl;
        const u = new URL(normalized);
        const host = u.hostname.toLowerCase();
        if (u.protocol !== "https:") add("insecure-url", "Link does not use HTTPS", "The URL does not use an encrypted HTTPS connection. This alone does not prove fraud, but do not enter sensitive information.", 12);
        if (u.username || u.password || candidateUrl.includes("@")) add("userinfo-url", "URL contains unusual credentials syntax", "A URL containing an @ sign or embedded credentials can disguise its real destination. Do not open it unless verified.", 20);
        if (/(?:^|\.)(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|is\.gd|rebrand\.ly)$/i.test(host)) add("short-url", "Shortened link hides its destination", "A shortened URL obscures the final destination. Check it through a trusted security service before opening.", 15);
        if (host.includes("--") || /xn--/i.test(host)) add("odd-url", "Unusual domain structure", "The domain uses a pattern sometimes seen in deceptive URLs. This signal alone does not prove fraud.", 12);
        if (/\.(?:zip|mov)$/i.test(host)) add("unusual-tld", "Domain ending deserves extra scrutiny", "Some domain endings can be visually confusing in links. Verify the domain carefully before proceeding.", 8);
        if (u.protocol !== "http:" && u.protocol !== "https:") add("unsupported-protocol", "Unsupported link protocol", "Only inspect links using standard web protocols, and never open unknown links automatically.", 15);
      } catch {
        add("invalid-url", "URL could not be parsed", "The supplied link appears incomplete or malformed. Do not open it until verified.", 10);
      }
    }

    let score = Math.min(95, findings.reduce((sum, f) => sum + f.points, 0));
    if (findings.some(f => f.key === "credentials")) score = Math.min(95, score + 8);
    if (!findings.length) findings.push({ key: "context", title: "No obvious warning signals found", detail: "Automated checks can miss new or sophisticated scams. This is not a guarantee of safety; verify the sender and claims independently.", points: 0 });
    const level = score >= 60 ? "High caution" : score >= 30 ? "Caution advised" : score > 0 ? "Some warning signs" : "No obvious signals found";
    const summary = score >= 60 ? "Multiple warning signs were found. Do not send money, click links, or share sensitive details until you verify independently." : score >= 30 ? "Warning signs were found. Pause and verify the sender, website, and claim through an independent trusted channel." : score > 0 ? "Some warning signs were found. Check the sender and context before acting." : "This quick check found no obvious warning signals. That does not mean the message is safe.";
    let category = "other";
    if (/\b(?:blackmail|sextortion|leaked photos|private video|pay or expose|publish your private photos|publish your photos|publish your videos|expose your photos|release your photos)\b/i.test(text)) category = "extortion";
    else if (/\b(?:anydesk|teamviewer|remote access|screen sharing|disable antivirus|technical support)\b/i.test(text)) category = "tech-support";
    else if (/\b(?:apk|malware|ransomware|enable macros|run this script|cracked software)\b/i.test(text)) category = "malware";
    else if (/\b(?:otp|password|recovery code|aadhaar|aadhar|pan card|cvv|pin|identity document)\b/i.test(text)) category = "identity";
    else if (/\b(?:verify your account|account suspended|password reset|security alert|login to restore|phishing)\b/i.test(text)) category = "phishing";
    else if (/\b(?:job|recruit|joining letter|salary|hiring|vacancy|work from home)\b/i.test(text)) category = "job";
    else if (/\b(?:crypto|cryptocurrency|bitcoin|forex|trading|investment|invest|returns)\b/i.test(text)) category = "investment";
    else if (/\b(?:parcel|courier|delivery|shipping|marketplace|seller|refund|cashback|store|order)\b/i.test(text)) category = "shopping";
    else if (/\b(?:police|digital arrest|arrest warrant|government officer|blackmail|romance|dating app)\b/i.test(text)) category = "social-engineering";
    else if (candidateUrl || /\b(?:https?|link|url|click)\b/i.test(text)) category = "link";
    else if (moneyAsk) category = "payment";
    return { score, level, summary, findings, category, engine: "Local signal checks", needsReview: score < 30 };
  }
  return { analyze };
});
