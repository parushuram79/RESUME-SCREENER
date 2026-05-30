/* ═══════════════════════════════════════════════════════════
   engine.js  — 100% Offline Resume Analysis Engine
   No API · No Internet · Pure JavaScript Rule-Based Scoring
═══════════════════════════════════════════════════════════ */
'use strict';

/* ─── DOMAIN DEFINITIONS ─────────────────────────────────── */
const DOMAINS = {
  software: {
    label: 'Software Engineering',
    emoji: '💻',
    must: ['javascript','python','java','typescript','react','node','sql','git','api','docker','aws','linux','html','css','database','algorithm','software','engineer','developer','code','programming'],
    good: ['kubernetes','microservices','ci/cd','devops','graphql','redis','mongodb','postgresql','spring','angular','vue','golang','rust','scala','terraform','jenkins','testing','agile','scrum','system design','oop','data structures'],
    salary: { junior:[65,85], mid:[90,120], senior:[130,170], lead:[160,210] },
    roles: ['software engineer','backend developer','frontend developer','full stack','web developer','software developer','programmer']
  },
  data: {
    label: 'Data Science & ML',
    emoji: '📊',
    must: ['python','sql','machine learning','data','statistics','analysis','model','pandas','numpy','tensorflow','pytorch','scikit','r programming','visualization','jupyter','dataset'],
    good: ['deep learning','nlp','neural network','spark','hadoop','tableau','power bi','airflow','mlops','feature engineering','regression','classification','clustering','time series','a/b testing','etl','data pipeline','big data','kafka'],
    salary: { junior:[70,90], mid:[95,130], senior:[140,185], lead:[175,225] },
    roles: ['data scientist','data analyst','ml engineer','machine learning','data engineer','research scientist','ai engineer']
  },
  product: {
    label: 'Product Management',
    emoji: '🎯',
    must: ['product','roadmap','stakeholder','user','agile','scrum','metrics','kpi','strategy','launch','market','customer','requirements','prioritiz','backlog'],
    good: ['okr','a/b testing','user research','persona','sprint','mvp','go-to-market','competitive analysis','product lifecycle','revenue','retention','conversion','nps','user story','jira','confluence','sql','analytics'],
    salary: { junior:[75,95], mid:[100,135], senior:[145,190], lead:[180,240] },
    roles: ['product manager','product owner','program manager','project manager','product lead']
  },
  design: {
    label: 'UX/UI Design',
    emoji: '🎨',
    must: ['figma','design','user experience','ux','ui','wireframe','prototype','user research','usability','accessibility','interaction','visual'],
    good: ['sketch','adobe xd','invision','user testing','design system','typography','color theory','information architecture','responsive','mobile design','design thinking','a/b testing','heuristic','wcag','animation','framer'],
    salary: { junior:[60,80], mid:[85,115], senior:[120,160], lead:[150,200] },
    roles: ['ux designer','ui designer','product designer','interaction designer','visual designer','design lead']
  },
  devops: {
    label: 'DevOps / Cloud',
    emoji: '⚙️',
    must: ['kubernetes','docker','aws','linux','ci/cd','terraform','jenkins','ansible','cloud','devops','pipeline','infrastructure','monitoring','deployment','shell','bash'],
    good: ['gcp','azure','prometheus','grafana','helm','istio','nginx','elasticsearch','vault','packer','chef','puppet','sre','observability','incident','on-call','security','compliance','git','automation'],
    salary: { junior:[75,95], mid:[100,140], senior:[145,190], lead:[175,230] },
    roles: ['devops engineer','sre','cloud engineer','infrastructure engineer','platform engineer','reliability engineer']
  },
  marketing: {
    label: 'Digital Marketing',
    emoji: '📢',
    must: ['seo','marketing','campaign','analytics','social media','content','brand','email','digital','strategy','audience','engagement','conversion','traffic'],
    good: ['sem','ppc','google ads','facebook ads','hubspot','salesforce','crm','copywriting','growth hacking','lead generation','roi','ctr','cpa','funnel','landing page','a/b testing','influencer','pr','media','budget'],
    salary: { junior:[50,70], mid:[70,100], senior:[105,145], lead:[140,185] },
    roles: ['marketing manager','digital marketer','content strategist','growth marketer','seo specialist','brand manager']
  },
  finance: {
    label: 'Finance & Accounting',
    emoji: '💰',
    must: ['financial','accounting','budget','forecast','analysis','excel','gaap','audit','tax','revenue','cost','p&l','balance sheet','cash flow','cpa','cfa'],
    good: ['valuation','dcf','financial modeling','bloomberg','sap','oracle','quickbooks','erp','risk management','portfolio','investment','equity','debt','derivatives','compliance','sec','sox','ifrs','variance','reconciliation'],
    salary: { junior:[60,80], mid:[85,120], senior:[125,170], lead:[165,220] },
    roles: ['financial analyst','accountant','controller','cfo','treasurer','finance manager','investment analyst']
  },
  general: {
    label: 'General',
    emoji: '🌐',
    must: ['experience','skills','education','project','team','leadership','communication','problem solving','management','analysis','results','achievement'],
    good: ['collaboration','initiative','strategic','innovative','detail oriented','deadline','presentation','reporting','excel','microsoft','stakeholder','client','process','improvement'],
    salary: { junior:[50,70], mid:[70,100], senior:[105,140], lead:[140,180] },
    roles: ['manager','analyst','coordinator','specialist','consultant','director','executive']
  }
};

