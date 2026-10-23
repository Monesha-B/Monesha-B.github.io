// ==========================================
// Skill Globe – 89 Unique Technologies (0 Duplicates)
// Fixed selection (no blinking), compact & even
// ==========================================

// ---- Tweakables ----
const SIZE_MULT     = 1.55;  // overall globe scale
const WIDTH_CONST   = 0.40;  // constant sprite width in world units
const PACK_DENSITY  = 1.0;   // 1.0 = exactly 89 unique tools (0 duplicates)
const RELAX_ITERS   = 100;   // more = more even spacing
const RELAX_STEP    = 0.14;  // relax step size (0.08–0.16)
const VIEW_MARGIN   = 1.16;  // camera breathing room
const EXTRA_PADDING = 0.50;  // label overhang beyond sphere
const OP_FRONT      = 1.00;  // front opacity
const OP_BACK       = 0.15;  // back opacity

// Label texture crispness
const MIN_FONT_PX   = 84;
const MAX_FONT_PX   = 270;
const BASE_CANVAS_W = 720;
const LABEL_MARGIN  = 14;

// Spin profile (?speed=slow|normal|fast)
function getSpinProfile() {
  const sp = (new URLSearchParams(location.search).get('speed') || 'slow').toLowerCase();
  const t = {
    slow:   { SPEED: 0.06, PHASE_DUR: 7.5, DRAG_SENS: 0.003, DAMPING: 0.92 },
    normal: { SPEED: 0.12, PHASE_DUR: 6.0, DRAG_SENS: 0.004, DAMPING: 0.93 },
    fast:   { SPEED: 0.20, PHASE_DUR: 5.0, DRAG_SENS: 0.005, DAMPING: 0.95 }
  };
  return t[sp] || t.slow;
}
const SPIN = getSpinProfile();

// ---- Theme detection ----
function getThemeMode() {
  const p = new URLSearchParams(location.search).get('theme');
  if (p === 'dark' || p === 'light') return p;
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  const html = document.documentElement, body = document.body;
  if (html.classList.contains('dark') || body.classList.contains('dark')) return 'dark';
  if (html.classList.contains('light') || body.classList.contains('light')) return 'light';
  try {
    if (window.parent && window.parent !== window) {
      const pDoc = window.parent.document;
      if (pDoc.documentElement.classList.contains('dark') || pDoc.body.classList.contains('dark')) return 'dark';
      if (pDoc.documentElement.getAttribute('data-theme') === 'dark') return 'dark';
    }
  } catch(e){}
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}
function getThemeColors() {
  const isDark = getThemeMode() === 'dark';
  return {
    labelColor:  isDark ? '#e6e6e6' : '#1a1a1a',
    labelStroke: isDark ? 'rgba(0,0,0,0.40)' : 'rgba(255,255,255,0.55)',
    iconColor:   isDark ? 'cdcdcd' : '262626' // simpleicons hex w/o '#'
  };
}

// ---- THREE setup ----
const container = document.getElementById('globe');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const globe = new THREE.Group();
globe.scale.set(SIZE_MULT, SIZE_MULT, SIZE_MULT);
scene.add(globe);

