// ===== Theme detection =====
function getThemeMode() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('theme');
  if (p === 'dark' || p === 'light') return p;

  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;

  const html = document.documentElement;
  if (html.classList.contains('dark')) return 'dark';
  if (html.classList.contains('light')) return 'light';
  if (document.body.classList.contains('dark')) return 'dark';
  if (document.body.classList.contains('light')) return 'light';

  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark' : 'light';
}

function getThemeColors() {
  const isDark = getThemeMode() === 'dark';
  return {
    labelColor:  isDark ? '#ffffff' : '#1a1a1a',
    iconColor:   isDark ? 'ffffff'  : '1a1a1a',          // Simple Icons hex (no '#')
    labelStroke: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'
  };
}

// ===== Scene setup =====
const container = document.getElementById('globe');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  55,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(0,0,6);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Globe group
const globe = new THREE.Group();
scene.add(globe);

// ===== Single SPRITES declaration (fixes the error) =====
let SPRITES = [];

// ===== Icons =====
const SI = (slug, color) => `https://cdn.simpleicons.org/${slug}/${color}`;
const ICONS = [
  // Core & FE
  { slug:'javascript', name:'JavaScript' }, { slug:'typescript', name:'TypeScript' },
  { slug:'html5', name:'HTML' }, { slug:'css3', name:'CSS' }, { slug:'react', name:'React' },
  { slug:'angular', name:'Angular' }, { slug:'nextdotjs', name:'Next.js' },
  { slug:'bootstrap', name:'Bootstrap' }, { slug:'threedotjs', name:'Three.js' },
  { slug:'streamlit', name:'Streamlit' },

  // Backend & APIs
  { slug:'nodedotjs', name:'Node.js' },  // correct slug
  { slug:'flask', name:'Flask' }, { slug:'fastapi', name:'FastAPI' }, { slug:'django', name:'Django' },
  { slug:'apache', name:'Apache' }, { slug:'nginx', name:'NGINX' }, { slug:'graphql', name:'GraphQL' },

  // Databases / queues
  { slug:'postgresql', name:'PostgreSQL' }, { slug:'mysql', name:'MySQL' }, { slug:'mongodb', name:'MongoDB' },
  { slug:'redis', name:'Redis' }, { slug:'elasticsearch', name:'Elasticsearch' },
  { slug:'rabbitmq', name:'RabbitMQ' }, { slug:'apachekafka', name:'Kafka' },

  // AI/ML & tooling
  { slug:'openai', name:'OpenAI' }, { slug:'langchain', name:'LangChain' }, { slug:'opencv', name:'OpenCV' },
  { slug:'tensorflow', name:'TensorFlow' }, { slug:'pytorch', name:'PyTorch' },
  { slug:'numpy', name:'NumPy' }, { slug:'pandas', name:'Pandas' },

  // Cloud & DevOps
  { slug:'amazonaws', name:'AWS' }, { slug:'microsoftazure', name:'Azure' }, { slug:'googlecloud', name:'GCP' },
  { slug:'docker', name:'Docker' }, { slug:'kubernetes', name:'Kubernetes' },
  { slug:'githubactions', name:'GitHub Actions' }, { slug:'vercel', name:'Vercel' },
  { slug:'netlify', name:'Netlify' }, { slug:'cloudflare', name:'Cloudflare' }, { slug:'render', name:'Render' },

  // Tools & OS
  { slug:'git', name:'Git' }, { slug:'github', name:'GitHub' }, { slug:'visualstudiocode', name:'VS Code' },
  { slug:'postman', name:'Postman' }, { slug:'figma', name:'Figma' }, { slug:'balsamiq', name:'Balsamiq' },
  { slug:'inkscape', name:'Inkscape' }, { slug:'adobeillustrator', name:'Illustrator' },
  { slug:'linux', name:'Linux' }, { slug:'ubuntu', name:'Ubuntu' },

  // Added
  { slug:'tailwindcss', name:'Tailwind CSS' }, { slug:'mui', name:'MUI' },
  { slug:'framer', name:'Framer Motion' }, { slug:'vite', name:'Vite' },
  { slug:'webpack', name:'Webpack' }, { slug:'sass', name:'Sass / SCSS' },
  { slug:'microsoftsqlserver', name:'SQL Server' }, { slug:'sqlite', name:'SQLite' },
  { slug:'supabase', name:'Supabase' }, { slug:'prisma', name:'Prisma' }, { slug:'firebase', name:'Firebase' },
  { slug:'huggingface', name:'Hugging Face' }, { slug:'scikitlearn', name:'scikit-learn' },
  { slug:'railway', name:'Railway' }, { slug:'heroku', name:'Heroku' }
];

