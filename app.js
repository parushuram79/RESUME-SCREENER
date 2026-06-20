/* ═══════════════════════════════════════════════════════════
   app.js  — ResumeScreener Pro UI Controller
   100% Offline · No API · Runs in any browser
═══════════════════════════════════════════════════════════ */
'use strict';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/* ─── STATE ──────────────────────────────────────────────── */
const S = {
  file: null, domain: '', expLevel: 'mid',
  analysis: null, resumeText: '', sessionCount: 0, chatOpen: false,
};

/* ─── TICKER ──────────────────────────────────────────────── */
const TDATA = [
  {l:'100% Offline',v:'No API'},{l:'Privacy',v:'100%'},{l:'Speed',v:'<2 Seconds'},
  {l:'Domains',v:'8'},{l:'ATS Rules',v:'12'},{l:'Data Sent',v:'Zero'},
  {l:'Works Without',v:'Internet'},{l:'Resume Formats',v:'PDF & TXT'},
  {l:'Keywords Checked',v:'200+'},{l:'Instant Results',v:'Always'},
];
(()=>{
  const t = document.getElementById('tickerTrack');
  const items = [...TDATA,...TDATA];
  t.innerHTML = items.map(d=>`<div class="ti">${d.l} <b>${d.v}</b></div>`).join('');
})();

/* ─── PARTICLES ───────────────────────────────────────────── */
(()=>{
  const c=document.getElementById('fx'),ctx=c.getContext('2d');
  let W,H,pts=[];
  const resize=()=>{W=c.width=innerWidth;H=c.height=innerHeight;};
  resize(); addEventListener('resize',resize);
  const mk=()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+.3,
    vx:(Math.random()-.5)*.25,vy:-Math.random()*.45-.1,life:1,
    decay:Math.random()*.0025+.001,
    col:['#3b82f6','#22d3ee','#6366f1','#60a5fa'][Math.floor(Math.random()*4)]});
  for(let i=0;i<70;i++)pts.push(mk());
  const draw=()=>{
    ctx.clearRect(0,0,W,H);
    pts.forEach((p,i)=>{
      p.x+=p.vx;p.y+=p.vy;p.life-=p.decay;
      if(p.life<=0||p.y<0){pts[i]=mk();pts[i].y=H;}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.col;ctx.globalAlpha=p.life*.5;ctx.fill();
    });
    ctx.globalAlpha=1;requestAnimationFrame(draw);
  };
  draw();
})();

/* ─── EXPERIENCE BUTTONS ─────────────────────────────────── */
document.querySelectorAll('.exp-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.exp-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); S.expLevel=b.dataset.exp;
  });
});

/* ─── UPLOAD ─────────────────────────────────────────────── */
const dz=document.getElementById('dz');
const fInput=document.getElementById('fInput');

fInput.addEventListener('change',e=>handleFile(e.target.files?.[0]));
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag');document.getElementById('dzLbl').textContent='📂 Drop it!';});
dz.addEventListener('dragleave',()=>{dz.classList.remove('drag');document.getElementById('dzLbl').textContent='Drag & Drop PDF / TXT';});
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag');document.getElementById('dzLbl').textContent='Drag & Drop PDF / TXT';handleFile(e.dataTransfer.files?.[0]);});

document.getElementById('rmFile').addEventListener('click',resetFile);
document.getElementById('clearPaste').addEventListener('click',()=>{document.getElementById('pasteArea').value='';checkReady();});
document.getElementById('pasteArea').addEventListener('input',checkReady);
document.getElementById('domSel').addEventListener('change',e=>{S.domain=e.target.value;checkReady();});

function handleFile(f) {
  if(!f){return;}
  const ok=['application/pdf','text/plain'];
  if(!ok.includes(f.type)&&!f.name.endsWith('.txt')&&!f.name.endsWith('.pdf')){
    showErr('Please upload a PDF or TXT file.'); return;
  }
  S.file=f; hideErr();
  document.getElementById('fBadge').style.display='flex';
  document.getElementById('fName').textContent=f.name;
  checkReady();
}

function resetFile(){
  S.file=null;S.analysis=null;S.resumeText='';
  document.getElementById('fBadge').style.display='none';
  fInput.value='';
  document.getElementById('dzLbl').textContent='Drag & Drop PDF / TXT';
  document.getElementById('resState').style.display='none';
  document.getElementById('emptyState').style.display='flex';
  document.getElementById('dlBtn').style.display='none';
  document.getElementById('tipsCard').style.display='block';
  checkReady();
}