// ==========================================
// 89 Unique Technologies & Frameworks
// ==========================================
const ICONS = [
  // 1. AI Agents & LLM Frameworks (8)
  { slug: 'langchain', name: 'LangChain' },
  { slug: 'huggingface', name: 'Hugging Face' },
  { slug: 'pydantic', name: 'Pydantic' },
  { slug: 'ollama', name: 'Ollama' },
  { slug: 'anthropic', name: 'Anthropic' },
  { slug: 'meta', name: 'Meta (LLaMA)' },
  { slug: 'google', name: 'Google (Gemini)' },
  { slug: 'openai', name: 'OpenAI' },

  // 2. Machine Learning & Deep Learning (7)
  { slug: 'pytorch', name: 'PyTorch' },
  { slug: 'scikitlearn', name: 'scikit-learn' },
  { slug: 'tensorflow', name: 'TensorFlow' },
  { slug: 'keras', name: 'Keras' },
  { slug: 'mlflow', name: 'MLflow' },
  { slug: 'spacy', name: 'spaCy' },
  { slug: 'opencv', name: 'OpenCV' },

  // 3. Data Science & Analytics (10)
  { slug: 'python', name: 'Python' },
  { slug: 'pandas', name: 'Pandas' },
  { slug: 'numpy', name: 'NumPy' },
  { slug: 'scipy', name: 'SciPy' },
  { slug: 'matplotlib', name: 'Matplotlib' },
  { slug: 'plotly', name: 'Plotly' },
  { slug: 'jupyter', name: 'Jupyter' },
  { slug: 'anaconda', name: 'Anaconda' },
  { slug: 'tableau', name: 'Tableau' },
  { slug: 'powerbi', name: 'Power BI' },

  // 4. Big Data, Streaming & Vector Databases (10)
  { slug: 'apachespark', name: 'Apache Spark' },
  { slug: 'apachekafka', name: 'Apache Kafka' },
  { slug: 'apachehadoop', name: 'Apache Hadoop' },
  { slug: 'apachecassandra', name: 'Apache Cassandra' },
  { slug: 'apacheairflow', name: 'Apache Airflow' },
  { slug: 'dbt', name: 'dbt' },
  { slug: 'qdrant', name: 'Qdrant' },
  { slug: 'neo4j', name: 'Neo4j' },
  { slug: 'databricks', name: 'Databricks' },
  { slug: 'snowflake', name: 'Snowflake' },

  // 5. Databases & In-Memory Stores (7)
  { slug: 'postgresql', name: 'PostgreSQL' },
  { slug: 'mysql', name: 'MySQL' },
  { slug: 'mongodb', name: 'MongoDB' },
  { slug: 'redis', name: 'Redis' },
  { slug: 'elasticsearch', name: 'Elasticsearch' },
  { slug: 'microsoftsqlserver', name: 'MS SQL Server' },
  { slug: 'sqlite', name: 'SQLite' },

  // 6. Backend, APIs & Cloud Services (12)
  { slug: 'fastapi', name: 'FastAPI' },
  { slug: 'flask', name: 'Flask' },
  { slug: 'streamlit', name: 'Streamlit' },
  { slug: 'nodedotjs', name: 'Node.js' },
  { slug: 'django', name: 'Django' },
  { slug: 'apache', name: 'Apache' },
  { slug: 'nginx', name: 'NGINX' },
  { slug: 'openapiinitiative', name: 'OpenAPI' },
  { slug: 'amazonaws', name: 'AWS' },
  { slug: 'microsoftazure', name: 'Microsoft Azure' },
  { slug: 'googlecloud', name: 'Google Cloud' },
  { slug: 'cloudflare', name: 'Cloudflare' },

  // 7. DevOps, CI/CD & Testing (10)
  { slug: 'docker', name: 'Docker' },
  { slug: 'kubernetes', name: 'Kubernetes' },
  { slug: 'jenkins', name: 'Jenkins' },
  { slug: 'githubactions', name: 'GitHub Actions' },
  { slug: 'pytest', name: 'Pytest' },
  { slug: 'git', name: 'Git' },
  { slug: 'github', name: 'GitHub' },
  { slug: 'linux', name: 'Linux' },
  { slug: 'ubuntu', name: 'Ubuntu' },
  { slug: 'veritas', name: 'Veritas' },

  // 8. Languages, Frontend & Developer Tools (25)
  { slug: 'javascript', name: 'JavaScript' },
  { slug: 'typescript', name: 'TypeScript' },
  { slug: 'html5', name: 'HTML5' },
  { slug: 'css3', name: 'CSS3' },
  { slug: 'react', name: 'React' },
  { slug: 'angular', name: 'Angular' },
  { slug: 'nextdotjs', name: 'Next.js' },
  { slug: 'bootstrap', name: 'Bootstrap' },
  { slug: 'threedotjs', name: 'Three.js' },
  { slug: 'tailwindcss', name: 'Tailwind CSS' },
  { slug: 'sass', name: 'Sass' },
  { slug: 'mui', name: 'MUI' },
  { slug: 'java', name: 'Java' },
  { slug: 'cplusplus', name: 'C++' },
  { slug: 'visualstudiocode', name: 'VS Code' },
  { slug: 'postman', name: 'Postman' },
  { slug: 'figma', name: 'Figma' },
  { slug: 'balsamiq', name: 'Balsamiq' },
  { slug: 'moqups', name: 'Moqups' },
  { slug: 'wireshark', name: 'Wireshark' },
  { slug: 'openssl', name: 'OpenSSL' },
  { slug: 'owasp', name: 'OWASP' },
  { slug: 'jira', name: 'Jira' },
  { slug: 'istio', name: 'Istio' },
  { slug: 'servicenow', name: 'ServiceNow' }
];

