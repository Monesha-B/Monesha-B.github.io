// =========================
// Skill Globe — Stacked badges (icon above, label below)
// XXL logos + labels, dim in dark mode, full 360° rotation
// =========================

// --- Theme detection ---
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
    // Dim icon on dark so it’s not glaring white
    iconColor:   isDark ? 'cdcdcd' : '262626',
    // Fallback block
    placeholderBg: isDark ? '#2a2a2f' : '#ececef',
    placeholderBd: isDark ? '#3a3a40' : '#d4d4da',
    placeholderFg: isDark ? '#c9c9c9' : '#3a3a40'
  };
}

// --- Spin profile (?speed=slow|normal|fast) ---
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

// --- Scene ---
const container = document.getElementById('globe');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0,0,6);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// --- Globe group ---
const globe = new THREE.Group();
scene.add(globe);

let SPRITES = [];

// --- Skills (your list) ---
const SI = (slug, color) => `https://cdn.simpleicons.org/${slug}/${color}`;
const ICONS = [
  // Frontend & UI
  { slug:'javascript',        name:'JavaScript' },
  { slug:'typescript',        name:'TypeScript' },
  { slug:'html5',             name:'HTML' },
  { slug:'css3',              name:'CSS' },
  { slug:'react',             name:'React' },
  { slug:'angular',           name:'Angular' },
  { slug:'nextdotjs',         name:'Next.js' },
  { slug:'bootstrap',         name:'Bootstrap' },
  { slug:'threedotjs',        name:'Three.js' },
  { slug:'streamlit',         name:'Streamlit' },

  // Backend & APIs
  { slug:'nodedotjs',         name:'Node.js' },
  { slug:'flask',             name:'Flask' },
  { slug:'fastapi',           name:'FastAPI' },
  { slug:'django',            name:'Django' },
  { slug:'apache',            name:'Apache' },
  { slug:'nginx',             name:'NGINX' },
  { slug:'openapiinitiative', name:'REST APIs' },

  // Databases & Data
  { slug:'postgresql',        name:'PostgreSQL' },
  { slug:'mysql',             name:'MySQL' },
  { slug:'mongodb',           name:'MongoDB' },
  { slug:'redis',             name:'Redis' },
  { slug:'elasticsearch',     name:'Elasticsearch' },
  { slug:'microsoftsqlserver',name:'SQL Server' },
  { slug:'sqlite',            name:'SQLite' },

  // AI / ML
  { slug:'openai',            name:'OpenAI' },
  { slug:'langchain',         name:'LangChain' },
  { slug:'opencv',            name:'OpenCV' },
  { slug:'tensorflow',        name:'TensorFlow' },
  { slug:'pytorch',           name:'PyTorch' },
  { slug:'numpy',             name:'NumPy' },
  { slug:'pandas',            name:'Pandas' },
  { slug:'huggingface',       name:'Hugging Face' },
  { slug:'scikitlearn',       name:'scikit-learn' },

  // Cloud / DevOps
  { slug:'amazonaws',         name:'AWS' },
  { slug:'microsoftazure',    name:'Azure' },
  { slug:'googlecloud',       name:'GCP' },
  { slug:'docker',            name:'Docker' },
  { slug:'kubernetes',        name:'Kubernetes' },
  { slug:'cloudflare',        name:'Cloudflare' },

  // Tools & Platforms
  { slug:'git',               name:'Git' },
  { slug:'github',            name:'GitHub' },
  { slug:'visualstudiocode',  name:'VS Code' },
  { slug:'postman',           name:'Postman' },
  { slug:'figma',             name:'Figma' },
  { slug:'balsamiq',          name:'Balsamiq' },
  { slug:'moqups',            name:'Moqups' },
  { slug:'tailwindcss',       name:'Tailwind CSS' },
  { slug:'sass',              name:'Sass / SCSS' },
  { slug:'mui',               name:'MUI' },
  { slug:'powerbi',           name:'Power BI' },

  // OS & Other
  { slug:'linux',             name:'Linux' },
  { slug:'ubuntu',            name:'Ubuntu' },
  { slug:'python',            name:'Python' },
  { slug:'cplusplus',         name:'C++' },
  { slug:'veritas',           name:'NetBackup' },
  { slug:'servicenow',        name:'ServiceNow' }
];

// --- XXL on-globe footprint ---
const SPHERE_RADIUS = 2.15;
const WIDTH_FRONT  = 0.58;  // bigger badges on the front
const WIDTH_BACK   = 0.28;  // bigger on back
const OP_FRONT = 1.00, OP_BACK = 0.06;
const DENSITY_MULT = 1.0;