/* ─── ATS RULES ──────────────────────────────────────────── */
const ATS_RULES = [
  { name: 'Contact Information', check: t => /(\d{3}[\s.-]\d{3}|\d{10}|@gmail|@yahoo|@outlook|@hotmail|linkedin\.com|phone|email|mobile)/i.test(t), tip: 'Add phone, email, and LinkedIn URL' },
  { name: 'Email Address Present', check: t => /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(t), tip: 'Include a professional email address' },
  { name: 'Work Experience Section', check: t => /experience|employment|work history|professional background/i.test(t), tip: 'Add a clear "Work Experience" section heading' },
  { name: 'Education Section', check: t => /education|degree|university|college|bachelor|master|phd|diploma|certification/i.test(t), tip: 'Include an "Education" section' },
  { name: 'Skills Section', check: t => /skills|competencies|technologies|tools|expertise/i.test(t), tip: 'Add a dedicated "Skills" section' },
  { name: 'Bullet Points Used', check: t => (t.match(/^[\s]*[•\-\*\u2022\u2023]/m)||[]).length > 2, tip: 'Use bullet points for experience descriptions' },
  { name: 'Dates Included', check: t => /\b(20\d{2}|19\d{2})\b/.test(t), tip: 'Include dates for all positions (e.g. 2020–2023)' },
  { name: 'No Tables Detected', check: t => !/<table|colspan|rowspan|\|\s*\|/.test(t), tip: 'Remove tables — ATS systems cannot parse them' },
  { name: 'Appropriate Length', check: t => { const wc = t.split(/\s+/).length; return wc > 150 && wc < 1500; }, tip: 'Resume should be 300–700 words (1–2 pages)' },
  { name: 'Action Verbs Present', check: t => /\b(led|built|designed|developed|managed|created|implemented|achieved|improved|increased|reduced|launched|delivered|collaborated|analyzed|established|drove|spearheaded|optimized|architected|engineered)\b/i.test(t), tip: 'Start bullets with strong action verbs' },
  { name: 'Quantified Achievements', check: t => /\d+\s*(%|percent|million|thousand|users|customers|team|members|projects|years|months|revenue|saving|increase|decrease|performance)/i.test(t), tip: 'Add numbers: "Increased sales by 40%"' },
  { name: 'No Personal Pronouns', check: t => !(t.match(/\b(I am|I have|I was|my role|I led|I built)\b/gi)||[]).length > 3, tip: 'Avoid first-person pronouns in resume bullets' },
];