// Offline / trademark SVG paths for brands without standard SimpleIcons CDN endpoints
const SVG_ICONS = {
  openai: 'M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.484a4.485 4.485 0 0 1 2.37-2.013V12.1a.765.765 0 0 0 .388.677l5.82 3.37-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 8.484zm16.597 3.855l-5.833-3.387L15.119 7.78a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.674 8.163v-5.698a.79.79 0 0 0-.409-.7zM20.25 7.42l-.142-.085-4.773-2.782a.776.776 0 0 0-.785 0L8.707 7.922V5.59a.08.08 0 0 1 .033-.062l4.84-2.796a4.5 4.5 0 0 1 6.67 4.688zM8.94 13.916l-2.02-1.168a.071.071 0 0 1-.038-.052V7.113a4.504 4.504 0 0 1 7.37-3.454l-.142.081-4.779 2.758a.795.795 0 0 0-.391.681zm1.11-2.378l2.95-1.704 2.95 1.704v3.407l-2.95 1.704-2.95-1.704z',
  matplotlib: 'M3 3v18h18V3H3zm16 16H5V5h14v14zm-8-2h2v-6h-2v6zm-4 0h2v-3H7v3zm8 0h2v-9h-2v9z',
  tableau: 'M11.5 2v3h1V2h-1zm-6 3v2.5h-3v1h3V11h1V8.5h3v-1h-3V5h-1zm12 0v2.5h-3v1h3V11h1V8.5h3v-1h-3V5h-1zm-6 3v3.5h-3.5v1H11.5V16h1v-3.5H16v-1h-3.5V8h-1zm-6 6v2.5h-3v1h3V20h1v-2.5h3v-1h-3V14h-1zm12 0v2.5h-3v1h3V20h1v-2.5h3v-1h-3V14h-1zm-6 5v3h1v-3h-1z',
  powerbi: 'M7 11h2v9H7v-9zm4-5h2v14h-2V6zm4 3h2v11h-2V9zm4 7h2v4h-2v-4zM3 14h2v6H3v-6z',
  dbt: 'M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.8l7.2 3.6-7.2 3.6-7.2-3.6L12 4.8zm-8 4.6l7 3.5v7.3l-7-3.5V9.4zm16 7.3l-7 3.5v-7.3l7-3.5v7.3z',
  microsoftsqlserver: 'M12 2C6.48 2 2 4.02 2 6.5s4.48 4.5 10 4.5 10-2.02 10-4.5S17.52 2 12 2zm0 6.5c-4.41 0-8-1.34-8-2.5s3.59-2.5 8-2.5 8 1.34 8 2.5-3.59 2.5-8 2.5zm10 2.5c0 1.25-1.15 2.37-3.08 3.16-1.92.79-4.45 1.34-6.92 1.34s-5-.55-6.92-1.34C3.15 13.37 2 12.25 2 11v4c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5v-4zm0 6.5c0 1.25-1.15 2.37-3.08 3.16-1.92.79-4.45 1.34-6.92 1.34s-5-.55-6.92-1.34C3.15 19.87 2 18.75 2 17.5v4c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5v-4z',
  amazonaws: 'M6.763 10.03c0 .215.112.43.338.43.113 0 .226-.054.338-.162l.9-.915c.17-.162.17-.376 0-.538-.96-1.022-2.146-1.56-3.5-1.56-2.597 0-4.46 1.883-4.46 4.626 0 2.85 1.976 4.734 4.685 4.734 1.412 0 2.597-.538 3.557-1.506.17-.162.17-.377 0-.538l-.9-.915a.442.442 0 0 0-.338-.162c-.226 0-.339.215-.452.323-.734.753-1.468 1.076-2.258 1.076-1.75 0-2.88-1.29-2.88-3.012 0-1.72 1.073-2.958 2.71-2.958.847 0 1.637.377 2.258 1.076zm7.227-2.69h-1.637c-.226 0-.395.162-.395.377v8.608c0 .215.17.376.395.376h1.637c.226 0 .396-.161.396-.376V7.717c0-.215-.17-.377-.396-.377zm6.662 0h-1.637c-.226 0-.395.162-.395.377v8.608c0 .215.17.376.395.376h1.637c.226 0 .396-.161.396-.376V7.717c0-.215-.17-.377-.396-.377zM.156 20.892c5.985 3.013 13.72 3.12 19.873-.377.282-.161.508-.376.339-.753-.17-.376-.452-.269-.734-.107-5.703 3.227-12.873 3.12-18.463-.323-.395-.269-.677.054-.847.43-.113.377.057.807.452.958l-.62-.828zm21.34-1.99c.395-.484 1.863-2.205 2.146-2.904.056-.162-.057-.323-.226-.323-.452.054-2.88 1.076-3.444 1.291-.282.108-.339.377-.057.538.508.323 1.298.861 1.581 1.398z',
  microsoftazure: 'M5.483 21.3H.242a.24.24 0 0 1-.21-.355L7.96 4.398a.24.24 0 0 1 .21-.137h5.241a.24.24 0 0 1 .21.355L5.693 21.163a.24.24 0 0 1-.21.137zm3.181-7.234l3.195-6.262 4.417 13.14a.24.24 0 0 1-.227.316h-4.83a.24.24 0 0 1-.22-.143l-2.335-7.051zm7.126 7.234h7.968a.24.24 0 0 0 .227-.317l-4.137-12.308a.24.24 0 0 0-.227-.163h-4.484a.24.24 0 0 0-.215.347l3.868 12.441z',
  java: 'M8.851 18.56s-.917.534.667.72c2.209.26 3.69-.25 3.69-.25s-1.52.48-3.957.25c-2.316-.217-1.125-1.02-1.125-1.02zm1.258-2.616s-2.083.7-1.083 1.217c1.333.684 4.583.333 4.583.333s-3.583.383-5.25-.333c-1.375-.584.5-1.467.5-1.467zm-1.083-2.617s-2.583.85-.917 1.55c2.083.867 6.417.383 6.417.383s-4.833.483-7.25-.383c-1.833-.65.5-1.75.5-1.75zm1.5-3.05s-2.083.883-.333 1.55c2.333.9 6.833.417 6.833.417s-5.25.483-7.75-.417c-2.083-.75.083-1.75.083-1.75zm3.667-3.967s.667 1.083-1.667 2.75c-1.833 1.333-1.083 2.583-.083 3.583.583.583 1.25.917 1.25.917s-.667-.583-1.167-1.083c-.833-.833-.917-1.75.083-2.75 1.5-1.5 1.583-3.417 1.583-3.417zm3.167 1.417s1.333 1.333-1.5 3.667c-2.25 1.833-.833 3.25-.833 3.25s-.833-.917-.417-1.917c.583-1.333 2.25-2.25 2.25-3.5 0-1.167-.75-2.417-.75-2.417zm-11.458 14.1s.75.417 2.583.417c3.167 0 6.583-.75 6.583-.75s-2.417.583-5.75.583c-2.333 0-3.416-.25-3.416-.25zm12.333-2.083c1.75-.917 2.083-2.333 2.083-2.333s-.333 1.083-2.083 1.833c-1.417.617-3.083.833-3.083.833s1.75-.083 3.083-.333z',
  balsamiq: 'M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 4v10h12V7H6zm2 2h8v2H8V9zm0 4h5v2H8v-2z',
  servicenow: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z'
};

