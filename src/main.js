import * as THREE from "three";

const $ = (s) => document.querySelector(s);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let effects = !reducedMotion;
try { const stored = localStorage.getItem("ravenhollow-effects"); if (stored !== null) effects = stored === "on"; } catch (_) {}
document.body.classList.toggle("effects-off", !effects);
const effectButton = $("#effects-toggle");
function syncEffects() {
  effectButton.textContent = effects ? "✨ HIỆU ỨNG: BẬT" : "✧ HIỆU ỨNG: TẮT";
  effectButton.setAttribute("aria-pressed", String(effects));
  document.body.classList.toggle("effects-off", !effects);
}
syncEffects();
effectButton.addEventListener("click", () => {
  effects = !effects;
  try { localStorage.setItem("ravenhollow-effects", effects ? "on" : "off"); } catch (_) {}
  syncEffects();
});

const menu = $("#menu-toggle");
const nav = $("#nav-links");
menu.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
});
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  nav.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
}));
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { nav.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); }
});

function makeSky() {
  const stars = $("#stars");
  const bats = $("#bat-field");
  const starFragment = document.createDocumentFragment();
  for (let i = 0; i < 88; i++) {
    const s = document.createElement("span");
    s.className = "star";
    s.style.left = ((i * 73.31 + 17) % 100).toFixed(2) + "%";
    s.style.top = ((i * 47.17 + 11) % 97).toFixed(2) + "%";
    s.style.animationDelay = ((i * 1.33) % 5).toFixed(2) + "s";
    s.style.animationDuration = (2 + ((i * 9) % 34) / 10) + "s";
    if (i % 8 === 0) { s.style.width = "3px"; s.style.height = "3px"; s.style.boxShadow = "0 0 8px #f9daaa"; }
    starFragment.appendChild(s);
  }
  stars.appendChild(starFragment);
  for (let i = 0; i < 5; i++) {
    const bat = document.createElement("span");
    bat.className = "bat";
    bat.textContent = "◆";
    bat.style.top = 5 + (i * 19) % 75 + "%";
    bat.style.animationDelay = -(i * 3.3) + "s";
    bat.style.animationDuration = 16 + i * 5 + "s";
    bats.appendChild(bat);
  }
}
makeSky();

function updateCountdown() {
  const target = new Date("2026-10-31T18:00:00+07:00").getTime();
  const ms = Math.max(0, target - Date.now());
  const secs = Math.floor(ms / 1000);
  const values = [Math.floor(secs / 86400), Math.floor((secs % 86400) / 3600), Math.floor((secs % 3600) / 60), secs % 60];
  ["days", "hours", "minutes", "seconds"].forEach((key, i) => {
    const el = $("#" + key);
    el.textContent = String(values[i]).padStart(2, "0");
  });
  if (ms === 0) $("#countdown-end").textContent = "✨ ĐÊM PHÉP THUẬT ĐÃ BẮT ĐẦU!";
}
updateCountdown();
setInterval(updateCountdown, 1000);

let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

$("#summon-ghosts").addEventListener("click", () => {
  const cemetery = $(".cemetery");
  cemetery.classList.remove("summoned");
  void cemetery.offsetWidth;
  cemetery.classList.add("summoned");
  const phrases = ["✧ Những linh hồn đã nghe thấy lời triệu hồi!", "☾ Một ánh sáng kỳ bí xuất hiện giữa màn sương...", "✦ Học viện đang quan sát sức mạnh phép thuật của bạn."];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  $("#ghost-message").textContent = phrase;
  toast(phrase);
});

$("#invitation-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#wizard-name");
  const name = input.value.trim().replace(/\s+/g, " ").slice(0, 32);
  if (name.length < 2) {
    $("#invitation-response").textContent = "Bí danh cần tối thiểu 2 ký tự.";
    input.focus();
    return;
  }
  try { localStorage.setItem("ravenhollow-wizard", name); } catch (_) {}
  $("#invitation-response").textContent = "✉ Thư mời của " + name + " đã được niêm phong! Hẹn gặp ở Ravenhollow lúc 18:00, 31/10/2026.";
  toast("✦ Chào mừng pháp sư " + name + "!");
});
try {
  const existing = localStorage.getItem("ravenhollow-wizard");
  if (existing) $("#wizard-name").value = existing;
} catch (_) {}