/* ─── INTERVIEW TIPS BY DOMAIN ───────────────────────────── */
const INTERVIEW_TIPS = {
  software: [
    'Prepare for coding challenges — practice on LeetCode daily (arrays, trees, dynamic programming)',
    'Study system design: be ready to design scalable systems like URL shortener, Twitter feed, or chat app',
    'Review your biggest technical projects — know complexity, trade-offs, and decisions made',
    'Brush up on OOP principles, SOLID, design patterns, and how you apply them',
    'Prepare behavioral STAR answers: times you debugged hard bugs, worked under pressure, or led a team',
    'Know your tech stack deeply — expect deep-dive questions on any tool on your resume',
  ],
  data: [
    'Review SQL deeply: window functions, CTEs, joins — expect live SQL challenges',
    'Be ready to explain ML models simply: when to use which algorithm and why',
    'Prepare a case study: walk through a complete data project end-to-end',
    'Know statistics basics: p-value, confidence intervals, A/B testing methodology',
    'Practice communicating insights to non-technical stakeholders clearly',
    'Expect a take-home analysis task — prepare your Python/R environment',
  ],
  product: [
    'Study product metrics: DAU/MAU, retention, NPS, conversion — know how to move them',
    'Practice product teardown: be ready to critique any popular app\'s UX and suggest improvements',
    'Prepare an estimation question: "How many piano tuners in Chicago?" — show structured thinking',
    'Have 2–3 product launches you\'ve owned with measurable outcomes ready to discuss',
    'Know how to prioritize features — RICE, MoSCoW, effort vs impact frameworks',
    'Practice cross-functional stories: how you aligned engineering, design, and business',
  ],
  design: [
    'Prepare your portfolio — curate 3–4 case studies showing process, not just final designs',
    'Walk through your design process: research → wireframe → prototype → test → iterate',
    'Be ready to critique a live product: UX issues, accessibility, visual hierarchy',
    'Discuss how you handle conflicting feedback from stakeholders and users',
    'Know WCAG 2.1 accessibility guidelines and how you apply them',
    'Show collaboration skills — how you work with engineers and PMs',
  ],
  devops: [
    'Be ready to explain your CI/CD pipeline from code commit to production deployment',
    'Review Kubernetes fundamentals: pods, deployments, services, ingress, RBAC',
    'Prepare incident response stories: how you diagnosed and resolved a major outage',
    'Know the 12-factor app methodology and cloud-native principles',
    'Study infrastructure-as-code best practices: modularity, state management in Terraform',
    'Be prepared for troubleshooting scenarios: "Production is down, walk me through it"',
  ],
  marketing: [
    'Bring campaign data: specific campaigns you ran, channels used, and ROI achieved',
    'Know your way around Google Analytics 4, Meta Ads Manager, and at least one CRM',
    'Prepare to discuss how you measure success and what metrics matter most for the role',
    'Show creative AND analytical skills — marketers need both in modern teams',
    'Have a portfolio of content, campaigns, or growth experiments ready to share',
    'Be ready to discuss a failed campaign and what you learned from it',
  ],
  finance: [
    'Practice mental math and financial ratios — expect quick calculation questions',
    'Be ready to walk through a DCF model or LBO analysis step-by-step',
    'Know the 3 financial statements and how changes in one affect the others',
    'Prepare deal/project stories with specific dollar impact you delivered',
    'Brush up on current market events and how they affect your target industry',
    'Study Excel shortcuts and financial modeling best practices',
  ],
  general: [
    'Prepare STAR stories for common behavioral questions: leadership, conflict, failure, success',
    'Research the company thoroughly — products, competitors, recent news, culture',
    'Prepare thoughtful questions to ask your interviewer about the role and team',
    'Practice concise answers: 2 minutes maximum per response',
    'Bring quantified examples of your biggest wins in previous roles',
    'Review your resume thoroughly — be ready to discuss anything on it in detail',
  ],
};