// Aliases for CDN slugs
const SLUG_ALIASES = {
  css3: 'css',
  visualstudiocode: 'vscodium'
};

// ---- Sphere & camera helpers ----
const SPHERE_RADIUS = 2.05;

function fitCameraToGlobe() {
  const R = SPHERE_RADIUS * SIZE_MULT + EXTRA_PADDING;
  const fovRad = THREE.MathUtils.degToRad(camera.fov);
  const neededHeight = (2 * R) * VIEW_MARGIN;
  const z = neededHeight / (2 * Math.tan(fovRad / 2));
  camera.position.set(0, 0, z);
  camera.lookAt(0,0,0);
}

function fibonacciSphere(n, radius=SPHERE_RADIUS){
  const pts=[], off=2/n, inc=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<n;i++){
    const y=i*off-1+off/2, r=Math.sqrt(1-y*y), phi=i*inc;
    pts.push(new THREE.Vector3(Math.cos(phi)*r*radius, y*radius, Math.sin(phi)*r*radius));
  }
  return pts;
}

// approximate min angular span of a billboard width w on sphere radius R
function widthToMinArcRad(w=WIDTH_CONST, R=SPHERE_RADIUS){
  const half = Math.min(0.49, (w*0.55) / R); // label height fudge
  return 2 * Math.asin(half);
}