// --- XXL label sizing ---
const MIN_FONT_PX   = 96;
const MAX_FONT_PX   = 300;
const BASE_CANVAS_W = 720;  // badge width
const LABEL_MARGIN  = 20;   // gap between icon and label

// --- Fibonacci sphere ---
function fibonacciSphere(n, radius=SPHERE_RADIUS){
  const pts=[], off=2/n, inc=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<n;i++){
    const y=i*off-1+off/2, r=Math.sqrt(1-y*y), phi=i*inc;
    const x=Math.cos(phi)*r, z=Math.sin(phi)*r;
    pts.push(new THREE.Vector3(x*radius,y*radius,z*radius));
  }
  return pts;
}

// --- assets ---
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

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y,   x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x,   y+h, rr);
  ctx.arcTo(x,   y+h, x,   y,   rr);
  ctx.arcTo(x,   y,   x+w, y,   rr);
  ctx.closePath();
}

// --- Texture (STACKED: icon top, label bottom) — XXL ---
async function makeIconLabelTexture(slug, label, desiredCanvasWidth = BASE_CANVAS_W){
  const colors = getThemeColors();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const cw  = Math.round(desiredCanvasWidth * dpr); // canvas width
  const PAD = Math.round(16 * dpr);
  const GAP = Math.round(LABEL_MARGIN * dpr);

  // Make the icon big relative to width
  const ICON = Math.round(cw * 0.62);   // square icon area (↑ bigger)

  // Label sizing — stacked, so max width is cw - side padding
  const textMaxW = cw - PAD*2;
  const targetPx = Math.round(190 * dpr); // large target

  // Measure to fit text
  const measure  = document.createElement('canvas').getContext('2d');
  const chosenPx = fitLabel(measure, label, textMaxW, targetPx);
  measure.font = `600 ${chosenPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const m = measure.measureText(label);
  const ascent  = Math.max(m.actualBoundingBoxAscent || chosenPx*0.8,  1);
  const descent = Math.max(m.actualBoundingBoxDescent || chosenPx*0.25, 1);
  const txtH    = ascent + descent;

  // Canvas height = pad + icon + gap + text + pad
  const ch = PAD + ICON + GAP + txtH + PAD;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width  = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  // Try official icon
  let img = null;
  try { img = await loadImage(SI(slug, colors.iconColor)); } catch { img = null; }

  if (img){
    // Fit icon into ICON x ICON square, centered horizontally
    const s = Math.min(ICON / img.width, ICON / img.height);
    const w = Math.round(img.width * s);
    const h = Math.round(img.height * s);
    const x = Math.round((cw - w)/2);
    const y = PAD + Math.round((ICON - h)/2);
    ctx.drawImage(img, x, y, w, h);
  } else {
    // Fallback rounded square centered
    const w = ICON, h = ICON;
    const x = Math.round((cw - w)/2);
    const y = PAD;
    const r = Math.round(18 * dpr);
    ctx.fillStyle = colors.placeholderBg;
    ctx.strokeStyle = colors.placeholderBd;
    ctx.lineWidth = Math.max(1, Math.round(2 * dpr));
    roundRect(ctx, x, y, w, h, r);
    ctx.fill(); ctx.stroke();

    // Letter in the box
    const letter = (label.match(/[A-Za-z0-9+#]/) || ['•'])[0].toUpperCase();
    const lf = Math.round(ICON * 0.56);
    ctx.font = `700 ${lf}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.fillStyle = colors.placeholderFg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, x + w/2, y + h/2 + Math.round(ICON*0.03));
  }

  // Draw label centered under icon
  ctx.font = `600 ${chosenPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const cx = Math.round(cw / 2);
  const baselineY = PAD + ICON + GAP + ascent;

  // Stroke + fill for legibility
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

// --- Depth helpers ---
const camDistToOrigin = camera.position.length();
const NEAR_DIST = Math.max(0.0001, camDistToOrigin - SPHERE_RADIUS);
const FAR_DIST  = camDistToOrigin + SPHERE_RADIUS;
function depthFactorFromDistance(d){
  const t = (d - NEAR_DIST) / (FAR_DIST - NEAR_DIST);
  const c = Math.max(0, Math.min(1, 1 - t));
  return c*c*(3 - 2*c);
}

// --- Build sprites ---
async function buildSprites(){
  SPRITES.forEach(s => globe.remove(s));
  SPRITES = [];

  const TOTAL = Math.max(1, Math.round(ICONS.length * DENSITY_MULT));
  const positions = fibonacciSphere(TOTAL);

  for (let i=0; i<TOTAL; i++){
    const { slug, name } = ICONS[i % ICONS.length];
    try{
      const { texture, aspect } = await makeIconLabelTexture(slug, name, BASE_CANVAS_W);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent:true, depthTest:true });
      const sprite = new THREE.Sprite(mat);
      const midW = (WIDTH_FRONT + WIDTH_BACK) / 2;
      sprite.scale.set(midW, midW / aspect, 1);
      sprite.position.copy(positions[i]);
      sprite.userData = { slug, name };
      globe.add(sprite);
      SPRITES.push(sprite);
    }catch(e){
      console.warn('Failed to render', slug, e);
    }
  }
}

// --- Interaction ---
let dragging=false, lastX=0, lastY=0, velX=0, velY=0, userActive=false;

container.addEventListener('pointerdown', e => {
  dragging=true; userActive=true; lastX=e.clientX; lastY=e.clientY;
});
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
window.addEventListener('pointerup', ()=>{ 
  dragging=false; 
  setTimeout(()=>{ userActive=false; snapPhaseToVelocity(); }, 200); 
});

// --- Diagonal auto-rotation ---
const DIAGONALS = [
  { sx:+1, sy:+1 }, { sx:-1, sy:-1 }, { sx:+1, sy:-1 }, { sx:-1, sy:+1 }
];
let phaseIndex = 0, phaseElapsed = 0;
const PHASE_DUR = SPIN.PHASE_DUR, SPEED = SPIN.SPEED;
const clock = new THREE.Clock();

function stepScheduler(dt){
  if (userActive) return;
  const { sx, sy } = DIAGONALS[phaseIndex];
  globe.rotation.y += (SPEED * sy) * dt;
  globe.rotation.x += (SPEED * sx) * dt;
  phaseElapsed += dt;
  if (phaseElapsed >= PHASE_DUR) {
    phaseElapsed = 0;
    phaseIndex = (phaseIndex + 1) % DIAGONALS.length;
  }
}

function snapPhaseToVelocity(){
  if (Math.abs(velX) < 0.0001 && Math.abs(velY) < 0.0001) return;
  const sx = Math.sign(velX) || 1, sy = Math.sign(velY) || 1;
  let best = 0, bestDot = -Infinity;
  DIAGONALS.forEach((d, i) => {
    const dot = d.sx * sx + d.sy * sy;
    if (dot > bestDot) { bestDot = dot; best = i; }
  });
  phaseIndex = best; phaseElapsed = 0;
}

// --- Animate (full 360 with wrapping) ---
function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if(!dragging && userActive){
    globe.rotation.y += velY; velY *= SPIN.DAMPING;
    globe.rotation.x += velX; velX *= SPIN.DAMPING;
  }

  stepScheduler(dt);

  const wrap = THREE.MathUtils.euclideanModulo;
  globe.rotation.y = wrap(globe.rotation.y + Math.PI, Math.PI*2) - Math.PI;
  globe.rotation.x = wrap(globe.rotation.x + Math.PI, Math.PI*2) - Math.PI;

  globe.children.forEach(sprite => {
    const worldPos = sprite.getWorldPosition(new THREE.Vector3());
    const d = camera.position.distanceTo(worldPos);
    const f = depthFactorFromDistance(d);
    sprite.material.opacity = OP_BACK + (OP_FRONT - OP_BACK) * Math.pow(f, 2.0);
    const tex = sprite.material.map, img = tex && tex.image;
    const aspect = img ? (img.width / img.height) : 1.2;
    const w = WIDTH_BACK + (WIDTH_FRONT - WIDTH_BACK) * f;
    sprite.scale.set(w, w / aspect, 1);
  });

  renderer.render(scene, camera);
}
animate();

// --- Resize ---
function onResize(){
  const w = Math.max(1, container.clientWidth);
  const h = Math.max(1, container.clientHeight);
  renderer.setSize(w,h);
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// --- Theme reactivity ---
async function refreshTexturesForTheme(){
  await Promise.all(SPRITES.map(async (sprite) => {
    const { slug, name } = sprite.userData || {};
    if (!slug || !name) return;
    const { texture, aspect } = await makeIconLabelTexture(slug, name, BASE_CANVAS_W);
    sprite.material.map && sprite.material.map.dispose?.();
    sprite.material.map = texture;
    sprite.material.needsUpdate = true;
    const w = sprite.scale.x;
    sprite.scale.set(w, w / aspect, 1);
  }));
}
const mo = new MutationObserver(() => refreshTexturesForTheme());
mo.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme','class','style'] });
mo.observe(document.body, { attributes:true, attributeFilter:['class','style'] });

if (window.matchMedia){
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', refreshTexturesForTheme);
}

// --- Build ---
buildSprites();