/* ─── NEXT STEPS BY DOMAIN ───────────────────────────────── */
const NEXT_STEPS = {
  software: [
    'Build 2–3 portfolio projects on GitHub that showcase your domain keywords',
    'Complete AWS Cloud Practitioner or Solutions Architect certification',
    'Contribute to open source — even small PRs show real collaboration skills',
    'Practice 30 minutes of LeetCode daily for the next 30 days',
    'Write technical blog posts — shows communication and depth of knowledge',
  ],
  data: [
    'Create a Kaggle portfolio with 2–3 end-to-end ML projects',
    'Earn a Google Data Analytics or IBM Data Science certificate',
    'Build a personal dashboard project using real public datasets',
    'Practice SQL on Mode Analytics or StrataScratch (interview-level problems)',
    'Write a blog post explaining a model or analysis you built',
  ],
  product: [
    'Build a side project and document the product decisions you made',
    'Earn a Product School or Reforge PM certification',
    'Write product teardowns on LinkedIn to showcase analytical thinking',
    'Shadow a PM or conduct 10 user interviews for a product you use',
    'Contribute to open-source product documentation or roadmaps',
  ],
  design: [
    'Redesign an existing app and add it to your portfolio with full case study',
    'Earn a Google UX Design Certificate (Coursera) or Nielsen Norman certification',
    'Participate in a 24-hour design challenge or redesign Sprint',
    'Build a personal design system and document it thoroughly',
    'Contribute accessibility improvements to open-source projects',
  ],
  devops: [
    'Earn AWS Solutions Architect Associate or GCP Professional Cloud Architect',
    'Build a complete CI/CD pipeline project on GitHub using GitHub Actions',
    'Set up a personal Kubernetes cluster (minikube/k3s) and deploy real apps',
    'Get Certified Kubernetes Administrator (CKA) — highly valued',
    'Write runbooks and incident response docs to show SRE mindset',
  ],
  marketing: [
    'Earn Google Analytics 4, Google Ads, or HubSpot Marketing certifications',
    'Start a personal newsletter or blog — demonstrate content skills firsthand',
    'Run a small personal project campaign with measurable results to share',
    'Build a portfolio of ad creatives, emails, or landing pages you\'ve produced',
    'Learn basic SQL — data-driven marketers are far more competitive',
  ],
  finance: [
    'Study CFA Level 1 or CPA exam — signals commitment to the field',
    'Build a 3-statement financial model from scratch on Excel and document it',
    'Follow and summarize 5 earnings calls to sharpen financial analysis skills',
    'Learn Power BI or Tableau for financial dashboards',
    'Network with 2 finance professionals per month via LinkedIn coffee chats',
  ],
  general: [
    'Tailor your resume for each application — match keywords from the job description',
    'Get 2–3 professional certifications relevant to your target role',
    'Update your LinkedIn profile to mirror your optimized resume',
    'Reach out to 5 professionals in your target role for informational interviews',
    'Build a personal website or portfolio to stand out from the crowd',
  ],
};

/* ─── SALARY DATA ────────────────────────────────────────── */
const SALARY_INSIGHTS = {
  software: {
    junior:  { range:'$65,000–$90,000',  desc:'Entry-level SWE roles at startups or mid-size companies' },
    mid:     { range:'$90,000–$130,000', desc:'2–5 years experience, strong individual contributor' },
    senior:  { range:'$130,000–$175,000',desc:'5+ years, tech lead capability, mentoring others' },
    lead:    { range:'$160,000–$220,000',desc:'Staff/Principal level, cross-team technical leadership' },
  },
  data: {
    junior:  { range:'$70,000–$95,000',  desc:'Data analyst to junior data scientist track' },
    mid:     { range:'$95,000–$135,000', desc:'Independent DS with shipping models to production' },
    senior:  { range:'$140,000–$190,000',desc:'Senior DS/MLE owning ML platform or key initiatives' },
    lead:    { range:'$175,000–$230,000',desc:'Staff MLE or Principal DS with org-wide impact' },
  },
  product: {
    junior:  { range:'$75,000–$100,000', desc:'APM or junior PM at startup or larger company' },
    mid:     { range:'$100,000–$140,000',desc:'PM owning a product or major feature area' },
    senior:  { range:'$145,000–$195,000',desc:'Senior PM owning a line of business' },
    lead:    { range:'$180,000–$250,000',desc:'Director of PM or Group PM with team leadership' },
  },
  design: {
    junior:  { range:'$60,000–$82,000',  desc:'Junior designer at agency or startup' },
    mid:     { range:'$85,000–$120,000', desc:'Mid-level UX/Product designer, owns features' },
    senior:  { range:'$120,000–$165,000',desc:'Senior designer, design system contributor' },
    lead:    { range:'$155,000–$210,000',desc:'Principal designer or Design Manager' },
  },
  devops: {
    junior:  { range:'$75,000–$100,000', desc:'Junior DevOps/Cloud engineer' },
    mid:     { range:'$100,000–$145,000',desc:'Cloud/DevOps engineer owning infrastructure' },
    senior:  { range:'$145,000–$195,000',desc:'Senior SRE or Platform engineer' },
    lead:    { range:'$175,000–$240,000',desc:'Staff/Principal SRE or Engineering Manager' },
  },
  marketing: {
    junior:  { range:'$50,000–$72,000',  desc:'Coordinator or specialist in digital marketing' },
    mid:     { range:'$72,000–$105,000', desc:'Marketing manager owning channels or campaigns' },
    senior:  { range:'$105,000–$150,000',desc:'Senior/Director-level marketing leader' },
    lead:    { range:'$145,000–$200,000',desc:'VP Marketing or CMO at growth-stage company' },
  },
  finance: {
    junior:  { range:'$60,000–$85,000',  desc:'Financial analyst or junior accountant' },
    mid:     { range:'$85,000–$125,000', desc:'Senior analyst or manager in finance' },
    senior:  { range:'$125,000–$175,000',desc:'Director of Finance or Controller' },
    lead:    { range:'$170,000–$250,000',desc:'VP Finance or CFO at mid-to-large company' },
  },
  general: {
    junior:  { range:'$50,000–$72,000',  desc:'Entry-level professional role' },
    mid:     { range:'$72,000–$105,000', desc:'Mid-level individual contributor' },
    senior:  { range:'$105,000–$145,000',desc:'Senior professional with team influence' },
    lead:    { range:'$140,000–$190,000',desc:'Manager or senior lead with team ownership' },
  },
};