// Blue-noise style relax with hard min angular separation
function relaxOnSphere(points, minArcRad, iters=RELAX_ITERS, step=RELAX_STEP){
  const r = SPHERE_RADIUS;
  for(let it=0; it<iters; it++){
    for(let i=0;i<points.length;i++){
      let pi = points[i];
      const ni = pi.clone().normalize();
      for(let j=i+1;j<points.length;j++){
        let pj = points[j];
        const nj = pj.clone().normalize();
        const cosang = ni.dot(nj);
        const ang = Math.acos(Math.min(1, Math.max(-1, cosang)));
        if(ang < minArcRad){
          // push apart on tangent planes
          const dirIJ = pj.clone().sub(pi).normalize();
          const ti = dirIJ.clone().sub(ni.multiplyScalar(dirIJ.dot(ni))).normalize();
          const tj = pi.clone().sub(pj).normalize();
          const tjTan = tj.clone().sub(nj.multiplyScalar(tj.dot(nj))).normalize();
          const mag = (minArcRad - ang) / minArcRad * step * r;
          pi.add(ti.multiplyScalar(-mag)).setLength(r);
          pj.add(tjTan.multiplyScalar(-mag)).setLength(r);
        }
      }
    }
  }
  return points;
}

// ---- Assets / textures ----
function getIconUrl(slug, colorHex) {
  if (SVG_ICONS[slug]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><path fill="#${colorHex}" d="${SVG_ICONS[slug]}"/></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const resolvedSlug = SLUG_ALIASES[slug] || slug;
  return `https://cdn.simpleicons.org/${resolvedSlug}/${colorHex}`;
}

function loadImage(url){
  return new Promise((res,rej)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>res(img);
    img.onerror = ()=>rej(new Error('Icon load failed: '+url));
    img.src = url;
  });
}