const trials = [
  { sigil:"☾", question:"Khi khu rừng chìm trong màn sương, thứ gì chỉ đường cho các pháp sư?", answers:["Một tia chớp phương Bắc","Ánh trăng và những vì sao","Tiếng đồng hồ cát"], correct:1, result:"Trăng sao soi đường cho người can đảm." },
  { sigil:"✧", question:"Phép thuật mạnh nhất của Ravenhollow đến từ điều gì?", answers:["Lòng dũng cảm và trí tưởng tượng","Chiếc chìa khóa bằng vàng","Một cuốn sách đóng bụi"], correct:0, result:"Sức mạnh thực sự đến từ bên trong bạn." },
  { sigil:"✶", question:"Đêm nào cánh cổng học viện mở ra cho những vị khách đặc biệt?", answers:["Ngày đầu năm mới","Ngày hạ chí","Đêm Halloween 31 tháng 10"], correct:2, result:"Bạn đã mở khóa bí ẩn cuối cùng!" }
];
const dialog = $("#portal-dialog");
let trialIndex = 0, score = 0, answered = false, completed = false;
function renderTrial() {
  const item = trials[trialIndex];
  answered = false;
  completed = false;
  $("#challenge-status").textContent = "THỬ THÁCH " + (trialIndex + 1) + " / 3";
  $("#dialog-title").textContent = "THE ARCANE TRIALS";
  $("#dialog-rune").textContent = item.sigil;
  $("#question-text").textContent = item.question;
  $("#quiz-message").textContent = "";
  $("#quiz-next").hidden = true;
  const answers = $("#answer-list");
  answers.replaceChildren();
  item.answers.forEach((answer, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String.fromCharCode(65 + i) + ".  " + answer;
    button.addEventListener("click", () => pickAnswer(i));
    answers.appendChild(button);
  });
}
function pickAnswer(choice) {
  if (answered) return;
  answered = true;
  const item = trials[trialIndex];
  const correct = choice === item.correct;
  if (correct) score++;
  [...$("#answer-list").children].forEach((btn, i) => {
    btn.disabled = true;
    if (i === item.correct) btn.classList.add("correct");
    else if (i === choice) btn.classList.add("wrong");
  });
  $("#quiz-message").textContent = (correct ? "✦ Chính xác! " : "☾ Chưa chính xác. ") + item.result;
  $("#quiz-next").hidden = false;
  $("#quiz-next").textContent = trialIndex === trials.length - 1 ? "NHẬN HUY HIỆU ✧" : "THỬ THÁCH TIẾP THEO →";
}
$("#quiz-next").addEventListener("click", () => {
  if (completed) { trialIndex = 0; score = 0; renderTrial(); return; }
  if (trialIndex < trials.length - 1) { trialIndex++; renderTrial(); return; }
  completed = true;
  $("#challenge-status").textContent = "ĐÃ HOÀN THÀNH 3 THỬ THÁCH";
  $("#dialog-title").textContent = "WIZARD OF RAVENHOLLOW";
  $("#dialog-rune").textContent = "✦";
  $("#question-text").textContent = score === 3 ? "Xuất sắc! Bạn trả lời đúng cả 3 câu và trở thành pháp sư danh dự." : "Bạn đã vượt qua thử thách. Kết quả: " + score + "/3. Phép thuật cần cả dũng khí lẫn luyện tập!";
  $("#answer-list").replaceChildren();
  $("#quiz-message").textContent = "✧ HUY HIỆU PHÁP SƯ 2026 ✧";
  $("#quiz-next").textContent = "CHƠI LẠI ↺";
  toast("✦ Bạn đã hoàn thành thử thách Ravenhollow!");
});
$("#open-portal").addEventListener("click", () => { trialIndex=0; score=0; renderTrial(); if (!dialog.open) dialog.showModal(); });
$("#close-portal").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