/* ─── COVER LETTER TEMPLATES ─────────────────────────────── */
const COVER_LETTER = {
  software: (name, exp, company) => `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineering position at ${company}. With ${exp}+ years of experience building scalable, high-quality software systems, I am confident in my ability to contribute meaningfully to your engineering team from day one.

Throughout my career, I have developed a deep expertise in designing and delivering production-grade software solutions. I have consistently demonstrated my ability to tackle complex technical challenges, collaborate effectively within cross-functional teams, and deliver reliable systems that drive measurable business outcomes. My experience spans the full software development lifecycle — from system design and architecture through implementation, testing, and deployment.

What excites me most about ${company} is the opportunity to work on challenging technical problems alongside talented engineers. I am passionate about writing clean, maintainable code, improving system performance, and mentoring peers. I would welcome the opportunity to discuss how my background and skills align with your team's goals.

Thank you for your time and consideration. I look forward to the possibility of contributing to ${company}'s engineering excellence.

Sincerely,
${name}`,

  data: (name, exp, company) => `Dear Hiring Manager,

I am excited to apply for the Data Science/ML position at ${company}. With ${exp}+ years of experience turning complex datasets into actionable insights and production ML systems, I am eager to bring my analytical skills and technical expertise to your data team.

My background includes end-to-end ownership of machine learning projects — from data collection and feature engineering through model development, validation, and deployment to production. I am comfortable working with large-scale data infrastructure and have experience collaborating closely with engineering and product teams to translate business questions into data-driven solutions.

I am particularly drawn to ${company} because of its commitment to using data to drive meaningful decisions. I thrive in environments that value rigorous experimentation, intellectual curiosity, and continuous improvement. I would love the opportunity to discuss how I can help your team achieve its data science goals.

Thank you for considering my application. I look forward to speaking with you.

Best regards,
${name}`,

  general: (name, exp, company) => `Dear Hiring Manager,

I am writing to express my keen interest in joining ${company}. With ${exp}+ years of professional experience and a proven track record of delivering results, I am excited about the opportunity to contribute to your team.

Throughout my career, I have consistently demonstrated the ability to manage complex projects, collaborate across teams, and drive measurable outcomes. I bring strong analytical thinking, communication skills, and a proactive approach to problem-solving that I believe aligns well with ${company}'s goals and culture.

I am drawn to ${company} because of its reputation for innovation and the caliber of its team. I am confident that my background, work ethic, and commitment to excellence would make me a valuable addition. I would welcome the opportunity to discuss how my skills can contribute to your continued success.

Thank you for your time and consideration.

Sincerely,
${name}`,
};

