// =========================
// Skill Globe – fixed selection (no blinking), compact & even
// =========================

// ---- Tweakables ----
const SIZE_MULT     = 1.55;  // overall globe scale (increased from 1.30)
const WIDTH_CONST   = 0.40;  // constant sprite width in world units (slightly smaller for more breathing room)
const PACK_DENSITY  = 1.75;  // >1 packs more positions (1.6–2.2 typical)
const RELAX_ITERS   = 100;   // more = more even spacing (increased from 72 for better distribution)
const RELAX_STEP    = 0.14;  // relax step size (0.08–0.16)
const VIEW_MARGIN   = 1.12;  // camera breathing room
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

// ---- Icons ----
const ICONS = [
  // Frontend & UI
  { slug:'javascript', name:'JavaScript' }, { slug:'typescript', name:'TypeScript' },
  { slug:'html5', name:'HTML5' }, { slug:'css3', name:'CSS3' }, { slug:'react', name:'React' },
  { slug:'angular', name:'Angular' }, { slug:'nextdotjs', name:'Next.js' }, { slug:'bootstrap', name:'Bootstrap' },
  { slug:'threedotjs', name:'Three.js' }, { slug:'streamlit', name:'Streamlit' },

  // Backend & APIs
  { slug:'nodedotjs', name:'Node.js' }, { slug:'flask', name:'Flask' }, { slug:'fastapi', name:'FastAPI' },
  { slug:'django', name:'Django' }, { slug:'apache', name:'Apache' }, { slug:'nginx', name:'NGINX' },
  { slug:'openapiinitiative', name:'OpenAPI Initiative' },

  // Databases & Data Platforms
  { slug:'postgresql', name:'PostgreSQL' }, { slug:'mysql', name:'MySQL' }, { slug:'mongodb', name:'MongoDB' },
  { slug:'redis', name:'Redis' }, { slug:'elasticsearch', name:'Elasticsearch' },
  { slug:'microsoftsqlserver', name:'Microsoft SQL Server' }, { slug:'sqlite', name:'SQLite' },

  // Data Engineering & Analytics
  { slug:'apachespark', name:'Apache Spark' }, { slug:'apachehadoop', name:'Apache Hadoop' },
  { slug:'apachecassandra', name:'Apache Cassandra' }, { slug:'apacheairflow', name:'Apache Airflow' },
  { slug:'dbt', name:'dbt' }, { slug:'jupyter', name:'Jupyter' }, { slug:'matplotlib', name:'Matplotlib' },
  { slug:'plotly', name:'Plotly' }, { slug:'tableau', name:'Tableau' },

  // AI / ML
  { slug:'openai', name:'OpenAI' }, { slug:'langchain', name:'LangChain' }, { slug:'opencv', name:'OpenCV' },
  { slug:'tensorflow', name:'TensorFlow' }, { slug:'pytorch', name:'PyTorch' }, { slug:'numpy', name:'NumPy' },
  { slug:'pandas', name:'Pandas' }, { slug:'huggingface', name:'Hugging Face' }, { slug:'scikitlearn', name:'scikit-learn' },

  // Cloud / DevOps
  { slug:'amazonaws', name:'Amazon Web Services' }, { slug:'microsoftazure', name:'Microsoft Azure' },
  { slug:'googlecloud', name:'Google Cloud' }, { slug:'docker', name:'Docker' }, { slug:'kubernetes', name:'Kubernetes' },
  { slug:'cloudflare', name:'Cloudflare' },

  // Security / Networking / Methods
  { slug:'wireshark', name:'Wireshark' }, { slug:'letsencrypt', name:"Let's Encrypt" },
  { slug:'openssl', name:'OpenSSL' }, { slug:'owasp', name:'OWASP' }, { slug:'jira', name:'Jira' },
  { slug:'istio', name:'Istio' },

  // Languages & Tools
  { slug:'java', name:'Java' }, { slug:'python', name:'Python' }, { slug:'cplusplus', name:'C++' },
  { slug:'visualstudiocode', name:'Visual Studio Code' }, { slug:'git', name:'Git' },
  { slug:'github', name:'GitHub' }, { slug:'githubactions', name:'GitHub Actions' }, { slug:'postman', name:'Postman' },
  { slug:'figma', name:'Figma' }, { slug:'balsamiq', name:'Balsamiq' }, { slug:'moqups', name:'Moqups' },
  { slug:'tailwindcss', name:'Tailwind CSS' }, { slug:'sass', name:'Sass' }, { slug:'mui', name:'MUI' },
  { slug:'powerbi', name:'Power BI' }, { slug:'linux', name:'Linux' }, { slug:'ubuntu', name:'Ubuntu' },
  { slug:'veritas', name:'Veritas' }, { slug:'servicenow', name:'ServiceNow' }
];

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
const SI = (slug, color) => `https://cdn.simpleicons.org/${slug}/${color}`;
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

  const img = await loadImage(SI(slug, colors.iconColor));
  const s = Math.min(ICON / img.width, ICON / img.height);
  const w = Math.round(img.width * s), h = Math.round(img.height * s);
  const x = Math.round((cw - w)/2), y = PAD + Math.round((ICON - h)/2);
  ctx.drawImage(img, x, y, w, h);

  ctx.font = `600 ${chosenPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const cx = Math.round(cw / 2), baselineY = PAD + ICON + GAP + ascent;
  ctx.lineWidth = Math.max(2, Math.round(chosenPx/15));
  ctx.strokeStyle = getThemeColors().labelStroke;
  ctx.strokeText(label, cx, baselineY);
  ctx.fillStyle = getThemeColors().labelColor;
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

  for (let i=0; i<TOTAL; i++){
    const { slug, label } = ALL[(i + offset) % ALL.length];
    try{
      const { texture, aspect } = await makeIconLabelTexture(slug, label, BASE_CANVAS_W);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent:true, depthTest:true, opacity: 1.0 });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(WIDTH_CONST, WIDTH_CONST / aspect, 1);
      sprite.position.copy(points[i]);
      sprite.userData = { slug, label, aspect };
      globe.add(sprite);
      SPRITES.push(sprite);
    }catch(e){
      console.warn('Failed to render', slug || label, e);
    }
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
if (window.matchMedia){
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', refreshTexturesForTheme);
}