function fitLabel(ctx, text, maxWidth, targetPx){
  let size = Math.min(MAX_FONT_PX, targetPx);
  for(; size >= MIN_FONT_PX; size--){
    ctx.font = `600 ${size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return MIN_FONT_PX;
}

async function makeIconLabelTexture(slug, label, desiredCanvasWidth = BASE_CANVAS_W){
  const colors = getThemeColors();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw  = Math.round(desiredCanvasWidth * dpr);
  const PAD = Math.round(16 * dpr);
  const GAP = Math.round(LABEL_MARGIN * dpr);

  const textMaxW = cw - PAD*2;
  const targetPx = Math.round(168 * dpr);

  const measure  = document.createElement('canvas').getContext('2d');
  const chosenPx = fitLabel(measure, label, textMaxW, targetPx);
  measure.font = `600 ${chosenPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const m = measure.measureText(label);
  const ascent  = Math.max(m.actualBoundingBoxAscent || chosenPx*0.8,  1);
  const descent = Math.max(m.actualBoundingBoxDescent || chosenPx*0.25, 1);

  const ICON = Math.round(cw * 0.58);
  const ch = PAD + ICON + GAP + ascent + descent + PAD;

  const canvas = document.createElement('canvas');
  canvas.width  = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  let img = null;
  try {
    img = await loadImage(getIconUrl(slug, colors.iconColor));
  } catch (err) {
    console.warn('Icon load failed for', slug, err);
  }

  if (img) {
    const s = Math.min(ICON / img.width, ICON / img.height);
    const w = Math.round(img.width * s), h = Math.round(img.height * s);
    const x = Math.round((cw - w)/2), y = PAD + Math.round((ICON - h)/2);
    ctx.drawImage(img, x, y, w, h);
  } else {
    // Graceful monogram fallback if network fails
    ctx.fillStyle = colors.labelStroke;
    ctx.beginPath();
    ctx.arc(cw / 2, PAD + ICON / 2, ICON * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.labelColor;
    ctx.font = `700 ${Math.round(ICON * 0.4)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((label[0] || '?').toUpperCase(), cw / 2, PAD + ICON / 2);
  }

  ctx.font = `600 ${chosenPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const cx = Math.round(cw / 2), baselineY = PAD + ICON + GAP + ascent;
  ctx.lineWidth = Math.max(2, Math.round(chosenPx/15));
  ctx.strokeStyle = colors.labelStroke;
  ctx.strokeText(label, cx, baselineY);
  ctx.fillStyle = colors.labelColor;
  ctx.fillText(label, cx, baselineY);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  return { texture, aspect: canvas.width / canvas.height };
}

// ---- Build sprites ONCE (fixed), no per-frame selection ----
let SPRITES = [];
async function buildSprites(){
  // clear old
  SPRITES.forEach(s => globe.remove(s)); SPRITES = [];

  const ALL = ICONS.map(x => ({ slug:x.slug, label:x.name }));
  const TOTAL = Math.max(1, Math.round(ALL.length * PACK_DENSITY));

  // generate & relax points
  let points = fibonacciSphere(TOTAL);
  const minArcRad = Math.max(THREE.MathUtils.degToRad(10), widthToMinArcRad(WIDTH_CONST, SPHERE_RADIUS));
  points = relaxOnSphere(points, minArcRad, RELAX_ITERS, RELAX_STEP);

  // random offset so the sequence of icons varies each load
  const offset = Math.floor(Math.random() * ALL.length);

  // Load all textures in parallel for fast rendering
  const results = await Promise.all(
    points.map((pt, i) => {
      const { slug, label } = ALL[(i + offset) % ALL.length];
      return makeIconLabelTexture(slug, label, BASE_CANVAS_W)
        .then(res => ({ ...res, slug, label, pt }))
        .catch(e => {
          console.warn('Failed to render', slug || label, e);
          return null;
        });
    })
  );

  for (const item of results) {
    if (!item) continue;
    const { texture, aspect, slug, label, pt } = item;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent:true, depthTest:true, opacity: 1.0 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(WIDTH_CONST, WIDTH_CONST / aspect, 1);
    sprite.position.copy(pt);
    sprite.userData = { slug, label, aspect };
    globe.add(sprite);
    SPRITES.push(sprite);
  }
}

// ---- Depth fade (smooth, no toggling) ----
const tmp = new THREE.Vector3();
function depthFactorFromDistance(d){
  const R = SPHERE_RADIUS * SIZE_MULT + EXTRA_PADDING;
  const camDist = camera.position.length();
  const NEAR = Math.max(0.0001, camDist - R);
  const FAR  = camDist + R;
  const t = (d - NEAR) / (FAR - NEAR);
  const c = Math.max(0, Math.min(1, 1 - t));
  return c*c*(3 - 2*c);
}

// ---- Interaction + spin (only rotation changes) ----
let dragging=false, lastX=0, lastY=0, velX=0, velY=0, userActive=false;
container.addEventListener('pointerdown', e => { dragging=true; userActive=true; lastX=e.clientX; lastY=e.clientY; });
window.addEventListener('pointermove', e => {
  if(!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX=e.clientX; lastY=e.clientY;
  const s = SPIN.DRAG_SENS;
  globe.rotation.y += dx * s;
  globe.rotation.x += dy * s;
  velY = dx * s * 0.95;
  velX = dy * s * 0.95;
});
window.addEventListener('pointerup', ()=>{ dragging=false; setTimeout(()=>{ userActive=false; snapPhaseToVelocity(); }, 200); });

const DIAGONALS = [ {sx:+1,sy:+1}, {sx:-1,sy:-1}, {sx:+1,sy:-1}, {sx:-1,sy:+1} ];
let phaseIndex=0, phaseElapsed=0;
const { PHASE_DUR, SPEED } = getSpinProfile();
const clock = new THREE.Clock();

function stepScheduler(dt){
  if (userActive) return;
  const {sx,sy}=DIAGONALS[phaseIndex];
  globe.rotation.y += (SPEED * sy) * dt;
  globe.rotation.x += (SPEED * sx) * dt;
  phaseElapsed += dt;
  if (phaseElapsed >= PHASE_DUR){ phaseElapsed=0; phaseIndex=(phaseIndex+1)%DIAGONALS.length; }
}
function snapPhaseToVelocity(){
  if (Math.abs(velX) < 0.0001 && Math.abs(velY) < 0.0001) return;
  const sx = Math.sign(velX) || 1, sy = Math.sign(velY) || 1;
  let best=0, bestDot=-Infinity;
  DIAGONALS.forEach((d,i)=>{ const dot=d.sx*sx + d.sy*sy; if(dot>bestDot){bestDot=dot; best=i;} });
  phaseIndex=best; phaseElapsed=0;
}

// ---- Animate (no selection changes) ----
function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if(!dragging && userActive){
    globe.rotation.y += velY; velY *= SPIN.DAMPING;
    globe.rotation.x += velX; velX *= SPIN.DAMPING;
  }
  stepScheduler(dt);

  // clamp rotations to [-PI, PI]
  const wrap = THREE.MathUtils.euclideanModulo;
  globe.rotation.y = wrap(globe.rotation.y + Math.PI, Math.PI*2) - Math.PI;
  globe.rotation.x = wrap(globe.rotation.x + Math.PI, Math.PI*2) - Math.PI;

  // depth fade only (continuous, no toggling)
  for (const sprite of SPRITES){
    const d = camera.position.distanceTo(sprite.getWorldPosition(tmp.set(0,0,0)));
    const f = depthFactorFromDistance(d);
    sprite.material.opacity = OP_BACK + (OP_FRONT - OP_BACK) * (f*f);
  }

  renderer.render(scene, camera);
}

// ---- Resize ----
function onResize(){
  const w = Math.max(1, container.clientWidth);
  const h = Math.max(1, container.clientHeight);
  renderer.setSize(w,h);
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  fitCameraToGlobe();
}
window.addEventListener('resize', onResize);

// ---- Run ----
fitCameraToGlobe();
buildSprites().then(animate);

// ---- Theme refresh (textures only; no layout changes) ----
async function refreshTexturesForTheme(){
  await Promise.all(SPRITES.map(async (sprite) => {
    const { slug, label } = sprite.userData || {};
    if (!label) return;
    const { texture, aspect } = await makeIconLabelTexture(slug, label, BASE_CANVAS_W);
    sprite.material.map && sprite.material.map.dispose?.();
    sprite.material.map = texture;
    sprite.material.needsUpdate = true;
    sprite.scale.set(WIDTH_CONST, WIDTH_CONST / aspect, 1);
    sprite.userData.aspect = aspect;
  }));
}
const mo = new MutationObserver(() => refreshTexturesForTheme());
mo.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme','class','style'] });
mo.observe(document.body, { attributes:true, attributeFilter:['class','style'] });
try {
  if (window.parent && window.parent !== window) {
    const pDoc = window.parent.document;
    const pObserver = new MutationObserver(() => refreshTexturesForTheme());
    pObserver.observe(pDoc.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  }
} catch(e){}
if (window.matchMedia){
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', refreshTexturesForTheme);
}