// An original procedural pumpkin inspired by the open-source Three/Tres.js ecosystem.
// No unlicensed source code or 3D model is copied from reference #3.
function createPumpkinScene() {
  const canvas = $("#pumpkin-canvas");
  const fallback = $("#pumpkin-fallback");
  if (!canvas || !window.WebGLRenderingContext) { fallback.style.display = "block"; return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"default"}); }
  catch (error) { console.warn("WebGL fallback:", error); fallback.style.display = "block"; canvas.style.display = "none"; return; }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(0, .3, 8.25);
  scene.add(new THREE.AmbientLight(0xc8a6ef, 1.25));
  const keyLight = new THREE.PointLight(0xffae66, 140, 22);
  keyLight.position.set(-3, 4, 5);
  scene.add(keyLight);
  const rim = new THREE.PointLight(0xb277ff, 100, 18);
  rim.position.set(3,1,-2);
  scene.add(rim);
  const lantern = new THREE.PointLight(0xff8125, 25, 7);
  lantern.position.set(0,0,2.6);
  scene.add(lantern);
  const group = new THREE.Group();
  group.position.y = -.1;
  scene.add(group);
  const pumpGeo = new THREE.SphereGeometry(1.62, 120, 80);
  const position = pumpGeo.attributes.position;
  const colorArray = [];
  const baseColor = new THREE.Color();
  for (let i=0;i<position.count;i++){
    const x=position.getX(i), y=position.getY(i), z=position.getZ(i);
    const phi=Math.atan2(z,x);
    const grooves=Math.cos(phi*10);
    const scale=1+.078*grooves;
    const yscale=.86 - .02*Math.cos(phi*10);
    position.setXYZ(i,x*scale,y*yscale + Math.sin(y*2.4)*.021,z*scale);
    const shade=(grooves+1)/2;
    baseColor.setHSL(.063 - .008*shade + .014*(y/1.62),.94,.35 + .115*shade + .035*(y/1.62));
    colorArray.push(baseColor.r,baseColor.g,baseColor.b);
  }
  pumpGeo.setAttribute("color",new THREE.Float32BufferAttribute(colorArray,3));
  pumpGeo.computeVertexNormals();
  const pumpkin = new THREE.Mesh(pumpGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.73,metalness:.08,emissive:0x4c1406,emissiveIntensity:.22,side:THREE.DoubleSide}));
  group.add(pumpkin);
  // Rib edges add fine carved detail.
  for(let j=0;j<10;j++){
    const a=j*Math.PI*2/10;
    const points=[];
    for(let k=0;k<=32;k++){
      const theta=-Math.PI/2 + k*Math.PI/32;
      const radial=1.62*(1+.08)*Math.cos(theta);
      points.push(new THREE.Vector3(radial*Math.cos(a),1.40*Math.sin(theta),radial*Math.sin(a)));
    }
    const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.012,4,false),new THREE.MeshBasicMaterial({color:0x7d350b,transparent:true,opacity:.4}));
    group.add(rib);
  }
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.10,.22,.65,12,4),new THREE.MeshStandardMaterial({color:0x4c5533,roughness:.93}));
  stem.position.set(.02,1.59,.05);stem.rotation.z=-.18;group.add(stem);
  const stemTop=new THREE.Mesh(new THREE.SphereGeometry(.105,12,9),new THREE.MeshStandardMaterial({color:0x677345}));
  stemTop.position.set(-.04,1.91,.05);group.add(stemTop);
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0,0); leafShape.quadraticCurveTo(.5,.3,.77,-.05);leafShape.quadraticCurveTo(.35,-.25,0,0);
  const leaf=new THREE.Mesh(new THREE.ShapeGeometry(leafShape,12),new THREE.MeshStandardMaterial({color:0x406d2c,side:THREE.DoubleSide}));
  leaf.position.set(-.05,1.76,.19);leaf.rotation.x=-.56;leaf.rotation.z=.18;group.add(leaf);
  // Place illuminated facial polygons onto the front hemisphere.
  function makeFace(points, color, offset=.055){
    const shape=new THREE.Shape();
    points.forEach(([x,y],i) => { if(i===0)shape.moveTo(x,y); else shape.lineTo(x,y); });
    shape.closePath();
    const geom=new THREE.ShapeGeometry(shape,8);
    const pts=geom.attributes.position;
    for(let i=0;i<pts.count;i++){
      const x=pts.getX(i),y=pts.getY(i);
      const xn=x/1.68,yn=y/1.39;
      const z=Math.sqrt(Math.max(.06,1-xn*xn-yn*yn))*1.62*(1+.078*Math.cos(Math.atan2(1,x)*10))+offset;
      pts.setZ(i,z);
    }
    geom.computeVertexNormals();
    const mat=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geom,mat);group.add(mesh);
    return mesh;
  }
  makeFace([[-1.06,.43],[-.15,.53],[-.55,-.03],[-.84,.08]],0xffc464,.075);
  makeFace([[.15,.53],[1.06,.43],[.84,.08],[.55,-.03]],0xffc464,.075);
  makeFace([[-.13,-.10],[0,.22],[.13,-.10]],0xffa344,.08);
  makeFace([[-1.04,-.37],[-.66,-.48],[-.38,-.45],[-.2,-.49],[0,-.63],[.2,-.49],[.38,-.45],[.66,-.48],[1.04,-.37],[.82,-.82],[.48,-1.02],[.10,-1.05],[0,-.87],[-.12,-1.05],[-.48,-1.02],[-.82,-.82]],0xffb550,.085);
  // Floating runic rings.
  const ringMat = new THREE.MeshBasicMaterial({color:0xe2b06a,transparent:true,opacity:.36,side:THREE.DoubleSide});
  const rings=[];
  for(const [radius,tilt] of [[2.15,.35],[2.4,-.6]]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.012,4,150),ringMat.clone());
    ring.rotation.x=Math.PI/2+tilt;ring.rotation.y=.22;
    group.add(ring);rings.push(ring);
  }
  // GLSL animated fireflies and small drifting stars.
  const count = 180;
  const positions=new Float32Array(count*3),sizes=new Float32Array(count);
  for(let i=0;i<count;i++){
    const radius=2.2+Math.random()*2.6, angle=Math.random()*Math.PI*2;
    positions[i*3]=Math.cos(angle)*radius;
    positions[i*3+1]=(Math.random()-.5)*5.5;
    positions[i*3+2]=Math.sin(angle)*radius;
    sizes[i]=2+Math.random()*6;
  }
  const sparkGeo=new THREE.BufferGeometry();
  sparkGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  sparkGeo.setAttribute("aSize",new THREE.BufferAttribute(sizes,1));
  const sparkMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0}},
    vertexShader:"attribute float aSize; uniform float uTime; varying float vGlow; void main(){vec3 p=position; p.y+=sin(uTime*0.7+p.x*3.0)*0.12; p.x+=cos(uTime*0.5+p.y)*0.08; vec4 mvPosition=modelViewMatrix*vec4(p,1.0); gl_PointSize=min(14.0,aSize*(34.0/-mvPosition.z)); gl_Position=projectionMatrix*mvPosition; vGlow=0.6+0.4*sin(uTime*1.8+p.z*6.0); }",
    fragmentShader:"varying float vGlow; void main(){float d=length(gl_PointCoord-vec2(0.5));float glow=smoothstep(0.5,0.0,d); gl_FragColor=vec4(1.0,0.65+0.23*vGlow,0.32,glow*glow*0.85);}"
  });
  const sparkles=new THREE.Points(sparkGeo,sparkMat);
  scene.add(sparkles);
  let width=0,height=0;
  function resize(){
    const rect=canvas.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width)), h=Math.max(1,Math.round(rect.height));
    if(w===width && h===height)return;
    width=w;height=h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
  observer?.observe(canvas);
  window.addEventListener("resize",resize,{passive:true});
  let drag=false,lastX=0,rotationY=-.1,rotationX=0;
  canvas.addEventListener("pointerdown",(event)=>{
    drag=true;lastX=event.clientX;canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointermove",(event)=>{
    if(!drag)return;
    rotationY+=(event.clientX-lastX)*.007;
    rotationX=Math.max(-.35,Math.min(.35,rotationX));
    lastX=event.clientX;
  });
  const stopDrag=()=>drag=false;
  canvas.addEventListener("pointerup",stopDrag);
  canvas.addEventListener("pointercancel",stopDrag);
  canvas.addEventListener("webglcontextlost",(e)=>{
    e.preventDefault();
    canvas.style.display="none";fallback.style.display="block";
  });
  const clock=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    if(document.hidden)return;
    resize();
    const t=clock.getElapsedTime();
    if(effects){
      group.rotation.y+=Math.min(.015,(rotationY-group.rotation.y)*.02)+.0009;
      rotationY=group.rotation.y;
      group.rotation.x=THREE.MathUtils.lerp(group.rotation.x,rotationX,.025);
      group.position.y=-.1+Math.sin(t*.9)*.065;
      rings.forEach((r,i)=>r.rotation.z+=.001*(i===0?1:-1));
      sparkMat.uniforms.uTime.value=t;
      lantern.intensity=22+Math.sin(t*3.2)*5;
    }
    renderer.render(scene,camera);
  }
  try{resize();fallback.style.display="none";animate();}
  catch(e){console.warn("Pumpkin 3D unavailable:",e);canvas.style.display="none";fallback.style.display="block";}
}
createPumpkinScene();