/* ═══════════════════════════════════════════════════════════
   CORE SCORING ENGINE
═══════════════════════════════════════════════════════════ */
function analyzeResume(text, domainKey, expLevel) {
  const t = text.toLowerCase();
  const words = t.split(/\s+/);
  const wordCount = words.length;
  const domain = DOMAINS[domainKey] || DOMAINS.general;

  /* ── KEYWORD SCORING ── */
  const mustFound   = domain.must.filter(k => t.includes(k.toLowerCase()));
  const mustMissing = domain.must.filter(k => !t.includes(k.toLowerCase()));
  const goodFound   = domain.good.filter(k => t.includes(k.toLowerCase()));
  const goodMissing = domain.good.filter(k => !t.includes(k.toLowerCase()));

  const mustScore = Math.round((mustFound.length / domain.must.length) * 100);
  const goodScore = Math.round((goodFound.length / Math.min(domain.good.length, 15)) * 100);
  const keywordScore = Math.round(mustScore * 0.6 + goodScore * 0.4);

  /* ── EXPERIENCE SCORING ── */
  const hasQuantified = /\d+\s*(%|percent|million|thousand|users|customers|team|projects|years|months|revenue|saving|increase|decrease)/i.test(text);
  const hasActionVerbs = /\b(led|built|designed|developed|managed|created|implemented|achieved|improved|increased|reduced|launched|delivered|optimized|architected|engineered|spearheaded|drove|established)\b/i.test(text);
  const hasRoles = domain.roles.some(r => t.includes(r));
  const yearMatches = text.match(/\b(20\d{2})\b/g) || [];
  const uniqueYears = [...new Set(yearMatches)].length;
  const hasMultipleJobs = uniqueYears >= 2 || /experience|employment|position|role/gi.test(text);

  let expScore = 50;
  if (hasQuantified)   expScore += 20;
  if (hasActionVerbs)  expScore += 15;
  if (hasRoles)        expScore += 10;
  if (hasMultipleJobs) expScore += 10;
  if (wordCount > 300) expScore += 5;
  expScore = Math.min(expScore, 100);

  /* ── SKILLS SCORING ── */
  const skillsScore = Math.min(Math.round(keywordScore * 0.8 + (goodFound.length > 5 ? 20 : goodFound.length * 4)), 100);

  /* ── EDUCATION SCORING ── */
  const hasDegree = /bachelor|master|phd|mba|b\.s\.|m\.s\.|b\.e\.|b\.tech|m\.tech|degree|university|college|graduate/i.test(text);
  const hasCert   = /certif|aws|gcp|azure|pmp|cpa|cfa|cisco|comptia|google|microsoft certified/i.test(text);
  const hasGPA    = /gpa|grade point|4\.0|3\.[5-9]/i.test(text);
  let eduScore = hasDegree ? 60 : 30;
  if (hasCert) eduScore += 25;
  if (hasGPA)  eduScore += 15;
  eduScore = Math.min(eduScore, 100);

  /* ── PRESENTATION SCORING ── */
  const hasSections = /experience|education|skills|summary|objective|projects|certif/gi;
  const sectionCount = (text.match(hasSections) || []).length;
  const hasBullets   = (text.match(/^[\s]*[•\-\*]/m) || []).length > 0;
  const goodLength   = wordCount >= 200 && wordCount <= 900;
  const hasContact   = /email|phone|linkedin|@|\.com/i.test(text);

  let presScore = 40;
  presScore += Math.min(sectionCount * 8, 24);
  if (hasBullets) presScore += 15;
  if (goodLength) presScore += 10;
  if (hasContact) presScore += 11;
  presScore = Math.min(presScore, 100);

  /* ── RELEVANCE SCORING ── */
  const relevanceScore = Math.round(mustScore * 0.7 + (hasRoles ? 30 : 0));

  /* ── ATS SCORING ── */
  const atsRules = ATS_RULES.map(r => ({ ...r, pass: r.check(text) }));
  const atsPassed = atsRules.filter(r => r.pass).length;
  const atsScore  = Math.round((atsPassed / atsRules.length) * 100);

  /* ── OVERALL SCORE ── */
  const overallScore = Math.round(
    expScore  * 0.25 +
    skillsScore * 0.25 +
    eduScore  * 0.15 +
    presScore * 0.15 +
    relevanceScore * 0.1 +
    atsScore  * 0.1
  );

  /* ── SUMMARY GENERATION ── */
  const summary = buildSummary(overallScore, atsScore, mustFound, mustMissing, domain, expLevel, hasQuantified);

  /* ── STRENGTHS & IMPROVEMENTS ── */
  const strengths    = buildStrengths(mustFound, goodFound, hasQuantified, hasActionVerbs, hasDegree, hasCert, presScore, atsScore, domain);
  const improvements = buildImprovements(mustMissing, goodMissing, hasQuantified, hasActionVerbs, presScore, atsScore, wordCount);

  /* ── SALARY ── */
  const salaryInfo = SALARY_INSIGHTS[domainKey]?.[expLevel] || SALARY_INSIGHTS.general[expLevel];

  return {
    overallScore,
    atsScore,
    categoryScores: {
      experience:   expScore,
      skills:       skillsScore,
      education:    eduScore,
      presentation: presScore,
      relevance:    relevanceScore,
    },
    summary,
    salaryRange: salaryInfo.range,
    salaryDesc:  salaryInfo.desc,
    strengths,
    improvements,
    keywordsFound:   mustFound,
    keywordsMissing: mustMissing,
    niceToHaveFound:   goodFound,
    niceToHaveMissing: goodMissing.slice(0, 10),
    atsRules,
    interviewTips:      (INTERVIEW_TIPS[domainKey] || INTERVIEW_TIPS.general),
    nextSteps:          (NEXT_STEPS[domainKey] || NEXT_STEPS.general),
    wordCount,
    hasQuantified,
    hasActionVerbs,
  };
}

