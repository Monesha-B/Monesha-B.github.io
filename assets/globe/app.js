// Theme detection
function getThemeColors() {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get('theme');
  
  // If no theme param, default to light theme (instead of undefined)
  const isDark = theme === 'dark';
  
  console.log('Globe theme:', isDark ? 'DARK' : 'LIGHT');
  
  if (isDark) {
    return {
      labelColor: '#ffffff',
      iconColor: 'ffffff',
      labelStroke: 'rgba(0, 0, 0, 0.7)'
    };
  } else {
    return {
      labelColor: '#1a1a1a',
      iconColor: '1a1a1a',
      labelStroke: 'rgba(255, 255, 255, 0.9)'
    };
  }
}

const container = document.getElementById('globe');

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, container.clientWidth/container.clientHeight, 0.1, 100);
camera.position.set(0,0,6);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Globe
const globe = new THREE.Group();
globe.rotation.x = 0.28;
scene.add(globe);

// Icons
const DENSITY_MULT = 1.8;
const SI = (slug, color) => `https://cdn.simpleicons.org/${slug}/${color}`;

const ICONS = [
  { slug:'kubernetes', name:'Kubernetes' },
  { slug:'docker', name:'Docker' },
  { slug:'github', name:'GitHub' },
  { slug:'gitlab', name:'GitLab' },
  { slug:'python', name:'Python' },
  { slug:'node-dot-js', name:'Node.js' },
  { slug:'java', name:'Java' },
  { slug:'terraform', name:'Terraform' },
  { slug:'ansible', name:'Ansible' },
  { slug:'amazonaws', name:'AWS' },
  { slug:'microsoftazure', name:'Azure' },
  { slug:'googlecloud', name:'GCP' },
  { slug:'ubuntu', name:'Ubuntu' },
  { slug:'debian', name:'Debian' },
  { slug:'redhat', name:'Red Hat' },
  { slug:'prometheus', name:'Prometheus' },
  { slug:'grafana', name:'Grafana' },
  { slug:'helm', name:'Helm' },
  { slug:'postgresql', name:'PostgreSQL' },
  { slug:'mysql', name:'MySQL' },
  { slug:'mongodb', name:'MongoDB' },
  { slug:'redis', name:'Redis' },
  { slug:'rabbitmq', name:'RabbitMQ' },
  { slug:'nginx', name:'NGINX' },
  { slug:'apache', name:'Apache' },
  { slug:'apachekafka', name:'Kafka' },
  { slug:'elasticsearch', name:'Elasticsearch' },
  { slug:'opensearch', name:'OpenSearch' },
  { slug:'hashicorp', name:'HashiCorp' },
];

// Parameters
const SPHERE_RADIUS = 2.15;
const WIDTH_FRONT = 0.58;
const WIDTH_BACK  = 0.42;
const MIN_FONT_PX = 90;
const MAX_FONT_PX = 220;
const BASE_CANVAS_W = 520;
const ICON_PAD = 12;
const LABEL_MARGIN = 8;
const OP_FRONT = 0.98, OP_BACK = 0.10;

// Fibonacci sphere
function fibonacciSphere(n, radius=SPHERE_RADIUS){
  const pts=[], off=2/n, inc=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<n;i++){
    const y=i*off-1+off/2, r=Math.sqrt(1-y*y), phi=i*inc;
    const x=Math.cos(phi)*r, z=Math.sin(phi)*r;
    pts.push(new THREE.Vector3(x*radius,y*radius,z*radius));
  }
  return pts;
}

// Load image
function loadImage(url){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>resolve(img);
    img.onerror = e=>reject(e);
    img.src = url;
  });
}

