/**
 * Ravenhollow procedural castle (original geometry, no asset downloads).
 * Lazy Three.js initialization; every control has a functional 2D fallback.
 */
export function mountCastleTour(THREE,{isEffectsEnabled=()=>true}={}){
  const root=document.querySelector("#castle-tour");
  if(!root)return;
  const canvas=document.querySelector("#castle-tour-canvas");
  const stage=document.querySelector("#castle-tour-stage");
  const message=document.querySelector("#castle-tour-status");
  const modeLabel=document.querySelector("#castle-tour-mode");
  const toggle=document.querySelector("#castle-tour-start");
  const roomButtons=[...root.querySelectorAll("[data-castle-room]")];
  const roomNames={hall:"Đại Sảnh Bóng Đêm",library:"Thư Viện Bí Ẩn",tower:"Tháp Thiên Văn",crypt:"Hầm Mộ Cổ"};
  const roomPoints={hall:[0,2.15,2.5],library:[-3.65,4.3,1.8],tower:[3.65,5.05,-1.1],crypt:[0,1.4,-4.45]};
  let selected="hall",renderer=null,scene=null,camera=null,hotspots=[],glowObjects=[],raf=0,active=false,inView=true;
  let theta=.58,phi=.43,radius=13.8,dragging=false,moved=false,lastX=0,lastY=0,lastFrame=0;
  const target=new THREE.Vector3(0,2,0),wanted=new THREE.Vector3(0,2,0);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function showStatus(text){message.textContent=text;}
  function setMode(mode){
    root.dataset.renderMode=mode;
    canvas.dataset.renderMode=mode;
    canvas.setAttribute("aria-hidden",String(mode!=="webgl"));
    modeLabel.textContent=mode==="webgl"?"✦ REAL-TIME THREE.JS 3D":"✧ MINH HỌA 2D";
    toggle.setAttribute("aria-pressed",String(mode==="webgl"));
    toggle.textContent=mode==="webgl"?"✧ TẮT 3D":"✦ KÍCH HOẠT 3D";
    canvas.style.display=mode==="webgl"?"block":"none";
  }
  function pickRoom(id,notify=true){
    if(!Object.hasOwn(roomNames,id))return;
    selected=id;
    roomButtons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.castleRoom===id)));
    const point=roomPoints[id];
    wanted.set(point[0]*.25,2+point[1]*.15,point[2]*.25);
    for(const sphere of hotspots)sphere.material.emissiveIntensity=sphere.userData.room===id?2.2:1.0;
    if(notify)showStatus("✦ Đã chọn "+roomNames[id]+". Nhấn VÀO PHÒNG ĐÃ CHỌN để giải câu đố.");
  }
  function objectBox(w,h,d,color,x,y,z){
    const mat=new THREE.MeshStandardMaterial({color,roughness:.86,metalness:.12});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);scene.add(mesh);return mesh;
  }
  function tower(x,z,h,color){
    const wall=new THREE.Mesh(new THREE.CylinderGeometry(.86,.96,h,12),new THREE.MeshStandardMaterial({color,roughness:.92}));
    wall.position.set(x,h/2,z);scene.add(wall);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(1.34,1.75,12),new THREE.MeshStandardMaterial({color:0x473053,roughness:.7,metalness:.16}));
    roof.position.set(x,h+.92,z);scene.add(roof);
    const finial=new THREE.Mesh(new THREE.SphereGeometry(.13,8,8),new THREE.MeshStandardMaterial({color:0xffd28a,emissive:0xcd894b,emissiveIntensity:1.15}));
    finial.position.set(x,h+1.88,z);scene.add(finial);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      const block=new THREE.Mesh(new THREE.BoxGeometry(.27,.38,.31),new THREE.MeshStandardMaterial({color:0x8c7b9c}));
      block.position.set(x+Math.sin(a)*.82,h+.04,z+Math.cos(a)*.82);
      block.rotation.y=a;scene.add(block);
    }
    for(let i=0;i<3;i++){
      const window=new THREE.Mesh(new THREE.BoxGeometry(.27,.58,.09),new THREE.MeshStandardMaterial({color:0xffc971,emissive:0xffa638,emissiveIntensity:.75}));
      window.position.set(x,.9+i*1.13,z+.95);
      scene.add(window);
    }
  }
  function makeCastle(){
    scene=new THREE.Scene();scene.background=new THREE.Color(0x121027);
    scene.fog=new THREE.FogExp2(0x15102a,.018);
    scene.add(new THREE.HemisphereLight(0xc9b8ff,0x24152f,2.4));
    const gold=new THREE.PointLight(0xffae65,90,25);gold.position.set(-3,7,6);scene.add(gold);
    const violet=new THREE.PointLight(0x8454ed,90,26);violet.position.set(5,8,-5);scene.add(violet);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(7.7,8.15,.75,52),new THREE.MeshStandardMaterial({color:0x2a263b,roughness:.94}));
    base.position.y=-.46;scene.add(base);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(7.3,.055,6,88),new THREE.MeshBasicMaterial({color:0x926bc0,transparent:true,opacity:.6}));
    ring.rotation.x=Math.PI/2;ring.position.y=.01;scene.add(ring);
    objectBox(6.4,4.0,3.9,0x71637f,0,2.15,0);
    objectBox(6.55,.28,4.1,0x97849e,0,4.18,0);
    for(let i=-3;i<=3;i++){
      objectBox(.72,.52,.75,0x92829e,i*.93,4.52,1.75);
      objectBox(.72,.52,.75,0x92829e,i*.93,4.52,-1.75);
    }
    // Central keep, parapets, two near towers and two far towers.
    tower(-3.65,1.8,5.1,0x72627f);
    tower(3.65,1.8,5.25,0x6c597d);
    tower(-3.65,-1.8,6.1,0x665675);
    tower(3.65,-1.8,6.75,0x625270);
    tower(0,-2.45,7.1,0x78628a);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(2.8,2.6,4),new THREE.MeshStandardMaterial({color:0x3d294e,roughness:.77,metalness:.2}));
    roof.rotation.y=Math.PI/4;roof.position.set(0,6.35,0);scene.add(roof);
    for(let x of [-2.1,-.85,.85,2.1]){
      const window=objectBox(.4,.68,.08,0xffc26d,x,2.77,2.01);
      window.material.emissive=new THREE.Color(0xff9c36);window.material.emissiveIntensity=.65;
    }
    const gate=objectBox(1.55,2.45,.13,0x291830,0,1.27,2.05);
    const arch=new THREE.Mesh(new THREE.TorusGeometry(.81,.12,7,30,Math.PI),new THREE.MeshStandardMaterial({color:0xd9b67e,metalness:.4,roughness:.38}));
    arch.rotation.z=0;arch.position.set(0,2.51,2.18);scene.add(arch);
    const seam=objectBox(.04,2.15,.14,0xc49d64,0,1.12,2.19);
    for(let i=0;i<7;i++){
      const step=new THREE.Mesh(new THREE.BoxGeometry(1.8+i*.12,.16,.48),new THREE.MeshStandardMaterial({color:0x908096}));
      step.position.set(0,-.08+i*.10,2.45+i*.38);scene.add(step);
    }
    // Road and low spectral fire braziers.
    for(const x of [-2.45,2.45]){
      const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.35,.24,.34,10),new THREE.MeshStandardMaterial({color:0x4f3d59,metalness:.5}));
      bowl.position.set(x,.43,3.6);scene.add(bowl);
      const flame=new THREE.Mesh(new THREE.ConeGeometry(.21,.64,9),new THREE.MeshBasicMaterial({color:0xffb75b,transparent:true,opacity:.85}));
      flame.position.set(x,.92,3.6);scene.add(flame);glowObjects.push(flame);
    }
    // Four magical clickable points. Color-coded for orientation.
    const hues={hall:0xf3be7a,library:0xbe91fb,tower:0xbbe8ff,crypt:0x9ddcb1};
    for(const [id,position] of Object.entries(roomPoints)){
      const color=hues[id];
      const material=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:id===selected?2.2:1,roughness:.3,metalness:.17});
      const sphere=new THREE.Mesh(new THREE.SphereGeometry(.30,16,12),material);
      sphere.position.set(...position);sphere.userData.room=id;
      scene.add(sphere);hotspots.push(sphere);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.035,6,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));
      ring.position.copy(sphere.position);ring.userData.room=id;scene.add(ring);
      glowObjects.push(ring);
    }
    // A distant moon and original procedurally distributed points of light.
    const moon=new THREE.Mesh(new THREE.SphereGeometry(1.16,24,16),new THREE.MeshBasicMaterial({color:0xf7dfbe}));
    moon.position.set(-6.1,9,-11.4);scene.add(moon);
    const count=76,positions=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const angle=i*2.4,dist=8+(i*7%6);
      positions[i*3]=Math.cos(angle)*dist;
      positions[i*3+1]=4+(i*17%85)/8;
      positions[i*3+2]=-6-Math.sin(angle)*8;
    }
    const pointsGeo=new THREE.BufferGeometry();
    pointsGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
    const stars=new THREE.Points(pointsGeo,new THREE.PointsMaterial({color:0xffe0c0,size:.09,sizeAttenuation:true,transparent:true,opacity:.85}));
    scene.add(stars);
    camera=new THREE.PerspectiveCamera(44,1,.1,150);
    updateCamera(1);
  }
  function updateCamera(blend=.12){
    target.lerp(wanted,blend);
    const cos=Math.cos(phi);
    const x=target.x+Math.sin(theta)*cos*radius;
    const y=target.y+Math.sin(phi)*radius;
    const z=target.z+Math.cos(theta)*cos*radius;
    camera.position.set(x,y,z);camera.lookAt(target);
  }
  function resize(){
    if(!renderer||!camera)return;
    const rect=stage.getBoundingClientRect();
    const width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));
    const dpr=Math.min(window.devicePixelRatio||1,window.innerWidth<680?1.1:1.35);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  function dispose(){
    cancelAnimationFrame(raf);raf=0;
    if(scene){
      scene.traverse(node=>{
        node.geometry?.dispose?.();
        const materials=node.material?(Array.isArray(node.material)?node.material:[node.material]):[];
        for(const material of materials)material.dispose?.();
      });
    }
    try{renderer?.dispose();}catch(_){}
    renderer=null;scene=null;camera=null;hotspots=[];glowObjects=[];
  }
  function stop(reason){
    active=false;dragging=false;dispose();setMode("illustration");
    if(reason)showStatus(reason);
  }
  function renderFrame(now){
    if(!active)return;
    raf=requestAnimationFrame(renderFrame);
    if(document.hidden||!inView)return;
    if(now-lastFrame<(window.innerWidth<680?1000/25:1000/36))return;
    lastFrame=now;
    updateCamera();
    if(isEffectsEnabled()&&!reduceMotion){
      const t=now*.001;
      glowObjects.forEach((mesh,i)=>{mesh.rotation.z=Math.sin(t*.55+i)*.12;});
      hotspots.forEach((mesh,i)=>{mesh.scale.setScalar(1+Math.sin(t*1.8+i)*.09);});
    }
    try{renderer.render(scene,camera);}
    catch(error){stop("Không thể dựng 3D trên thiết bị này. Bản đồ 2D vẫn hoạt động.");console.info("Castle 3D rendering unavailable:",error?.message||error);}
  }
  function start(){
    if(active)return;
    if(!window.WebGLRenderingContext){
      stop("Trình duyệt không hỗ trợ WebGL. Bạn vẫn có thể chọn và khám phá bốn phòng ở chế độ 2D.");
      return;
    }
    try{
      canvas.style.display="block";
      renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"default",alpha:false});
      makeCastle();resize();renderer.render(scene,camera);
      active=true;lastFrame=0;setMode("webgl");
      showStatus("✦ Lâu đài 3D đã mở. Kéo để xoay hoặc chạm các quả cầu sáng để chọn phòng.");
      raf=requestAnimationFrame(renderFrame);
    }catch(error){
      stop("Thiết bị không tạo được cảnh 3D. Bản đồ 2D và toàn bộ các câu đố vẫn dùng được.");
      console.info("Castle WebGL fallback:",error?.message||error);
    }
  }
  toggle.addEventListener("click",()=>{if(active)stop("Đã tắt WebGL để tiết kiệm tài nguyên. Vẫn chọn phòng bằng nút được.");else start();});
  function orbit(delta){theta+=delta;canvas.dataset.orbitYaw=theta.toFixed(3);if(active)updateCamera(.22);}
  function zoom(delta){radius=THREE.MathUtils.clamp(radius+delta,7.6,22);canvas.dataset.orbitZoom=radius.toFixed(2);if(active)updateCamera(.22);}
  document.querySelector("#castle-tour-left").addEventListener("click",()=>orbit(-.28));
  document.querySelector("#castle-tour-right").addEventListener("click",()=>orbit(.28));
  document.querySelector("#castle-tour-zoom-in").addEventListener("click",()=>zoom(-1.4));
  document.querySelector("#castle-tour-zoom-out").addEventListener("click",()=>zoom(1.4));
  canvas.addEventListener("keydown",e=>{
    const deltas={ArrowLeft:-.22,ArrowRight:.22,ArrowUp:-.13,ArrowDown:.13};
    if(!(e.key in deltas))return;
    e.preventDefault();
    if(e.key==="ArrowLeft"||e.key==="ArrowRight")orbit(deltas[e.key]);
    else phi=THREE.MathUtils.clamp(phi+deltas[e.key],.13,1.17);
  });
  canvas.addEventListener("wheel",e=>{if(!active)return;e.preventDefault();zoom(Math.sign(e.deltaY)*.85);},{passive:false});
  canvas.addEventListener("pointerdown",e=>{
    if(!active)return;
    dragging=true;moved=false;lastX=e.clientX;lastY=e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointermove",e=>{
    if(!dragging||!active)return;
    const dx=e.clientX-lastX,dy=e.clientY-lastY;
    if(Math.abs(dx)+Math.abs(dy)>2)moved=true;
    theta-=dx*.008;canvas.dataset.orbitYaw=theta.toFixed(3);
    phi=THREE.MathUtils.clamp(phi+dy*.005,.13,1.17);
    lastX=e.clientX;lastY=e.clientY;
  });
  canvas.addEventListener("pointerup",e=>{
    if(!active)return;
    const clicked=dragging&&!moved;dragging=false;
    if(!clicked)return;
    const rect=canvas.getBoundingClientRect();
    pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const intersections=raycaster.intersectObjects(hotspots,false);
    if(intersections.length)pickRoom(intersections[0].object.userData.room);
  });
  canvas.addEventListener("pointercancel",()=>{dragging=false;});
  canvas.addEventListener("webglcontextlost",e=>{
    e.preventDefault();
    if(active)stop("Ngữ cảnh WebGL bị mất. Đã chuyển về minh họa 2D để tiếp tục khám phá.");
  });
  const viewObserver=typeof IntersectionObserver!=="undefined"
    ?new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??true;},{threshold:0}):null;
  viewObserver?.observe(root);
  if(typeof ResizeObserver!=="undefined")new ResizeObserver(()=>{if(active)resize();}).observe(stage);
  window.addEventListener("pagehide",()=>stop(),{once:true});
  roomButtons.forEach(button=>button.addEventListener("click",()=>pickRoom(button.dataset.castleRoom)));
  document.querySelector("#castle-tour-enter").addEventListener("click",()=>{
    const room=document.querySelector('#expedition-map [data-room="'+selected+'"]');
    room?.click();
    document.querySelector("#expedition-scene")?.scrollIntoView({block:"center",behavior:reduceMotion?"auto":"smooth"});
    showStatus("✦ Đã mở câu đố tại "+roomNames[selected]+".");
  });
  document.querySelectorAll("#expedition-map [data-room]").forEach(button=>{
    button.addEventListener("click",()=>pickRoom(button.dataset.room,false));
  });
  pickRoom("hall",false);
  canvas.dataset.orbitYaw=theta.toFixed(3);
  canvas.dataset.orbitZoom=radius.toFixed(2);
  setMode("illustration");
}