/* ─── SUMMARY BUILDER ────────────────────────────────────── */
function buildSummary(overall, ats, found, missing, domain, exp, quantified) {
  const level = overall >= 75 ? 'strong' : overall >= 55 ? 'solid' : 'developing';
  const keyword_pct = Math.round((found.length / domain.must.length) * 100);

  let s = `Your resume shows a ${level} foundation for ${domain.label} roles. `;

  if (keyword_pct >= 70) {
    s += `You have excellent keyword coverage (${found.length}/${domain.must.length} core terms), which should perform well in ATS systems. `;
  } else if (keyword_pct >= 40) {
    s += `You have moderate keyword coverage (${found.length}/${domain.must.length} core terms) — adding ${missing.slice(0,3).join(', ')} would strengthen your profile significantly. `;
  } else {
    s += `Your keyword coverage needs work (${found.length}/${domain.must.length} core terms) — focus on incorporating domain-specific language from job postings. `;
  }

  if (quantified) {
    s += `You do use quantified achievements, which is excellent for credibility.`;
  } else {
    s += `Adding quantified achievements (numbers, percentages, scale) would significantly boost your impact.`;
  }

  return s;
}

/* ─── STRENGTHS BUILDER ──────────────────────────────────── */
function buildStrengths(mustFound, goodFound, quantified, verbs, degree, cert, pres, ats, domain) {
  const s = [];
  if (mustFound.length >= domain.must.length * 0.6) s.push(`Strong domain keyword coverage: ${mustFound.slice(0,4).join(', ')} and more`);
  if (goodFound.length >= 4) s.push(`Good breadth of supporting skills: ${goodFound.slice(0,3).join(', ')}`);
  if (quantified) s.push('Uses quantified achievements to demonstrate measurable impact');
  if (verbs)      s.push('Strong action verbs present — resume reads with energy and ownership');
  if (degree)     s.push('Relevant educational background strengthens your candidacy');
  if (cert)       s.push('Professional certifications show ongoing commitment to growth');
  if (pres >= 70) s.push('Well-structured resume with clear sections and good formatting');
  if (ats >= 70)  s.push(`Good ATS compatibility score (${ats}%) — should pass automated screening`);
  if (s.length < 3) s.push('Resume has a clear professional structure');
  if (s.length < 4) s.push('Shows relevant professional background for the target domain');
  return s.slice(0, 5);
}

/* ─── IMPROVEMENTS BUILDER ───────────────────────────────── */
function buildImprovements(mustMissing, goodMissing, quantified, verbs, pres, ats, wc) {
  const s = [];
  if (mustMissing.length > 0) s.push(`Add critical missing keywords: ${mustMissing.slice(0,3).join(', ')}`);
  if (!quantified) s.push('Add quantified achievements — e.g. "Reduced load time by 40%", "Managed team of 8"');
  if (!verbs)      s.push('Start bullet points with strong action verbs: Led, Built, Optimized, Delivered');
  if (pres < 60)   s.push('Improve structure: ensure clear sections for Experience, Skills, Education, Summary');
  if (ats < 70)    s.push('Fix ATS issues: add contact info, dates, remove tables/columns if any');
  if (wc < 200)    s.push('Resume seems too short — expand your experience descriptions with context and results');
  if (wc > 1000)   s.push('Resume may be too long — aim for 1–2 pages maximum, focus on recent 10 years');
  if (goodMissing.length > 3) s.push(`Consider adding valued skills: ${goodMissing.slice(0,3).join(', ')}`);
  if (s.length < 3) s.push('Tailor this resume specifically to each job description you apply to');
  return s.slice(0, 5);
}