// ===== Visual tuning (bigger logos, clear depth) =====
const SPHERE_RADIUS = 2.15;
const WIDTH_FRONT = 0.54;   // bigger front
const WIDTH_BACK  = 0.28;   // smaller back
const OP_FRONT = 1.00, OP_BACK = 0.06;
const DENSITY_MULT = 1.0;

// Text rendering
const MIN_FONT_PX = 80;
const MAX_FONT_PX = 220;
const BASE_CANVAS_W = 520;
const ICON_PAD = 10;
const LABEL_MARGIN = 8;

// ===== Fibonacci sphere points =====
function fibonacciSphere(n, radius=SPHERE_RADIUS){
  const pts=[], off=2/n, inc=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<n;i++){
    const y=i*off-1+off/2, r=Math.sqrt(1-y*y), phi=i*inc;
    const x=Math.cos(phi)*r, z=Math.sin(phi)*r;
    pts.push(new THREE.Vector3(x*radius,y*radius,z*radius));
  }
  return pts;
}

// ===== Asset + texture helpers =====
function loadImage(url){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>resolve(img);
    img.onerror = ()=>reject(new Error('Icon load failed: '+url));
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

async function makeIconLabelTexture(slug, label, desiredCanvasWidth=BASE_CANVAS_W){
  const colors = getThemeColors();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = Math.round(desiredCanvasWidth * dpr);
  const maxTextW = Math.round(cw * 0.8);
  const targetPx = Math.round(240 * dpr);

  const measure = document.createElement('canvas').getContext('2d');
  const chosenPx = fitLabel(measure, label, maxTextW, targetPx);
  measure.font = `600 ${chosenPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const m = measure.measureText(label);
  const ascent  = Math.max(m.actualBoundingBoxAscent || chosenPx * 0.8, 1);
  const descent = Math.max(m.actualBoundingBoxDescent || chosenPx * 0.25, 1);
  const textHpx = ascent + descent;

  let img = null;
  try { img = await loadImage(SI(slug, colors.iconColor)); } catch { img = null; }

  const topPad = Math.round(ICON_PAD * dpr);
  const bottomPad = Math.round(ICON_PAD * dpr);
  const labelGap = Math.round(LABEL_MARGIN * dpr);
  const iconBox = img ? Math.round((desiredCanvasWidth - ICON_PAD*2) * dpr) : 0;
  const labelBand = Math.round(textHpx + chosenPx * 0.35);
  const ch = topPad + iconBox + (img ? labelGap : 0) + labelBand + bottomPad;

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  if (img){
    const scale = Math.min(iconBox / img.width, iconBox / img.height);
    const drawW = Math.round(img.width * scale);
    const drawH = Math.round(img.height * scale);
    const iconX = Math.round((cw - drawW)/2);
    const iconY = Math.round(topPad + (iconBox - drawH)/2);
    ctx.drawImage(img, iconX, iconY, drawW, drawH);
  }

  ctx.font = `600 ${chosenPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const textCenterX = Math.round(cw/2);
  const baselineY = topPad + iconBox + (img ? labelGap : 0) + Math.round(ascent + chosenPx * 0.18);

  ctx.lineWidth = Math.max(2, Math.round(chosenPx/15));
  ctx.strokeStyle = colors.labelStroke;
  ctx.strokeText(label, textCenterX, baselineY);

  ctx.fillStyle = colors.labelColor;
  ctx.fillText(label, textCenterX, baselineY);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  return { texture, aspect: canvas.width / canvas.height };
}

// ===== Depth helpers =====
const camDistToOrigin = camera.position.length();
const NEAR_DIST = Math.max(0.0001, camDistToOrigin - SPHERE_RADIUS);
const FAR_DIST  = camDistToOrigin + SPHERE_RADIUS;
function depthFactorFromDistance(d){
  const t = (d - NEAR_DIST) / (FAR_DIST - NEAR_DIST);
  const c = Math.max(0, Math.min(1, 1 - t));
  return c*c*(3 - 2*c);
}

// ===== Build sprites =====
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

// ===== Interaction (drag) =====
let dragging=false, lastX=0, lastY=0, velX=0, velY=0, userActive=false;

container.addEventListener('pointerdown', e => {
  dragging=true; userActive=true; lastX=e.clientX; lastY=e.clientY;
});
window.addEventListener('pointermove', e => {
  if(!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX=e.clientX; lastY=e.clientY;
  const s = 0.005;
  globe.rotation.y += dx * s; // left/right
  globe.rotation.x += dy * s; // up/down
  velY = dx * s * 0.95;
  velX = dy * s * 0.95;
});
window.addEventListener('pointerup', ()=>{ 
  dragging=false; 
  setTimeout(()=>{ userActive=false; snapPhaseToVelocity(); }, 200); 
});

// ===== Diagonal-only auto-rotation (↘, ↖, ↙, ↗) =====
const DIAGONALS = [
  { sx:+1, sy:+1 },  // ↘ top-left to bottom-right
  { sx:-1, sy:-1 },  // ↖ reverse
  { sx:+1, sy:-1 },  // ↙ top-right to bottom-left
  { sx:-1, sy:+1 }   // ↗ reverse
];
let phaseIndex = 0;
let phaseElapsed = 0;
const PHASE_DUR = 5.0;  // seconds per diagonal
const SPEED = 0.30;     // radians/sec
const clock = new THREE.Clock();

function stepScheduler(dt){
  if (userActive) return; // user drag wins

  const { sx, sy } = DIAGONALS[phaseIndex];
  globe.rotation.y += (SPEED * sy) * dt;  // left/right
  globe.rotation.x += (SPEED * sx) * dt;  // up/down

  phaseElapsed += dt;
  if (phaseElapsed >= PHASE_DUR) {
    phaseElapsed = 0;
    phaseIndex = (phaseIndex + 1) % DIAGONALS.length;
  }
}

// pick the diagonal closest to the user's last drag
function snapPhaseToVelocity(){
  if (Math.abs(velX) < 0.0001 && Math.abs(velY) < 0.0001) return;
  const sx = Math.sign(velX) || 1;
  const sy = Math.sign(velY) || 1;
  let best = 0, bestDot = -Infinity;
  DIAGONALS.forEach((d, i) => {
    const dot = d.sx * sx + d.sy * sy;
    if (dot > bestDot) { bestDot = dot; best = i; }
  });
  phaseIndex = best;
  phaseElapsed = 0;
}

// ===== Animate =====
function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if(!dragging && userActive){
    globe.rotation.y += velY; velY *= 0.95;
    globe.rotation.x += velX; velX *= 0.95;
  }

  stepScheduler(dt);

  // depth-based size & opacity
  globe.children.forEach(sprite => {
    const worldPos = sprite.getWorldPosition(new THREE.Vector3());
    const d = camera.position.distanceTo(worldPos);
    const f = depthFactorFromDistance(d);
    sprite.material.opacity = OP_BACK + (OP_FRONT - OP_BACK) * Math.pow(f, 2.0);
    const tex = sprite.material.map;
    const img = tex && tex.image;
    const aspect = img ? (img.width / img.height) : 1.2;
    const w = WIDTH_BACK + (WIDTH_FRONT - WIDTH_BACK) * f;
    sprite.scale.set(w, w / aspect, 1);
  });

  renderer.render(scene, camera);
}
animate();

// ===== Resize =====
function onResize(){
  const w = Math.max(1, container.clientWidth);
  const h = Math.max(1, container.clientHeight);
  renderer.setSize(w,h);
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// ===== Theme reactivity =====
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

// ===== Build initially =====
buildSprites();
