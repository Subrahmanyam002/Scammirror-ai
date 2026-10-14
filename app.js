const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "scammirror-community-v1";
const SAMPLE = "Send me ₹1,000 now. I will invest it and return ₹14,000 within 5 minutes.";
const SAMPLES = {investment:SAMPLE,phishing:"URGENT: Your bank account will be blocked today. Share your OTP immediately to restore access.",malware:"Your parcel invoice is attached. Install this APK and disable security protection to view it.",support:"I am technical support. Install AnyDesk and share your screen so I can fix your bank account.",job:"You are selected for a remote job. Pay ₹2,500 registration fee now to confirm your joining.",extortion:"Pay me today or I will publish your private photos and videos.",shopping:"Your refund failed. Click this shortened link and enter your card details to receive your cashback."};
const initialReports = [
  {id:"demo-1",category:"job",title:"Advance fee for a job offer",description:"A recruiter asks candidates to pay a registration or training fee before an offer letter is issued.",count:12,status:"review",source:"Illustrative demo pattern",signals:["advance payment","urgency"]},
  {id:"demo-2",category:"payment",title:"Urgent account verification request",description:"A message pressures the recipient to share an OTP or click a link to avoid account suspension.",count:8,status:"review",source:"Illustrative demo pattern",signals:["urgency","credential request"]},
  {id:"demo-3",category:"link",title:"Prize claim with a processing fee",description:"A prize notification asks for payment or sensitive information before a reward can be claimed.",count:5,status:"new",source:"Illustrative demo pattern",signals:["upfront payment","prize claim"]}
];
let latestAnalysis = null;
let toastTimer;
const escapeHTML = (str) => String(str).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let serverReports = initialReports.map(x=>({...x}));
async function refreshReports(){
  try { const res=await fetch("/api/reports"); if(!res.ok) throw new Error("API unavailable"); const data=await res.json(); if(Array.isArray(data.reports)) serverReports=data.reports; }
  catch { /* Keep demo cards visible if the backend is unavailable. */ }
  renderReports();
}
function loadReports(){return serverReports;}
function showToast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2700);}
function updateCount(){$("charCount").textContent=`${$("messageInput").value.length} / 6000`;}
function normalize(s){return String(s||"").toLowerCase().replace(/https?:\/\/\S+/g," URL ").replace(/[^a-z0-9₹]+/g," ").trim();}
function localAnalyze(message, url){ return window.ScamMirrorDetector.analyze(message, url); }
async function analyze(message,url){
  const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,url})});
  if(!res.ok)throw new Error("AI endpoint unavailable");
  return res.json();
}
function renderResult(result){
  latestAnalysis=result;
  $("emptyState").classList.add("hidden");$("resultContent").classList.remove("hidden");
  const color=result.score>=60?"var(--red)":result.score>=30?"var(--amber)":"var(--mint)";
  const findings=(result.findings||[]).map(f=>`<div class="finding"><span class="finding-icon ${f.points===0?"info":""}">${f.points===0?"i":"!"}</span><div><strong>${escapeHTML(f.title)}</strong><p>${escapeHTML(f.detail)}</p></div></div>`).join("");
  $("resultContent").innerHTML=`<div class="result-top"><div class="risk-gauge" style="--risk-color:${color};--risk-deg:${Math.max(3,result.score)}%"><strong>${result.score}</strong></div><div class="risk-meta"><small>Risk signal score · 0–100</small><strong style="color:${color}">${escapeHTML(result.level)}</strong><p>${escapeHTML(result.engine||"AI-assisted analysis")}</p></div></div><div class="result-section-title">WHY THIS WAS FLAGGED</div>${findings}<div class="result-section-title">RECOMMENDED NEXT STEP</div><div class="next-step">${escapeHTML(result.summary)}</div><div class="result-actions"><button class="small-action primary" id="reportButton">＋ Add anonymous pattern</button><button class="small-action" id="copyButton">Copy summary ↗</button></div><p class="result-disclaimer">This is a screening aid, not a definitive verdict. The score is a heuristic, not a calibrated probability. We do not visit or verify submitted URLs in this demo.</p>`;
  $("reportButton").addEventListener("click",()=>submitReport(result,messageText()));
  $("copyButton").addEventListener("click",()=>copySummary(result));
}
function messageText(){return $("messageInput").value.trim();}
async function submitReport(result,message){
  if(!message){showToast("Add message text before submitting a pattern.");return;}
  try {
    const res=await fetch("/api/reports",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,result})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||"Could not save report");
    if(Array.isArray(data.reports)) serverReports=data.reports;
    renderReports();
    showToast(data.matched?"Similar pattern updated for review.":"Pattern saved to shared server storage as unverified.");
  } catch { showToast("Could not save to the server. Check that the backend is running."); }
}
function renderReports(){
  const reports=loadReports(),filter=$("feedFilter").value;
  const filtered=reports.filter(r=>filter==="all"||r.category===filter);
  $("feedCount").textContent=`${reports.length} ${reports.length===1?"signal":"signals"}`;
  $("patternGrid").innerHTML=filtered.length?filtered.slice(0,9).map(r=>`<article class="pattern-card"><div class="pattern-top"><span class="pattern-type">${escapeHTML(({phishing:"PHISHING",malware:"MALWARE RISK","tech-support":"FAKE SUPPORT",identity:"IDENTITY THEFT",job:"JOB / CAREER",investment:"INVESTMENT",shopping:"SHOPPING",payment:"PAYMENT","social-engineering":"SOCIAL ENGINEERING",extortion:"EXTORTION",delivery:"DELIVERY",link:"LINK / URL",other:"CYBER SAFETY"})[r.category]||"CYBER SAFETY")}</span><span class="pattern-count">${Number(r.count)||1} ${Number(r.count)===1?"report":"reports"}</span></div><h3>${escapeHTML(r.title)}</h3><p>${escapeHTML(r.description)}</p><div class="pattern-foot"><span>${escapeHTML(r.source||"Community submission")}</span><span class="pattern-status ${r.status==="new"?"new":r.status==="review"?"review":""}">${r.status==="new"?"New signal":r.status==="review"?"Needs review":"Demo pattern"}</span></div></article>`).join(""):`<div class="panel"><p>No patterns in this filter yet. Analyze a message to add one.</p></div>`;
}
function copySummary(result){const text=`ScamMirror AI check\nResult: ${result.level}\nRisk signal score: ${result.score}/100 (not a probability)\n${result.summary}\nSignals:\n${(result.findings||[]).map(f=>"- "+f.title+": "+f.detail).join("\n")}\nThis is not a definitive verdict. Verify independently.`;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(()=>showToast("Summary copied.")).catch(()=>fallbackCopy(text));else fallbackCopy(text);}
function fallbackCopy(text){const t=document.createElement("textarea");t.value=text;document.body.appendChild(t);t.select();try{document.execCommand("copy");showToast("Summary copied.");}catch{showToast("Copy unavailable in this browser.");}t.remove();}
$("messageInput").addEventListener("input",updateCount);
$("exampleButton").addEventListener("click",()=>{$("messageInput").value=SAMPLE;$("urlInput").value="";updateCount();$("messageInput").focus();});
const sampleSelect=$("sampleScenario"); if(sampleSelect) sampleSelect.addEventListener("change",()=>{const chosen=SAMPLES[sampleSelect.value];if(chosen){$("messageInput").value=chosen;$("urlInput").value="";updateCount();}});
$("analyzeButton").addEventListener("click",async()=>{
  const message=messageText(),url=$("urlInput").value.trim();$("formError").textContent="";
  if(!message&&!url){$("formError").textContent="Paste a message or add a URL to begin.";return;}
  if(message.length<8&&!url){$("formError").textContent="Add a little more context so the check is useful.";return;}
  const button=$("analyzeButton");button.disabled=true;button.querySelector(".button-label").textContent="Checking signals…";
  try{
    let result;
    try{result=await analyze(message,url);}catch{result=localAnalyze(message,url);result.engine="Local signal checks (offline fallback)";}
    if(!result||typeof result.score!=="number"||!Array.isArray(result.findings))throw new Error("Invalid response");
    renderResult(result);$("resultPanel").scrollIntoView({behavior:"smooth",block:"nearest"});
  }catch(e){$("formError").textContent="Could not analyze this content. Please try again.";}
  finally{button.disabled=false;button.querySelector(".button-label").textContent="Analyze risk signals";}
});
$("feedFilter").addEventListener("change",renderReports);
$("clearReportsButton").addEventListener("click",async()=>{try{const res=await fetch("/api/reports/reset",{method:"POST"});const data=await res.json();serverReports=data.reports||initialReports.map(x=>({...x}));renderReports();showToast("Demo patterns restored on the server.");}catch{showToast("Could not reset reports. Check the backend.");}});
if ($("menuButton")) {
  $("menuButton").addEventListener("click",()=>$("menuButton").previousElementSibling.classList.toggle("open"));
  document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>$("menuButton").previousElementSibling.classList.remove("open")));
}
async function checkBackendStatus(){
  const el=$("systemStatus"),label=$("systemStatusText");
  try {
    const res=await fetch("/api/health"); const data=await res.json();
    if(!res.ok||!data.ok) throw new Error("Offline");
    el.classList.add("online");
    if(data.aiConfigured){el.classList.add("ai");label.textContent="Gemini AI connected";el.title=`Backend online · ${data.model||"Gemini"} · shared server reports`;}
    else {label.textContent="Backend online · demo AI";el.title="Backend and shared report storage online. Add GEMINI_API_KEY in .env to enable Gemini AI.";}
  } catch {label.textContent="Backend offline";el.title="Backend not reachable. Start the server with npm start.";}
}
checkBackendStatus();updateCount();refreshReports();