function checkReady(){
  const hasTxt=document.getElementById('pasteArea').value.trim().length>50;
  document.getElementById('analyzeBtn').disabled=(!S.file&&!hasTxt)||!S.domain;
}

/* ─── ANALYZE ────────────────────────────────────────────── */
document.getElementById('analyzeBtn').addEventListener('click',runAnalysis);

async function runAnalysis(){
  hideErr(); showLoader();
  try{
    let text='';
    const pasted=document.getElementById('pasteArea').value.trim();
    if(pasted.length>50){
      text=pasted;
    } else if(S.file){
      text=await readFile(S.file);
    }
    if(!text||text.length<40) throw new Error('Could not read enough text. Try pasting your resume text directly.');
    S.resumeText=text;
    // Stagger loader steps for UX
    await delay(400);  document.getElementById('ls2').style.opacity='1';document.getElementById('ls2').style.color='var(--tx2)';
    await delay(500);  document.getElementById('ls3').style.opacity='1';document.getElementById('ls3').style.color='var(--tx2)';
    await delay(400);  document.getElementById('ls4').style.opacity='1';document.getElementById('ls4').style.color='var(--b2)';
    await delay(300);
    S.analysis = analyzeResume(text, S.domain, S.expLevel);
    S.sessionCount++;
    document.getElementById('stCount').textContent=S.sessionCount;
    showResults();
  }catch(e){
    hideLoader();showErr(e.message);
    document.getElementById('emptyState').style.display='flex';
    document.getElementById('tipsCard').style.display='block';
  }
}

async function readFile(file){
  if(file.type==='text/plain'||file.name.endsWith('.txt')){
    return new Promise((res,rej)=>{
      const r=new FileReader();
      r.onerror=()=>rej(new Error('Could not read file.'));
      r.onload=e=>res(e.target.result);
      r.readAsText(file);
    });
  }
  // PDF
  return new Promise((res,rej)=>{
    const reader=new FileReader();
    reader.onerror=()=>rej(new Error('File read failed.'));
    reader.onload=async e=>{
      try{
        const pdf=await pdfjsLib.getDocument({data:e.target.result}).promise;
        let txt='';
        for(let i=1;i<=pdf.numPages;i++){
          const pg=await pdf.getPage(i);
          const c=await pg.getTextContent();
          txt+=c.items.map(x=>x.str).join(' ')+'\n';
        }
        if(!txt.trim()) throw new Error('PDF appears to be image-based (scanned). Please paste your resume text instead.');
        res(txt.trim());
      }catch(err){rej(err);}
    };
    reader.readAsArrayBuffer(file);
  });
}

const delay=ms=>new Promise(r=>setTimeout(r,ms));

/* ─── LOADER ─────────────────────────────────────────────── */
function showLoader(){
  document.getElementById('emptyState').style.display='none';
  document.getElementById('resState').style.display='none';
  document.getElementById('loaderState').style.display='flex';
  document.getElementById('analyzeBtn').disabled=true;
  document.getElementById('dlBtn').style.display='none';
  document.getElementById('tipsCard').style.display='none';
  // reset steps
  ['ls1','ls2','ls3','ls4'].forEach((id,i)=>{
    const el=document.getElementById(id);
    el.style.opacity=i===0?'1':'0';
    el.style.color=i===0?'var(--b2)':'var(--tx3)';
  });
  const b=document.getElementById('lBar');
  b.style.animation='none';void b.offsetWidth;b.style.animation='lProg 2s ease forwards';
}
function hideLoader(){
  document.getElementById('loaderState').style.display='none';
  document.getElementById('analyzeBtn').disabled=false;
  checkReady();
}
function showErr(m){document.getElementById('errMsg').textContent=m;document.getElementById('errBox').style.display='flex';}
function hideErr(){document.getElementById('errBox').style.display='none';}

/* ─── GRADE ──────────────────────────────────────────────── */
function grade(s){
  if(s>=80)return{cls:'gA',lbl:'✦ Excellent'};
  if(s>=65)return{cls:'gB',lbl:'✓ Good'};
  if(s>=45)return{cls:'gC',lbl:'△ Fair'};
  return{cls:'gD',lbl:'⚠ Needs Work'};
}

