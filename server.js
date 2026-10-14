const http = require("http");
const fs = require("fs");
const path = require("path");
const { analyze: localAnalyze } = require("./detector");

const ROOT = __dirname;
loadEnv(path.join(ROOT, ".env"));
const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const DATA_DIR = path.join(ROOT, "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const MIME = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml"};

function loadEnv(file) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {}
}
function json(res, status, data) {
  res.writeHead(status, {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
  res.end(JSON.stringify(data));
}
function ensureData() {
  fs.mkdirSync(DATA_DIR, {recursive:true});
  if (!fs.existsSync(REPORTS_FILE)) {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify([
      {id:"demo-1",category:"job",title:"Advance fee for a job offer",description:"A recruiter asks candidates to pay a registration or training fee before an offer letter is issued.",count:12,status:"review",source:"Illustrative demo pattern",signals:["advance payment","urgency"],demo:true},
      {id:"demo-2",category:"payment",title:"Urgent account verification request",description:"A message pressures the recipient to share an OTP or click a link to avoid account suspension.",count:8,status:"review",source:"Illustrative demo pattern",signals:["urgency","credential request"],demo:true},
      {id:"demo-3",category:"link",title:"Prize claim with a processing fee",description:"A prize notification asks for payment or sensitive information before a reward can be claimed.",count:5,status:"new",source:"Illustrative demo pattern",signals:["upfront payment","prize claim"],demo:true}
    ], null, 2));
  }
}
function readReports() { ensureData(); try { const data=JSON.parse(fs.readFileSync(REPORTS_FILE,"utf8")); return Array.isArray(data)?data:[]; } catch { return []; } }
function writeReports(reports) { ensureData(); const tmp=REPORTS_FILE+".tmp"; fs.writeFileSync(tmp,JSON.stringify(reports,null,2)); fs.renameSync(tmp,REPORTS_FILE); }
async function geminiAnalyze(message, url) {
  const prompt = `You are a cautious scam-risk screening assistant. Assess the provided message and optional URL for warning signals. A first-time scam may have zero community reports; assess the evidence in the message itself. Do not claim certainty, identify people as criminals, or infer facts not present. Score is a heuristic from 0-100, NOT a probability. If unclear, say so. Return ONLY valid JSON with schema: {"score": integer 0-100, "level": string, "summary": string, "category": "phishing"|"malware"|"tech-support"|"identity"|"job"|"investment"|"shopping"|"payment"|"social-engineering"|"extortion"|"delivery"|"link"|"other", "findings":[{"key":string,"title":string,"detail":string,"points":integer}], "engine":"Gemini AI analysis", "needsReview":boolean}. Provide 0-5 findings. Keep titles and explanations concise. Never reproduce secrets or private identifiers. Message: ${String(message||"").slice(0,6000)}\nURL text (do not visit it): ${String(url||"").slice(0,1000)}`;
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 18000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(API_KEY)}`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.2,responseMimeType:"application/json"}}),
      signal:controller.signal
    });
    if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);
    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("");
    if (!raw) throw new Error("Empty Gemini response");
    const parsed = JSON.parse(raw);
    if (typeof parsed.score !== "number" || !Array.isArray(parsed.findings)) throw new Error("Unexpected response shape");
    parsed.score = Math.max(0,Math.min(100,Math.round(parsed.score)));
    parsed.level = parsed.level || (parsed.score>=60?"High caution":parsed.score>=30?"Caution advised":parsed.score>0?"Some warning signs":"No obvious signals found");
    parsed.summary = parsed.summary || "Review the evidence and verify the sender independently.";
    parsed.category = ["phishing","malware","tech-support","identity","job","investment","shopping","payment","social-engineering","extortion","delivery","link","other"].includes(parsed.category)?parsed.category:"other";
    parsed.findings = parsed.findings.slice(0,5).map(f=>({key:String(f.key||"signal").slice(0,40),title:String(f.title||"Potential warning sign").slice(0,100),detail:String(f.detail||"Verify this claim independently.").slice(0,500),points:Math.max(0,Math.min(30,Number(f.points)||0))}));
    parsed.engine = "Gemini AI";
    return parsed;
  } finally { clearTimeout(timeout); }
}
function normalize(s) { return String(s||"").toLowerCase().replace(/https?:\/\/\S+/g," URL ").replace(/[^a-z0-9₹]+/g," ").trim(); }
function similarity(a,b) {
  const aa=new Set(normalize(a).split(" ").filter(w=>w.length>3)),bb=new Set(normalize(b).split(" ").filter(w=>w.length>3));
  if(!aa.size||!bb.size)return 0; let common=0; aa.forEach(w=>{if(bb.has(w))common++}); return common/Math.max(aa.size,bb.size);
}
function publicReport(r) { const {normalized,...safe}=r; return safe; }
function handleReportSubmit(body) {
  const message=String(body.message||"").slice(0,6000);
  const result=body.result||{};
  if(message.trim().length<8) return {status:400,data:{error:"Message is too short"}};
  const reports=readReports();
  const norm=normalize(message);
  const validCategories=["phishing","malware","tech-support","identity","job","investment","shopping","payment","social-engineering","extortion","delivery","link","other"];
  const category=validCategories.includes(result.category)?result.category:"other";
  const match=reports.find(r=>!r.demo&&r.category===category&&r.normalized&&similarity(r.normalized,norm)>.36);
  if(match) {
    match.count=(Number(match.count)||1)+1;
    match.status="review";
    match.description="A new submission shares some text patterns with this report. Similarity is a clue for review, not proof of a shared scam.";
    match.updatedAt=new Date().toISOString();
    writeReports(reports);
    return {status:200,data:{report:publicReport(match),matched:true,reports:reports.map(publicReport)}};
  }
  const titleMap={phishing:"New phishing warning signal",malware:"New suspicious-download warning signal","tech-support":"New fake-support warning signal",identity:"New identity-theft warning signal",job:"New employment-related warning signal",investment:"New investment warning signal",shopping:"New shopping or marketplace warning signal",payment:"New payment-related warning signal","social-engineering":"New social-engineering warning signal",extortion:"New extortion warning signal",delivery:"New delivery-impersonation warning signal",link:"New link-related warning signal",other:"New cyber-safety warning signal"};
  const report={id:"r-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),category,title:titleMap[category],description:(Array.isArray(result.findings)?result.findings:[]).slice(0,2).map(f=>String(f.title||"")).filter(Boolean).join(" · ")||"A new message was flagged for further review.",count:1,status:"new",source:"User-submitted · unverified",signals:(Array.isArray(result.findings)?result.findings:[]).slice(0,5).map(f=>String(f.key||"signal")),normalized:norm,createdAt:new Date().toISOString(),demo:false};
  reports.unshift(report);
  writeReports(reports.slice(0,500));
  return {status:200,data:{report:publicReport(report),matched:false,reports:readReports().map(publicReport)}};
}
ensureData();
const server = http.createServer(async (req,res) => {
  const parsed = new URL(req.url,"http://localhost");
  if (req.method==="GET" && parsed.pathname==="/api/health") return json(res,200,{ok:true,aiConfigured:Boolean(API_KEY),engine:API_KEY?"Gemini AI":"Local signal checks",sharedStorage:"server JSON file",model:API_KEY?MODEL:null});
  if (req.method==="GET" && parsed.pathname==="/api/reports") return json(res,200,{reports:readReports().map(publicReport),storage:"server"});
  if (req.method==="POST" && parsed.pathname==="/api/analyze") {
    let body="";
    req.on("data",chunk=>{body+=chunk;if(body.length>20000){req.destroy();}});
    req.on("end",async()=>{
      try {
        const data=JSON.parse(body||"{}");
        const message=String(data.message||"").slice(0,6000), url=String(data.url||"").slice(0,1000);
        if(!message.trim()&&!url.trim()) return json(res,400,{error:"Message or URL required"});
        const baseline = localAnalyze(message,url);
        if(API_KEY) {
          try {
            const ai = await geminiAnalyze(message,url);
            // The model is advisory. Preserve deterministic signals and never let AI return a zero-risk result over them.
            const merged = [...(ai.findings || [])];
            const seen = new Set(merged.map(f => f.key));
            for (const finding of baseline.findings.filter(f => f.points > 0)) {
              if (!seen.has(finding.key)) { merged.push(finding); seen.add(finding.key); }
            }
            ai.score = Math.max(Number(ai.score) || 0, baseline.score);
            ai.level = ai.score >= 60 ? "High caution" : ai.score >= 30 ? "Caution advised" : ai.score > 0 ? "Some warning signs" : "No obvious signals found";
            if (baseline.score >= (Number(ai.score) || 0) || baseline.score >= 30) ai.summary = baseline.summary;
            ai.findings = merged.filter(f => Number(f.points) > 0).slice(0, 8);
            if (!ai.findings.length) ai.findings = baseline.findings;
            ai.category = baseline.category || ai.category;
            ai.engine = "Gemini AI + local signal checks";
            ai.needsReview = ai.score < 30;
            return json(res,200,ai);
          }
          catch(e) { console.error("Gemini analysis failed; using fallback:",e.message); }
        }
        const result=baseline;
        result.engine=API_KEY?"Local fallback (AI service unavailable)":"Local signal checks (Gemini not configured)";
        result.aiConfigured=Boolean(API_KEY);
        return json(res,200,result);
      } catch { return json(res,400,{error:"Invalid request"}); }
    });
    return;
  }
  if (req.method==="POST" && parsed.pathname==="/api/reports") {
    let body="";
    req.on("data",chunk=>{body+=chunk;if(body.length>20000){req.destroy();}});
    req.on("end",()=>{
      try { const out=handleReportSubmit(JSON.parse(body||"{}")); return json(res,out.status,out.data); }
      catch { return json(res,400,{error:"Invalid report"}); }
    });
    return;
  }
  if (req.method==="POST" && parsed.pathname==="/api/reports/reset") {
    writeReports(readReports().filter(r=>r.demo));
    return json(res,200,{ok:true,reports:readReports().map(publicReport)});
  }
  const pathname = decodeURIComponent(parsed.pathname);
  const requested = pathname==="/" ? "index.html" : pathname.replace(/^\/+/,"");
  const full = path.resolve(ROOT,requested);
  if (!full.startsWith(ROOT+path.sep) && full!==path.join(ROOT,"index.html")) return json(res,403,{error:"Forbidden"});
  fs.readFile(full,(err,content)=>{
    if(err) return json(res,404,{error:"Not found"});
    res.writeHead(200,{"Content-Type":MIME[path.extname(full)]||"application/octet-stream","X-Content-Type-Options":"nosniff"});
    res.end(content);
  });
});
server.listen(PORT,()=>console.log(`ScamMirror AI running at http://localhost:${PORT} (${API_KEY?"Gemini AI configured":"local fallback mode; add GEMINI_API_KEY to .env for Gemini"})`));