/* ─── OFFLINE CHAT BOT ───────────────────────────────────── */
const CHAT_KB = {
  how: `Here are the top ways to improve your resume score:
1. **Add missing keywords** from the domain analysis above
2. **Quantify everything** — "increased sales by 40%" beats "improved sales"
3. **Use strong action verbs** — Led, Built, Designed, Delivered, Optimized
4. **Fix ATS issues** — clear sections, no tables, include contact info
5. **Tailor for each job** — mirror keywords from the specific job description`,

  ats: `**ATS (Applicant Tracking System)** is software used by 98% of Fortune 500 companies to automatically screen resumes before a human sees them.

To pass ATS:
- Use exact keywords from the job posting
- Use standard section headings (Work Experience, Education, Skills)
- Avoid tables, columns, headers/footers, and graphics
- Include your contact info in plain text
- Submit as PDF or DOCX (not image)`,

  keywords: `**How to add keywords effectively:**

1. Read the job description carefully — highlight nouns and technical terms
2. Add those exact terms to your Skills section
3. Weave them naturally into your experience bullets
4. Don't stuff — use each keyword 2–3 times at most
5. Match the exact phrasing (e.g. "machine learning" vs "ML")

Check the Keywords tab in your analysis for specific missing terms!`,

  format: `**Best resume format:**

✅ **Reverse chronological** — most recent job first (preferred by 90% of hiring managers)
✅ **Single column** — ATS-friendly, easy to scan
✅ **Standard fonts** — Arial, Calibri, Georgia, or Garamond at 10–12pt
✅ **1–2 pages** — 1 page for <5 years, 2 pages max for senior roles
✅ **Clear sections** — Summary, Experience, Skills, Education

❌ No tables, no columns, no graphics, no photos`,

  salary: `**Salary negotiation tips:**

1. **Never give a number first** — ask "What's the budgeted range for this role?"
2. **Research the market** — use Glassdoor, Levels.fyi, LinkedIn Salary, Payscale
3. **Consider total comp** — base, bonus, equity, benefits, PTO
4. **Anchor high** — your first offer should be 15–20% above your target
5. **Get it in writing** — never leave negotiations verbal
6. **You can always negotiate** — 85% of employers have flexibility in their offers`,

  interview: `**Universal interview tips:**

1. **STAR method** — Situation, Task, Action, Result for all behavioral questions
2. **Research deeply** — company, product, competitors, recent news
3. **Prepare 5 stories** — leadership, conflict, failure, success, collaboration
4. **Ask great questions** — "What does success look like in 90 days?"
5. **Follow up** — send a thank-you email within 24 hours
6. **Practice out loud** — record yourself, listen back, improve`,

  default: `I'm your offline resume tips bot! I can help with:

- **"how"** — How to improve your score
- **"ats"** — What ATS is and how to beat it
- **"keywords"** — How to add the right keywords
- **"format"** — Best resume format
- **"salary"** — Salary negotiation tips
- **"interview"** — Interview preparation

Check the analysis tabs for your personalized insights!`,
};

function getChatResponse(msg) {
  const m = msg.toLowerCase();
  if (m.includes('improv') || m.includes('score') || m.includes('boost') || m.includes('better') || m === 'how') return CHAT_KB.how;
  if (m.includes('ats') || m.includes('applicant') || m.includes('track') || m.includes('system')) return CHAT_KB.ats;
  if (m.includes('keyword') || m.includes('term') || m.includes('word')) return CHAT_KB.keywords;
  if (m.includes('format') || m.includes('layout') || m.includes('design') || m.includes('structure')) return CHAT_KB.format;
  if (m.includes('salary') || m.includes('pay') || m.includes('negotiat') || m.includes('money') || m.includes('comp')) return CHAT_KB.salary;
  if (m.includes('interview') || m.includes('prep') || m.includes('question') || m.includes('star')) return CHAT_KB.interview;
  if (m.includes('hello') || m.includes('hi') || m.includes('hey')) return "Hi! 👋 I'm your offline Resume Tips Bot. Ask me anything about resumes, ATS, keywords, formatting, salary negotiation, or interview prep!";
  if (m.includes('thank')) return "You're welcome! 😊 Good luck with your job search — you've got this!";
  return CHAT_KB.default;
}