function ring(score,col){
  const r=34,ci=2*Math.PI*r;
  return`<svg width="80" height="80" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="${r}" fill="none" stroke="${col}" stroke-width="6" opacity=".12"/>
    <circle cx="40" cy="40" r="${r}" fill="none" stroke="${col}" stroke-width="6"
      stroke-linecap="round" stroke-dasharray="${ci}" stroke-dashoffset="${ci*(1-score/100)}"
      transform="rotate(-90 40 40)"
      style="transition:stroke-dashoffset 1.4s ease;filter:drop-shadow(0 0 8px ${col})"/>
    <text x="40" y="45" text-anchor="middle" font-family="Inter" font-size="16" font-weight="800" fill="${col}">${score}</text>
  </svg>`;
}

/* ─── SHOW RESULTS ───────────────────────────────────────── */
function showResults(){
  hideLoader();
  const a=S.analysis;
  document.getElementById('emptyState').style.display='none';
  document.getElementById('resState').style.display='flex';
  document.getElementById('dlBtn').style.display='flex';

  // Score cards
  document.getElementById('scoreGrid').innerHTML=[
    {cls:'ov',lbl:'Overall Score',score:a.overallScore,col:'#60a5fa'},
    {cls:'at',lbl:'ATS Score',    score:a.atsScore,    col:'#22d3ee'},
  ].map((c,i)=>{
    const g=grade(c.score);
    return`<div class="sc-card ${c.cls}" style="animation-delay:${i*.1}s">
      <div class="sc-lbl">${c.lbl}</div>
      <div class="sc-body">
        <div><div class="sc-num">${c.score}<span class="sc-den">/100</span></div>
          <span class="sc-grade ${g.cls}">${g.lbl}</span></div>
        ${ring(c.score,c.col)}
      </div>
    </div>`;
  }).join('');

  // Category bars
  const CAT={experience:{e:'💼',g:'linear-gradient(90deg,#3b82f6,#22d3ee)'},skills:{e:'⚡',g:'linear-gradient(90deg,#22d3ee,#6366f1)'},education:{e:'🎓',g:'linear-gradient(90deg,#6366f1,#8b5cf6)'},presentation:{e:'✨',g:'linear-gradient(90deg,#8b5cf6,#60a5fa)'},relevance:{e:'🎯',g:'linear-gradient(90deg,#60a5fa,#22d3ee)'}};
  document.getElementById('catList').innerHTML=Object.entries(a.categoryScores).map(([k,v])=>{
    const m=CAT[k]||{e:'•',g:'#3b82f6'};
    return`<div class="cat-row">
      <div class="cat-hdr"><span class="cat-name">${m.e} ${k.charAt(0).toUpperCase()+k.slice(1)}</span><span class="cat-val">${v}%</span></div>
      <div class="cat-track"><div class="cat-fill" data-w="${v}" style="background:${m.g}"></div></div>
    </div>`;
  }).join('');
  requestAnimationFrame(()=>setTimeout(()=>document.querySelectorAll('.cat-fill').forEach(el=>el.style.width=el.dataset.w+'%'),80));

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(b=>{
    b.classList.toggle('active',b.dataset.tab==='overview');
    b.onclick=()=>{
      document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); renderTab(b.dataset.tab);
    };
  });
  renderTab('overview');
}

/* ─── TAB RENDERER ───────────────────────────────────────── */
const esc=s=>typeof s==='string'?s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'):'';
const md2h=s=>esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');

function blist(items,cls){
  return`<div class="bl">${items.map((s,i)=>`<div class="bi ${cls}" style="animation-delay:${i*.06}s"><span class="bdot"></span><span>${esc(s)}</span></div>`).join('')}</div>`;
}
function tags(items,cls){
  return`<div class="tags">${items.map((k,i)=>`<span class="tag ${cls}" style="animation-delay:${i*.04}s">${esc(k)}</span>`).join('')}</div>`;
}