// Fit label
function fitLabel(ctx, text, maxWidth, targetPx){
  let size = Math.min(MAX_FONT_PX, targetPx);
  for(; size >= MIN_FONT_PX; size--){
    ctx.font = `600 ${size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return MIN_FONT_PX;
}

// Create icon+label texture (NO BACKGROUND BOX)
async function makeIconLabelTexture(slug, label, desiredCanvasWidth=BASE_CANVAS_W){
  const colors = getThemeColors();
  const img = await loadImage(SI(slug, colors.iconColor));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Measure text
  const measCanvas = document.createElement('canvas');
  const measCtx = measCanvas.getContext('2d');
  const cw = Math.round(desiredCanvasWidth * dpr);
  const maxTextW = Math.round(cw * 0.8);
  const targetPx = Math.round(280 * dpr);
  const chosenPx = fitLabel(measCtx, label, maxTextW, targetPx);
  measCtx.font = `600 ${chosenPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  
  const m = measCtx.measureText(label);
  const ascent  = Math.max(m.actualBoundingBoxAscent || chosenPx * 0.8, 1);
  const descent = Math.max(m.actualBoundingBoxDescent || chosenPx * 0.25, 1);
  const textHpx = ascent + descent;

  const iconBox = Math.round((desiredCanvasWidth - ICON_PAD*2) * dpr);
  const topPad = Math.round(ICON_PAD * dpr);
  const bottomPad = Math.round(ICON_PAD * dpr);
  const labelGap = Math.round(LABEL_MARGIN * dpr);
  const labelBand = Math.round(textHpx + chosenPx * 0.4);
  const ch = topPad + iconBox + labelGap + labelBand + bottomPad;

  // Create transparent canvas
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  // Draw icon
  const scale = Math.min(iconBox / img.width, iconBox / img.height);
  const drawW = Math.round(img.width * scale);
  const drawH = Math.round(img.height * scale);
  const iconX = Math.round((cw - drawW)/2);
  const iconY = Math.round(topPad + (iconBox - drawH)/2);
  ctx.drawImage(img, iconX, iconY, drawW, drawH);

  // Draw label with stroke
  ctx.font = `600 ${chosenPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const textCenterX = Math.round(cw/2);
  const baselineY = iconY + drawH + labelGap + Math.round(ascent + chosenPx * 0.2);

  // Stroke for visibility
  ctx.lineWidth = Math.max(3, Math.round(chosenPx/12));
  ctx.strokeStyle = colors.labelStroke;
  ctx.strokeText(label, textCenterX, baselineY);

  // Fill
  ctx.fillStyle = colors.labelColor;
  ctx.fillText(label, textCenterX, baselineY);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  return { texture, aspect: canvas.width / canvas.height };
}

// Depth helpers
const camDistToOrigin = camera.position.length();
const NEAR_DIST = Math.max(0.0001, camDistToOrigin - SPHERE_RADIUS);
const FAR_DIST  = camDistToOrigin + SPHERE_RADIUS;
function depthFactorFromDistance(d){
  const t = (d - NEAR_DIST) / (FAR_DIST - NEAR_DIST);
  const c = Math.max(0, Math.min(1, 1 - t));
  return c*c*(3 - 2*c);
}

// Build sprites
(async function build(){
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
      globe.add(sprite);
    }catch(e){
      console.warn('Failed to load', slug, e);
    }
  }
})();

// Interaction
let dragging=false, lastX=0, lastY=0, velX=0, velY=0, auto=true;
container.addEventListener('pointerdown', e => {
  dragging=true; auto=false; lastX=e.clientX; lastY=e.clientY;
});
window.addEventListener('pointermove', e => {
  if(!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX=e.clientX; lastY=e.clientY;
  const s = 0.005;
  globe.rotation.y += dx * s;
  globe.rotation.x += dy * s;
  velY = dx * s * 0.95;
  velX = dy * s * 0.95;
});
window.addEventListener('pointerup', ()=>{ dragging=false; setTimeout(()=>auto=true, 900); });

// Animate
let t = 0;
function animate(){
  requestAnimationFrame(animate);

  if(!dragging){
    globe.rotation.y += velY; velY *= 0.95;
    globe.rotation.x += velX; velX *= 0.95;
  }

  if(auto){
    globe.rotation.y += 0.0030;
    globe.rotation.x = 0.28 + Math.sin(t)*0.05;
    t += 0.01;
  }

  globe.children.forEach(sprite => {
    const worldPos = sprite.getWorldPosition(new THREE.Vector3());
    const d = camera.position.distanceTo(worldPos);
    const f = depthFactorFromDistance(d);
    sprite.material.opacity = OP_BACK + (OP_FRONT - OP_BACK) * Math.pow(f, 2.0);
    const w = WIDTH_BACK + (WIDTH_FRONT - WIDTH_BACK) * f;
    const tex = sprite.material.map;
    const img = tex && tex.image;
    const aspect = img ? (img.width / img.height) : 1.2;
    sprite.scale.set(w, w / aspect, 1);
  });

  renderer.render(scene, camera);
}
animate();

// Resize
function onResize(){
  const w=container.clientWidth, h=container.clientHeight;
  renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();