function renderTab(t){
  const a=S.analysis;
  const tb=document.getElementById('tabBody');

  if(t==='overview'){
    tb.innerHTML=`
      <div class="panel p-blue">
        <p class="sum-txt">${esc(a.summary)}</p>
<div class="sal-row">
  <div class="sal-lbl">💰 ESTIMATED SALARY (${S.expLevel.toUpperCase()})</div>
  <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:6px">
    <div>
      <div style="font-size:10px;color:var(--tx3);letter-spacing:.08em;margin-bottom:2px">🇺🇸 UNITED STATES</div>
      <div class="sal-val">${esc(a.salaryRange)}</div>
      <div class="sal-desc">${esc(a.salaryDesc)}</div>
    </div>
    <div>
      <div style="font-size:10px;color:var(--tx3);letter-spacing:.08em;margin-bottom:2px">🇮🇳 INDIA</div>
      <div class="sal-val" style="color:#10b981">${esc(a.salaryInrRange)}</div>
      <div class="sal-desc">${esc(a.salaryInrDesc)}</div>
    </div>
  </div>
</div>      </div>
      <div class="mini-g">
        <div class="panel p-ok"><div class="ptitle" style="color:var(--cy)">✓ Strengths</div>${blist(a.strengths,'ok')}</div>
        <div class="panel p-or"><div class="ptitle" style="color:#fb923c">⚡ Improvements</div>${blist(a.improvements,'or')}</div>
      </div>
      <div class="panel p-info">
        <div class="ptitle">📊 Quick Stats</div>
        <div class="stat-pills">
          <span class="spill">${a.wordCount} words</span>
          <span class="spill ${a.hasQuantified?'s-ok':'s-warn'}">${a.hasQuantified?'✓ Quantified':'✗ No metrics'}</span>
          <span class="spill ${a.hasActionVerbs?'s-ok':'s-warn'}">${a.hasActionVerbs?'✓ Action verbs':'✗ Weak verbs'}</span>
          <span class="spill">${a.keywordsFound.length} keywords found</span>
          <span class="spill">${a.atsRules.filter(r=>r.pass).length}/${a.atsRules.length} ATS rules</span>
        </div>
      </div>`;

  } else if(t==='keywords'){
    tb.innerHTML=`
      <div class="panel p-ok"><div class="ptitle" style="color:var(--cy)">✓ Core Keywords Found (${a.keywordsFound.length})</div>${tags(a.keywordsFound,'t-ok')}</div>
      <div class="panel p-warn"><div class="ptitle" style="color:var(--warn)">✗ Missing Core Keywords (${a.keywordsMissing.length})</div>${tags(a.keywordsMissing,'t-warn')}<p class="panel-note">Add these naturally in your Skills section or experience bullets.</p></div>
      ${a.niceToHaveFound.length?`<div class="panel p-blue"><div class="ptitle" style="color:var(--b2)">⭐ Nice-to-Have Skills You Have (${a.niceToHaveFound.length})</div>${tags(a.niceToHaveFound,'t-blue')}</div>`:''}
      ${a.niceToHaveMissing.length?`<div class="panel p-info"><div class="ptitle">💡 Nice-to-Have Skills to Consider</div>${tags(a.niceToHaveMissing,'t-grey')}</div>`:''}`;

  } else if(t==='skills'){
    const pct=Math.round((a.keywordsFound.length/DOMAINS[S.domain].must.length)*100);
    tb.innerHTML=`
      <div class="panel p-blue">
        <div class="ptitle">🎯 Skill Match: ${pct}%</div>
        <div class="skill-meter"><div class="skill-fill" data-w="${pct}" style="background:linear-gradient(90deg,#3b82f6,#22d3ee)"></div></div>
        <div class="skill-labels"><span>${a.keywordsFound.length} matched</span><span>${a.keywordsMissing.length} missing</span></div>
      </div>
      <div class="panel p-err">
        <div class="ptitle" style="color:var(--err)">🔴 Critical Skills Gap</div>
        <p class="panel-note" style="margin-bottom:10px">These are must-have skills for ${DOMAINS[S.domain].label} roles. Add them to stand out.</p>
        ${blist(a.keywordsMissing.slice(0,8),'rd')}
      </div>
      <div class="panel p-info">
        <div class="ptitle">📚 How to Bridge the Gap</div>
        <div class="gap-steps">
          <div class="gap-step">1️⃣ <strong>Add to Skills section</strong> — list tools/technologies you know even partially</div>
          <div class="gap-step">2️⃣ <strong>Build a project</strong> — even a small side project using the missing tool counts</div>
          <div class="gap-step">3️⃣ <strong>Take a course</strong> — Coursera, Udemy, freeCodeCamp all offer free/cheap options</div>
          <div class="gap-step">4️⃣ <strong>Mirror job postings</strong> — use the exact phrasing from the job description</div>
        </div>
      </div>`;
    requestAnimationFrame(()=>setTimeout(()=>document.querySelectorAll('.skill-fill').forEach(el=>el.style.width=el.dataset.w+'%'),80));

  } else if(t==='ats'){
    const passed=a.atsRules.filter(r=>r.pass).length;
    tb.innerHTML=`
      <div style="display:flex;align-items:center;gap:16px;padding:16px 18px;border-radius:12px;background:linear-gradient(135deg,rgba(59,130,246,.1),rgba(34,211,238,.04));border:1px solid rgba(59,130,246,.22);margin-bottom:14px">
        <div style="font-size:44px;font-weight:900;background:linear-gradient(135deg,var(--b2),var(--cy));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${a.atsScore}</div>
        <div><div style="font-size:10px;color:var(--tx3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">ATS Score</div>
          <div style="font-size:13px;color:var(--tx2)">${passed} of ${a.atsRules.length} rules passed</div></div>
      </div>
      <div class="ats-list">
        ${a.atsRules.map((r,i)=>`<div class="ar ${r.pass?'pass':'fail'}" style="animation-delay:${i*.04}s">
          <span class="ar-ico">${r.pass?'✅':'❌'}</span>
          <div class="ar-body">
            <strong class="${r.pass?'c-ok':'c-err'}">${esc(r.name)}</strong>
            ${!r.pass?`<div class="ar-tip">💡 ${esc(r.tip)}</div>`:''}
          </div>
        </div>`).join('')}
      </div>`;

  } else if(t==='interview'){
    tb.innerHTML=`
      <div class="panel p-vi">
        <div class="ptitle" style="color:#8b5cf6">🎤 Personalized Interview Tips for ${DOMAINS[S.domain].label}</div>
        <div class="steps">${a.interviewTips.map((tip,i)=>`<div class="step" style="animation-delay:${i*.08}s"><div class="sn b">${i+1}</div><div class="st">${esc(tip)}</div></div>`).join('')}</div>
      </div>
      <div class="panel p-blue">
        <div class="ptitle">📋 Universal Behavioral Questions to Prepare</div>
        <div class="q-list">
          ${['Tell me about yourself — your 90-second professional story','Describe your biggest achievement and how you measured its impact','Tell me about a time you failed and what you learned','How do you handle disagreements with your manager or teammates?','Where do you see yourself in 3–5 years?','Why are you leaving your current role?'].map(q=>`<div class="q-item">❓ ${esc(q)}</div>`).join('')}
        </div>
      </div>`;

  } else if(t==='salary'){
    const sal=SALARY_INSIGHTS[S.domain]||SALARY_INSIGHTS.general;
    tb.innerHTML=`
      <div class="panel p-blue">
        <div class="ptitle">💰 Salary Ranges for ${DOMAINS[S.domain].label}</div>
        <div class="sal-grid">
          ${Object.entries(sal).map(([lvl,d])=>`<div class="sal-box ${lvl===S.expLevel?'active':''}">
            <div class="sb-level">${lvl.charAt(0).toUpperCase()+lvl.slice(1)}</div>
              <div class="sb-range">${d.range}</div>
                <div class="sb-range" style="font-size:15px;color:#10b981;margin-top:2px">${d.inr_range}</div>
                  <div class="sb-desc">${d.desc}</div>
                  <div class="sb-desc" style="margin-top:2px;color:#6ee7b7">${d.inr_desc}</div>
            ${lvl===S.expLevel?'<div class="sb-badge">📍 Your Level</div>':''}
          </div>`).join('')}
        </div>
      </div>
      <div class="panel p-ok">
        <div class="ptitle" style="color:var(--cy)">💡 Negotiation Strategy</div>
        <div class="neg-tips">
          <div class="neg-tip">🎯 <strong>Anchor high</strong> — Your first number should be 15–20% above your real target</div>
          <div class="neg-tip">📊 <strong>Back it with data</strong> — "Based on Glassdoor/LinkedIn Salary, the market rate is…"</div>
          <div class="neg-tip">⏰ <strong>Don't rush</strong> — Always ask for 24–48 hours to consider the offer</div>
          <div class="neg-tip">📦 <strong>Think total comp</strong> — bonus, equity, PTO, remote, learning budget all have value</div>
          <div class="neg-tip">✍️ <strong>Get it in writing</strong> — verbal offers don't count until they're signed</div>
        </div>
      </div>`;

  } else if(t==='tools'){
    const domLabel=DOMAINS[S.domain].label;
    tb.innerHTML=`
      <div class="tools-header">Choose a tool — all run offline in your browser</div>
      <div class="tools-grid">
        ${[{id:'cover',i:'✉️',n:'Cover Letter'},{id:'improve',i:'📈',n:'Quick Wins'},{id:'nextst',i:'🚀',n:'Next Steps'},{id:'linkedin',i:'💼',n:'LinkedIn Tips'},{id:'jdcheck',i:'🔍',n:'JD Checklist'}]
          .map(tc=>`<div class="tc" data-tool="${tc.id}"><div class="tc-i">${tc.i}</div><div class="tc-n">${tc.n}</div></div>`).join('')}
      </div>
      <div id="toolArea"></div>`;
    document.querySelectorAll('.tc').forEach(c=>c.addEventListener('click',()=>{
      document.querySelectorAll('.tc').forEach(x=>x.classList.remove('on'));
      c.classList.add('on'); renderTool(c.dataset.tool, domLabel);
    }));
  }
}

/* ─── OFFLINE TOOLS ──────────────────────────────────────── */
function renderTool(tool, domLabel){
  const area=document.getElementById('toolArea');
  const a=S.analysis;

  if(tool==='cover'){
    area.innerHTML=`
      <div class="t-form">
        <div class="fg">
          <div><label class="fl">Your Name</label><input class="fi" id="tName" placeholder="Jane Smith"/></div>
          <div><label class="fl">Company Name</label><input class="fi" id="tComp" placeholder="Acme Corp"/></div>
        </div>
        <div><label class="fl">Years of Experience</label><input class="fi" id="tYears" placeholder="e.g. 5" style="max-width:100px"/></div>
        <button class="btn-sm pr" id="tBtn">✉️ Generate Cover Letter</button>
      </div>
      <div id="tOut"></div>`;
    document.getElementById('tBtn').addEventListener('click',()=>{
      const name=document.getElementById('tName').value.trim()||'[Your Name]';
      const comp=document.getElementById('tComp').value.trim()||'[Company Name]';
      const yrs =document.getElementById('tYears').value.trim()||'several';
      const tmpl=COVER_LETTER[S.domain]||COVER_LETTER.general;
      const txt=tmpl(name,yrs,comp);
      const enc=btoa(encodeURIComponent(txt));
      document.getElementById('tOut').innerHTML=`
        <div class="t-out">${esc(txt)}</div>
        <button class="copy-btn" onclick="doCopy(this,'${enc}')">📋 Copy to Clipboard</button>
        <button class="copy-btn" style="margin-left:8px" onclick="dlText('Cover_Letter.txt','${enc}')">💾 Download .txt</button>`;
    });

  } else if(tool==='improve'){
    area.innerHTML=`<div class="t-out">${buildQuickWins(a, S.domain)}</div>`;

  } else if(tool==='nextst'){
    const ns=a.nextSteps||NEXT_STEPS[S.domain]||NEXT_STEPS.general;
    area.innerHTML=`
      <div class="panel p-cy">
        <div class="ptitle" style="color:var(--cy)">🚀 Your Personalised Action Plan</div>
        <div class="steps">${ns.map((s,i)=>`<div class="step" style="animation-delay:${i*.08}s"><div class="sn c">→</div><div class="st">${esc(s)}</div></div>`).join('')}</div>
      </div>
      <div class="panel p-blue" style="margin-top:14px">
        <div class="ptitle">🗓 Suggested 30-Day Plan</div>
        <div class="day-plan">
          <div class="dp"><span class="dp-label">Week 1</span><span>Update resume with missing keywords and quantified bullets</span></div>
          <div class="dp"><span class="dp-label">Week 2</span><span>Fix ATS issues and tailor for 3 specific job postings</span></div>
          <div class="dp"><span class="dp-label">Week 3</span><span>Build or update portfolio project using a missing skill</span></div>
          <div class="dp"><span class="dp-label">Week 4</span><span>Apply to 10+ positions, start interview prep, network actively</span></div>
        </div>
      </div>`;

  } else if(tool==='linkedin'){
    area.innerHTML=`
      <div class="panel p-blue">
        <div class="ptitle">💼 LinkedIn Optimization Checklist</div>
        <div class="li-list">
          ${[
            ['Profile Photo','Professional headshot (increases views by 21x)'],
            ['Headline','Not just your job title — add value prop. E.g. "Senior SWE | React & Node.js | Building scalable products"'],
            ['About Section','3–5 paragraphs: who you are, what you do, key wins, what you\'re looking for'],
            ['Open to Work','Turn on "Open to Work" — visible to recruiters only if desired'],
            ['Skills','Add top 10 skills from your domain analysis, ask connections to endorse them'],
            ['Featured Section','Pin your best project, article, or portfolio link at the top'],
            ['Activity','Post 2–3x per week: insights, projects, learnings — recruiters do check'],
            ['Connections','Aim for 500+ connections — quality > quantity, but more is better for search'],
            ['Recommendations','Get 2–3 from past managers/senior colleagues — gold for hiring managers'],
            ['Keywords','Mirror your resume keywords in headline, about, and experience sections'],
          ].map(([t,d])=>`<div class="li-item"><span class="li-ico">☐</span><div><strong>${esc(t)}</strong><div class="li-desc">${esc(d)}</div></div></div>`).join('')}
        </div>
      </div>`;

  } else if(tool==='jdcheck'){
    area.innerHTML=`
      <div class="panel p-info">
        <div class="ptitle">🔍 Job Description Checklist</div>
        <p class="panel-note" style="margin-bottom:14px">Before applying to any job, verify these items by comparing the JD to your resume:</p>
        <div class="jd-list">
          ${[
            'Does your resume headline/title match the job title?',
            'Have you included at least 70% of the required technical keywords?',
            'Does your most recent role clearly relate to what the JD asks for?',
            'Have you removed irrelevant experience to keep it under 2 pages?',
            'Is your resume tailored with language from this specific job description?',
            'Does your summary/objective mention the company or role type?',
            'Have you quantified at least 3 achievements relevant to this role?',
            'Does your education match the minimum requirements stated in the JD?',
            'Have you checked the company on Glassdoor for culture/red flags?',
            'Do you have a contact or referral at this company to boost your chances?',
          ].map((q,i)=>`<label class="jd-check"><input type="checkbox" id="jdc${i}"> <span>${esc(q)}</span></label>`).join('')}
        </div>
        <div style="margin-top:14px;font-size:12.5px;color:var(--tx3)" id="jdScore">Check items as you complete them ☝️</div>
      </div>`;
    document.querySelectorAll('[id^="jdc"]').forEach(cb=>{
      cb.addEventListener('change',()=>{
        const total=10,done=document.querySelectorAll('[id^="jdc"]:checked').length;
        document.getElementById('jdScore').textContent=`${done}/${total} complete — ${done>=8?'🟢 Ready to Apply!':done>=5?'🟡 Almost There':'🔴 Keep Going'}`;
      });
    });
  }
}

function buildQuickWins(a, domain){
  const wins=[];
  if(a.keywordsMissing.length>0) wins.push(`<strong>Add these keywords to your Skills section:</strong> ${a.keywordsMissing.slice(0,4).map(esc).join(', ')}`);
  if(!a.hasQuantified) wins.push('<strong>Add numbers to 3 bullets right now:</strong> Pick your 3 biggest wins and add %, $, or team size to each');
  if(!a.hasActionVerbs) wins.push('<strong>Replace weak phrases:</strong> "Responsible for" → "Led"; "Helped with" → "Collaborated on"; "Worked on" → "Developed"');
  if(a.atsScore<70){const fail=a.atsRules.filter(r=>!r.pass);wins.push(`<strong>Fix this ATS issue first:</strong> ${esc(fail[0]?.tip||'Review ATS tab')}`);}
  wins.push(`<strong>Tailor your summary:</strong> Add "${DOMAINS[domain].label}" and mention 2 of your strongest keywords in the first line`);
  wins.push('<strong>Reorder your bullets:</strong> Your highest-impact, most quantified bullet should be FIRST in each role');
  return`<div class="qw-list">${wins.map((w,i)=>`<div class="qw-item" style="animation-delay:${i*.08}s"><span class="qw-num">${i+1}</span><div>${w}</div></div>`).join('')}</div>`;
}

/* ─── COPY & DOWNLOAD HELPERS ────────────────────────────── */
window.doCopy=function(btn,b64){
  try{
    const txt=decodeURIComponent(atob(b64));
    navigator.clipboard.writeText(txt).then(()=>{btn.textContent='✓ Copied!';setTimeout(()=>btn.textContent='📋 Copy to Clipboard',2000);});
  }catch(e){btn.textContent='Copy failed';}
};
window.dlText=function(fname,b64){
  const txt=decodeURIComponent(atob(b64));
  const blob=new Blob([txt],{type:'text/plain'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fname;a.click();
};

/* ─── DOWNLOAD FULL REPORT ───────────────────────────────── */
document.getElementById('dlBtn').addEventListener('click',()=>{
  const a=S.analysis; if(!a)return;
  const dom=DOMAINS[S.domain]||{label:'General'};
  const sep='─'.repeat(60);
  const lines=[
    '═'.repeat(60),'  RESUMESCREENER PRO — OFFLINE ANALYSIS REPORT',
    `  Date      : ${new Date().toLocaleString()}`,
    `  Domain    : ${dom.label}`,`  Level     : ${S.expLevel}`,
    '═'.repeat(60),'',
    `OVERALL SCORE : ${a.overallScore}/100`,`ATS SCORE     : ${a.atsScore}/100`,'',
    sep,'  CATEGORY SCORES',sep,
    ...Object.entries(a.categoryScores).map(([k,v])=>`  ${k.padEnd(16)}: ${v}/100 ${'█'.repeat(Math.round(v/5))}${'░'.repeat(20-Math.round(v/5))}`),
    '','  Words: '+a.wordCount+' | Quantified: '+(a.hasQuantified?'Yes':'No')+' | Action Verbs: '+(a.hasActionVerbs?'Yes':'No'),
    '',sep,'  SUMMARY',sep,`  ${a.summary}`,`  Salary (US) : ${a.salaryRange}`,
`  Salary (IN) : ${a.salaryInrRange}`,'',
    sep,'  STRENGTHS',sep,...a.strengths.map((s,i)=>`  ${i+1}. ${s}`),'',
    sep,'  IMPROVEMENTS',sep,...a.improvements.map((s,i)=>`  ${i+1}. ${s}`),'',
    sep,'  KEYWORDS FOUND',sep,`  ${a.keywordsFound.join(', ')}`,'',
    sep,'  KEYWORDS MISSING',sep,`  ${a.keywordsMissing.join(', ')}`,'',
    sep,'  ATS AUDIT',sep,
    ...a.atsRules.map(r=>`  ${r.pass?'✅':'❌'} ${r.name}${!r.pass?' — '+r.tip:''}`),'',
    sep,'  INTERVIEW TIPS',sep,...a.interviewTips.map((t,i)=>`  ${i+1}. ${t}`),'',
    sep,'  NEXT STEPS',sep,...a.nextSteps.map((s,i)=>`  ${i+1}. ${s}`),'',
    '═'.repeat(60),'  ResumeScreener Pro · 100% Offline · No API Required','═'.repeat(60),
  ];
  const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=`ResumeReport_${S.domain}_${Date.now()}.txt`;link.click();
  URL.revokeObjectURL(url);
});

/* ─── OFFLINE CHAT BOT ───────────────────────────────────── */
(()=>{
  const panel=document.getElementById('chatPanel');
  const msgs=document.getElementById('chatMsgs');
  const input=document.getElementById('chatInput');

  function addMsg(role,text){
    const d=document.createElement('div');
    d.className=`mr ${role}`;
    d.innerHTML=`<div class="m-av">${role==='a'?'🤖':'👤'}</div>
      <div class="m-bub">${md2h(text)}</div>`;
    msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight;
  }

  addMsg('a',"Hi! I'm your offline Resume Tips Bot 🤖 I can answer questions about resume writing, ATS systems, keywords, formatting, salary negotiation, and interview prep — all without any internet connection! Try the quick buttons below or type your question.");

  function send(txt){
    txt=(txt||input.value).trim();
    if(!txt)return;
    input.value=''; input.style.height='auto';
    addMsg('u',txt);
    setTimeout(()=>{
      const reply=getChatResponse(txt);
      addMsg('a',reply);
    },300);
  }

  function toggle(){
    S.chatOpen=!S.chatOpen;
    panel.classList.toggle('open',S.chatOpen);
    document.getElementById('fabDot').style.display=S.chatOpen?'none':'flex';
    document.querySelector('.fab-ping').style.display=S.chatOpen?'none':'block';
    const ico=document.getElementById('fabIco');
    ico.outerHTML=S.chatOpen
      ?'<svg id="fabIco" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      :'<svg id="fabIco" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
    if(S.chatOpen) msgs.scrollTop=msgs.scrollHeight;
    document.getElementById('chatFab').addEventListener('click',toggle,{once:true});
  }

  document.getElementById('chatFab').addEventListener('click',toggle);
  document.getElementById('chatCls').addEventListener('click',toggle);
  document.getElementById('chatSend').addEventListener('click',()=>send());
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
  input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,90)+'px';});
  document.querySelectorAll('.qchip').forEach(b=>b.addEventListener('click',()=>send(b.dataset.q)));
})();
