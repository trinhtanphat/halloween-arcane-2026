import { createCastleInterior } from "./castle-interiors.js";
import { createVaultChamber } from "./vault-chamber.js";
import { createCastleWayfinder } from "./castle-wayfinder.js";

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
  const viewToggle=document.querySelector("#castle-tour-view");
  const walkHud=document.querySelector("#castle-walk-hud");
  const walkPad=document.querySelector("#castle-walk-pad");
  const walkInteract=document.querySelector("#castle-walk-interact");
  const riddleDialog=document.querySelector("#castle-riddle-dialog");
  const vaultDialog=document.querySelector("#castle-vault-dialog");
  const vaultAction=document.querySelector("#castle-vault-action");
  const vaultUnlock=document.querySelector("#castle-vault-unlock");
  const vaultEnter=document.querySelector("#castle-vault-enter");
  const crownDialog=document.querySelector("#castle-crown-dialog");
  const riddleChoices=document.querySelector("#castle-riddle-choices");
  const riddleFeedback=document.querySelector("#castle-riddle-feedback");
  const interiorExit=document.querySelector("#castle-interior-exit");
  const roomButtons=[...root.querySelectorAll("[data-castle-room]")];
  const roomNames={hall:"Đại Sảnh Bóng Đêm",library:"Thư Viện Bí Ẩn",tower:"Tháp Thiên Văn",crypt:"Hầm Mộ Cổ"};
  const roomPoints={hall:[0,2.15,2.5],library:[-3.65,4.3,1.8],tower:[3.65,5.05,-1.1],crypt:[0,1.4,-4.45]};
  let selected="hall",renderer=null,scene=null,camera=null,hotspots=[],glowObjects=[],raf=0,active=false,inView=true;
  let theta=.58,phi=.43,radius=13.8,dragging=false,moved=false,lastX=0,lastY=0,lastFrame=0;
  let viewMode="orbit",walkX=0,walkZ=11.5,walkYaw=0,walkPitch=-.08,walkNear=null,walkLast=0,walkPortals=[];
  let zone="courtyard",interior=null,exteriorObjects=[],outsidePosition=null;
  let vaultChest=null,vaultLid=null,vaultGem=null;
  const vaultPosition={x:0,z:13.45};
  const walkKeys=new Set();
  const walkHeld=new Map();
  const HOLD_DELAY=170;
  function clearWalkInput(){walkKeys.clear();walkHeld.clear();root.querySelectorAll("[data-walk-action]").forEach(b=>{delete b.dataset.pressed;});}
  const target=new THREE.Vector3(0,2,0),wanted=new THREE.Vector3(0,2,0);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wayfinder=createCastleWayfinder({
    root:document.querySelector("#castle-wayfinder"),
    canvas:document.querySelector("#castle-wayfinder-map"),
    roomNames,
    getState:()=>({active,viewMode,zone,x:walkX,z:walkZ,yaw:walkYaw,
      roomId:interior?.roomId,selected,collected:vaultProgress().collected,opened:vaultProgress().completed})
  });
  function showStatus(text){message.textContent=text;}
  function setMode(mode){
    root.dataset.renderMode=mode;
    canvas.dataset.renderMode=mode;
    canvas.setAttribute("aria-hidden",String(mode!=="webgl"));
    modeLabel.textContent=mode==="webgl"?"✦ REAL-TIME THREE.JS 3D":"✧ MINH HỌA 2D";
    toggle.setAttribute("aria-pressed",String(mode==="webgl"));
    toggle.textContent=mode==="webgl"?"✧ TẮT 3D":"✦ KÍCH HOẠT 3D";
    canvas.style.display=mode==="webgl"?"block":"none";
    if(mode!=="webgl"){viewMode="orbit";clearWalkInput();}
    root.dataset.tourView=viewMode;
    root.dataset.tourZone=zone;
    viewToggle.disabled=mode!=="webgl";
    viewToggle.setAttribute("aria-pressed",String(mode==="webgl"&&viewMode==="walk"));
    viewToggle.textContent=viewMode==="walk"?"✧ TRỞ VỀ TOÀN CẢNH":"🚶 ĐI BỘ WASD";
    walkHud.hidden=mode!=="webgl"||viewMode!=="walk";
    walkPad.hidden=mode!=="webgl"||viewMode!=="walk";
    interiorExit.hidden=mode!=="webgl"||(zone!=="interior"&&zone!=="vault-chamber");
    wayfinder.sync(true);
  }
  function pickRoom(id,notify=true){
    if(!Object.hasOwn(roomNames,id))return;
    selected=id;
    roomButtons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.castleRoom===id)));
    const point=roomPoints[id];
    wanted.set(point[0]*.25,2+point[1]*.15,point[2]*.25);
    for(const sphere of hotspots)sphere.material.emissiveIntensity=sphere.userData.room===id?2.2:1.0;
    if(notify){showStatus("✦ Đã chọn "+roomNames[id]+". Nhấn VÀO PHÒNG ĐÃ CHỌN để giải câu đố.");wayfinder.choose(id);}
  }
  function vaultProgress(){
    const collected=[...document.querySelectorAll("#expedition-map .expedition-room.found")]
      .map(node=>node.dataset.room);
    const completed=!document.querySelector("#expedition-final")?.hidden;
    return {collected,completed,ready:collected.length===4};
  }
  function refreshVaultDialog(){
    const progress=vaultProgress();
    const relicNames={
      hall:"Ngọn Nến Hoàng Hôn",
      library:"Trang Sách Vĩnh Cửu",
      tower:"Mảnh Trăng Bạc",
      crypt:"Ấn Chú Ngàn Năm"
    };
    const icons={hall:"♜",library:"❖",tower:"☽",crypt:"✶"};
    const relics=document.querySelector("#castle-vault-relics");
    relics.replaceChildren();
    for(const id of Object.keys(relicNames)){
      const found=progress.collected.includes(id);
      const row=document.createElement("div");
      row.className="castle-vault-relic";
      row.dataset.collected=String(found);
      row.setAttribute("role","listitem");
      const glyph=document.createElement("b");
      glyph.textContent=found?"✓":icons[id];
      const name=document.createElement("span");
      name.textContent=relicNames[id]+(found?" — đã có":" — còn thiếu");
      row.append(glyph,name);
      relics.append(row);
    }
    vaultDialog.dataset.completed=String(progress.completed);
    document.querySelector("#castle-vault-feedback").textContent=progress.completed
      ?"✦ Đã mở kho báu! Vương Miện Bí Ẩn thuộc về người giữ Ravenhollow."
      :progress.ready?"✦ Bốn cổ vật đã hội tụ. Hãy giải phong ấn kho báu!"
      :"☽ Đã có "+progress.collected.length+"/4 cổ vật. Cần thêm "+(4-progress.collected.length)+" cổ vật để mở khóa.";
    vaultUnlock.disabled=!progress.ready||progress.completed;
    vaultUnlock.textContent=progress.completed?"✦ KHO BÁU ĐÃ MỞ":progress.ready
      ?"✦ GIẢI PHONG ẤN KHO BÁU":"♛ CẦN ĐỦ BỐN CỔ VẬT";
    vaultEnter.hidden=!(progress.completed&&active&&viewMode==="walk"&&zone==="courtyard"&&nearVault());
    vaultEnter.disabled=vaultEnter.hidden;
    return progress;
  }
  function syncVaultState(){
    const progress=vaultProgress();
    if(zone==="vault-chamber"&&!progress.completed)exitInterior();
    root.dataset.vaultState=progress.completed?"opened":progress.ready?"ready":"locked";
    root.dataset.vaultRelics=String(progress.collected.length);
    vaultAction.setAttribute("aria-label",progress.completed?"Kho báu đã mở":progress.ready
      ?"Đã đủ bốn cổ vật, khám phá kho báu cuối":"Kho báu đang khóa, thu thập đủ bốn cổ vật");
    if(vaultGem){
      vaultGem.material.color.setHex(progress.completed?0xc8f0a5:progress.ready?0xffe8a1:0xdcb46e);
      vaultGem.material.emissive.setHex(progress.completed?0x8fd96b:progress.ready?0xe6b979:0xc78c42);
      vaultGem.material.emissiveIntensity=progress.completed?2.7:progress.ready?1.6:.4;
    }
    if(!active||reduceMotion||!isEffectsEnabled()){
      if(vaultLid)vaultLid.rotation.x=progress.completed?-1.12:0;
    }
    if(vaultDialog.open)refreshVaultDialog();
    wayfinder.sync(true);
  }
  function closeVaultDialog(){
    if(vaultDialog.open)vaultDialog.close();
  }
  function openVaultDialog(fromWorld=false){
    if(riddleDialog.open||vaultDialog.open)return;
    if(fromWorld&&(!active||viewMode!=="walk"||zone!=="courtyard"||!nearVault())){
      showStatus("☽ Hãy đến gần rương báu ở cuối sân lâu đài.");
      return;
    }
    clearWalkInput();dragging=false;
    refreshVaultDialog();
    vaultDialog.showModal();
    (vaultUnlock.disabled?document.querySelector("#castle-vault-return"):vaultUnlock)?.focus();
    showStatus("♛ Bạn đã tìm thấy kho báu cuối cùng của Ravenhollow.");
  }
  function nearVault(){
    return zone==="courtyard"&&Math.hypot(walkX-vaultPosition.x,walkZ-vaultPosition.z)<=1.55;
  }
  vaultAction.addEventListener("click",()=>{
    if(active&&viewMode==="walk"&&zone==="interior"){
      showStatus("☽ Hãy rời phòng để đến rương báu ngoài sân.");
      return;
    }
    openVaultDialog(active&&viewMode==="walk");
  });
  document.querySelector("#castle-vault-close").addEventListener("click",closeVaultDialog);
  document.querySelector("#castle-vault-return").addEventListener("click",closeVaultDialog);
  vaultEnter.addEventListener("click",()=>{
    if(vaultEnter.disabled||!vaultProgress().completed)return;
    closeVaultDialog();
    enterVaultChamber();
  });
  vaultDialog.addEventListener("close",()=>{
    clearWalkInput();
    if(active&&viewMode==="walk")canvas.focus({preventScroll:true});
  });
  vaultUnlock.addEventListener("click",()=>{
    const progress=vaultProgress();
    if(!progress.ready||progress.completed)return;
    const canonical=document.querySelector("#vault-open");
    if(canonical?.disabled)return;
    canonical.click();
    syncVaultState();
    refreshVaultDialog();
    showStatus("✦ Kho báu 3D đã giải phong ấn — Vương Miện Bí Ẩn đã được nhận!");
  });
  window.addEventListener("ravenhollow-progress",syncVaultState);
  // Module scripts can execute before expedition.js has restored saved relics.
  // Reconcile 3D quest/vault state after all deferred modules have initialized.
  window.addEventListener("load",syncVaultState,{once:true});
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
    // A final 3D treasury chest in the courtyard, locked to four quest relics.
    vaultChest=new THREE.Group();
    vaultChest.position.set(vaultPosition.x,0,vaultPosition.z);
    scene.add(vaultChest);
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.14,.28,12),new THREE.MeshStandardMaterial({color:0x6f597c,roughness:.8}));
    plinth.position.y=.12;vaultChest.add(plinth);
    const wood=new THREE.MeshStandardMaterial({color:0x633d35,roughness:.7,metalness:.1});
    const metal=new THREE.MeshStandardMaterial({color:0xe2ba72,metalness:.65,roughness:.29});
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.45,.81,.86),wood);
    body.position.y=.7;vaultChest.add(body);
    for(const z of [-.47,.47]){
      const band=new THREE.Mesh(new THREE.BoxGeometry(1.54,.16,.08),metal);
      band.position.set(0,.75,z);vaultChest.add(band);
    }
    const lock=new THREE.Mesh(new THREE.BoxGeometry(.26,.3,.1),metal);
    lock.position.set(0,.76,.48);vaultChest.add(lock);
    vaultLid=new THREE.Group();
    vaultLid.position.set(0,1.12,-.43);
    vaultChest.add(vaultLid);
    const lid=new THREE.Mesh(new THREE.BoxGeometry(1.58,.26,1.02),wood);
    lid.position.set(0,.14,.45);vaultLid.add(lid);
    for(const x of [-.55,.55]){
      const band=new THREE.Mesh(new THREE.BoxGeometry(.12,.3,1.08),metal);
      band.position.set(x,.15,.45);vaultLid.add(band);
    }
    const glow=new THREE.MeshStandardMaterial({color:0xdcb46e,emissive:0xc78c42,emissiveIntensity:.4,metalness:.3});
    vaultGem=new THREE.Mesh(new THREE.OctahedronGeometry(.33,0),glow);
    vaultGem.position.set(0,1.65,0);vaultChest.add(vaultGem);
    const sigil=new THREE.Mesh(new THREE.TorusGeometry(.74,.045,6,40),new THREE.MeshBasicMaterial({color:0xe3bc77}));
    sigil.rotation.x=Math.PI/2;sigil.position.y=1.33;vaultChest.add(sigil);
    const vaultLight=new THREE.PointLight(0xe4ac6a,7,5);
    vaultLight.position.set(0,1.9,0);vaultChest.add(vaultLight);
    syncVaultState();
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
    // The front courtyard is walkable in first-person view, without external models.
    objectBox(15,.18,12,0x272438,0,-.34,9);
    objectBox(2.5,.055,10.8,0x6f607a,0,-.215,9.05);
    for(let i=0;i<8;i++){
      const z=4.7+i*1.18;
      for(const x of [-1.4,1.4]){
        objectBox(.25,.085,.65,0x8b799b,x,-.16,z);
      }
    }
    const portals=[
      {id:"hall",x:-3.6,z:5.75,color:0xf3be7a},
      {id:"library",x:-1.35,z:6.8,color:0xbe91fb},
      {id:"tower",x:1.35,z:6.8,color:0xbbe8ff},
      {id:"crypt",x:3.6,z:5.75,color:0x9ddcb1}
    ];
    for(const portal of portals){
      // A paired set of standing stones surrounds a glowing crystal.
      for(const offset of [-.57,.57]){
        objectBox(.3,2.05,.37,0x82728f,portal.x+offset,.97,portal.z);
        objectBox(.43,.17,.42,0xc3a783,portal.x+offset,2.03,portal.z);
      }
      objectBox(1.4,.23,.42,0x9b849e,portal.x,2.15,portal.z);
      const crystal=new THREE.Mesh(
        new THREE.OctahedronGeometry(.34,0),
        new THREE.MeshStandardMaterial({color:portal.color,emissive:portal.color,emissiveIntensity:1.75,metalness:.22,roughness:.24})
      );
      crystal.position.set(portal.x,1.55,portal.z);crystal.userData.room=portal.id;
      scene.add(crystal);walkPortals.push(crystal);
      const aura=new THREE.PointLight(portal.color,6,3);
      aura.position.copy(crystal.position);scene.add(aura);
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
  function updateWalkCamera(){
    if(!camera)return;
    camera.position.set(walkX,1.64,walkZ);
    camera.lookAt(walkX-Math.sin(walkYaw),1.64+Math.sin(walkPitch),walkZ-Math.cos(walkYaw));
    canvas.dataset.walkX=walkX.toFixed(2);
    canvas.dataset.walkZ=walkZ.toFixed(2);
    canvas.dataset.walkYaw=walkYaw.toFixed(3);
    canvas.dataset.walkZone=zone;
    document.querySelector("#castle-walk-coords").textContent="X "+walkX.toFixed(1)+" · Z "+walkZ.toFixed(1);
    wayfinder.sync();
  }
  function disposeInterior(){
    if(!interior||!scene)return;
    const group=interior.group;
    scene.remove(group);
    group.traverse(node=>{
      node.geometry?.dispose?.();
      const mats=node.material?(Array.isArray(node.material)?node.material:[node.material]):[];
      mats.forEach(mat=>mat.dispose?.());
    });
    interior=null;
    exteriorObjects.forEach(obj=>{obj.visible=true;});
    exteriorObjects=[];
  }
  function closeRelicRiddle(){
    if(riddleDialog.open)riddleDialog.close();
  }
  function refreshRelicRiddle(){
    if(!interior)return;
    const id=interior.roomId;
    // Existing expedition logic remains the single source of truth for riddles,
    // correct answers, localStorage relics and Arcane Passport updates.
    const current=document.querySelector("#expedition-scene")?.dataset.roomScene;
    if(current!==id)document.querySelector('#expedition-map [data-room="'+id+'"]')?.click();
    document.querySelector("#castle-riddle-room").textContent=roomNames[id];
    document.querySelector("#castle-riddle-story").textContent=document.querySelector("#expedition-room-story")?.textContent||"";
    document.querySelector("#castle-riddle-question").textContent=document.querySelector("#expedition-question")?.textContent||"";
    const previousButtons=[...document.querySelectorAll("#expedition-answers [data-answer]")];
    riddleChoices.replaceChildren();
    for(const original of previousButtons){
      const button=document.createElement("button");
      button.type="button";
      button.dataset.riddleAnswer=original.dataset.answer;
      button.disabled=original.disabled;
      if(original.classList.contains("wrong"))button.classList.add("wrong");
      if(original.classList.contains("correct"))button.classList.add("correct");
      const number=document.createElement("span");
      number.textContent=String(Number(original.dataset.answer)+1);
      number.setAttribute("aria-hidden","true");
      const answer=document.createElement("strong");
      answer.textContent=original.lastElementChild?.textContent||original.textContent;
      button.append(number,answer);
      button.addEventListener("click",()=>{
        if(button.disabled)return;
        original.click();
        refreshRelicRiddle();
        const same=riddleChoices.querySelector('[data-riddle-answer="'+original.dataset.answer+'"]');
        if(same&&!same.disabled)same.focus();
        else document.querySelector("#castle-riddle-continue").focus();
      });
      riddleChoices.append(button);
    }
    const found=!document.querySelector("#expedition-relic")?.hidden;
    riddleFeedback.textContent=document.querySelector("#expedition-feedback")?.textContent||"";
    document.querySelector("#castle-riddle-earned").hidden=!found;
    document.querySelector("#castle-riddle-relic-name").textContent=
      found?(document.querySelector("#expedition-relic-name")?.textContent||"CỔ VẬT ĐÃ ĐƯỢC THU THẬP"):"";
    if(interior.relic?.material){
      const originalColors={hall:0xffc57f,library:0xb99aff,tower:0xa9d8ff,crypt:0x91d6a4};
      interior.relic.material.color.setHex(found?0xa8e7ae:originalColors[id]);
      interior.relic.material.emissive.setHex(found?0x78d594:originalColors[id]);
      interior.relic.material.emissiveIntensity=found?2.3:1.6;
    }
    root.dataset.riddleSolved=String(found);
  }
  function openRelicRiddle(){
    if(!active||viewMode!=="walk"||zone!=="interior"||!interior)return;
    if(nearestPortal()!==interior.roomId){
      showStatus("☽ Hãy tiến gần cổ vật phát sáng trước khi mở câu đố.");
      return;
    }
    clearWalkInput();dragging=false;
    refreshRelicRiddle();
    if(!riddleDialog.open)riddleDialog.showModal();
    const first=riddleChoices.querySelector("button:not(:disabled)")||document.querySelector("#castle-riddle-continue");
    first?.focus();
    showStatus("✦ Đang giải câu đố tại "+roomNames[interior.roomId]+".");
  }
  document.querySelector("#castle-riddle-close").addEventListener("click",closeRelicRiddle);
  document.querySelector("#castle-riddle-continue").addEventListener("click",closeRelicRiddle);
  riddleDialog.addEventListener("close",()=>{
    clearWalkInput();
    if(active&&viewMode==="walk"&&zone==="interior")canvas.focus({preventScroll:true});
  });
  document.addEventListener("keydown",e=>{
    if(!riddleDialog.open)return;
    if(["1","2","3"].includes(e.key)){
      e.preventDefault();
      riddleChoices.querySelector('[data-riddle-answer="'+(Number(e.key)-1)+'"]:not(:disabled)')?.click();
    }
  },{capture:true});
  function closeCrownDialog(){
    if(crownDialog.open)crownDialog.close();
  }
  function nearCrown(){
    return zone==="vault-chamber"&&interior?.roomId==="vault"&&
      Math.hypot(walkX-interior.relic.position.x,walkZ-interior.relic.position.z)<=2.05;
  }
  function showCrownFinale(){
    if(!active||viewMode!=="walk"||!vaultProgress().completed||!nearCrown()){
      showStatus("☽ Hãy bước đến gần Vương Miện Bí Ẩn trên ngai.");
      return;
    }
    clearWalkInput();
    let wizard="Người Giữ Ravenhollow";
    try{
      const value=localStorage.getItem("ravenhollow-wizard");
      if(value&&value.trim())wizard=value.trim().slice(0,40);
    }catch(_){}
    document.querySelector("#castle-crown-player").textContent="✦ Chào mừng "+wizard+" — người giữ vương miện!";
    if(!crownDialog.open)crownDialog.showModal();
    document.querySelector("#castle-crown-continue")?.focus();
    showStatus("♛ Vương Miện Bí Ẩn đã công nhận bạn là người giữ kho báu.");
  }
  document.querySelector("#castle-crown-close").addEventListener("click",closeCrownDialog);
  document.querySelector("#castle-crown-continue").addEventListener("click",closeCrownDialog);
  crownDialog.addEventListener("close",()=>{
    clearWalkInput();
    if(active&&viewMode==="walk")canvas.focus({preventScroll:true});
  });
  function enterVaultChamber(){
    if(!active||viewMode!=="walk"||zone!=="courtyard"||!vaultProgress().completed||!nearVault()){
      showStatus("☽ Mật thất chỉ mở sau khi giải phong ấn kho báu và đến gần rương.");
      return;
    }
    const previous={x:walkX,z:walkZ,yaw:walkYaw,pitch:walkPitch};
    try{
      const chamber=createVaultChamber(THREE);
      const outside=[...scene.children];
      outside.forEach(obj=>{obj.visible=false;});
      scene.add(chamber.group);
      interior=chamber;exteriorObjects=outside;outsidePosition=previous;
      zone="vault-chamber";root.dataset.tourZone=zone;root.dataset.interiorRoom="vault";
      walkX=0;walkZ=3.1;walkYaw=0;walkPitch=-.08;
      clearWalkInput();walkNear=null;walkLast=0;
      interiorExit.hidden=false;interiorExit.textContent="↩ RỜI MẬT THẤT";
      updateWalkCamera();updateNearby();
      showStatus("♛ Đã bước vào mật thất. Tiến đến vương miện trên ngai và nhấn E.");
    }catch(error){
      disposeInterior();zone="courtyard";root.dataset.tourZone=zone;
      showStatus("Không thể dựng mật thất 3D. Kho báu 2D và thành tích vẫn có thể xem được.");
      console.info("Vault chamber unavailable:",error?.message||error);
    }
  }
  function enterInterior(id){
    if(!active||viewMode!=="walk"||zone!=="courtyard"||!Object.hasOwn(roomNames,id))return;
    const previous={x:walkX,z:walkZ,yaw:walkYaw,pitch:walkPitch};
    try{
      const room=createCastleInterior(THREE,id);
      const outside=[...scene.children];
      outside.forEach(obj=>{obj.visible=false;});
      scene.add(room.group);
      interior=room;exteriorObjects=outside;outsidePosition=previous;
      zone="interior";root.dataset.tourZone=zone;root.dataset.interiorRoom=id;
      pickRoom(id,false);
      walkX=0;walkZ=3.15;walkYaw=0;walkPitch=-.08;
      clearWalkInput();walkNear=null;walkLast=0;
      updateWalkCamera();updateNearby();
      interiorExit.hidden=false;
      // Match the existing expedition selection without revealing its answer.
      document.querySelector('#expedition-map [data-room="'+id+'"]')?.click();
      showStatus("✦ Đang ở trong "+roomNames[id]+". Tìm cổ vật phát sáng và nhấn E để mở câu đố.");
    }catch(error){
      disposeInterior();zone="courtyard";root.dataset.tourZone=zone;
      showStatus("Không thể mở nội thất 3D. Bạn vẫn có thể vào câu đố bằng bản đồ.");
      console.info("Interior 3D unavailable:",error?.message||error);
    }
  }
  function exitInterior(){
    if(zone!=="interior"&&zone!=="vault-chamber")return;
    closeRelicRiddle();closeCrownDialog();
    disposeInterior();zone="courtyard";
    root.dataset.tourZone=zone;
    delete root.dataset.interiorRoom;
    const restore=outsidePosition||{x:0,z:11.5,yaw:0,pitch:-.08};
    walkX=restore.x;walkZ=restore.z;walkYaw=restore.yaw;walkPitch=restore.pitch;
    outsidePosition=null;clearWalkInput();walkNear=null;
    interiorExit.hidden=true;interiorExit.textContent="↩ RỜI PHÒNG";
    wayfinder.reset();
    updateWalkCamera();updateNearby();
    showStatus("✦ Đã ra sân lâu đài. Đến gần cổng khác để khám phá phòng tiếp theo.");
  }
  function nearestPortal(){
    if(zone==="vault-chamber")return nearCrown()?"crown":null;
    if(zone==="courtyard"&&nearVault())return "vault";
    if(zone==="interior"&&interior){
      return Math.hypot(interior.relic.position.x-walkX,interior.relic.position.z-walkZ)<=1.75
        ?interior.roomId:null;
    }
    let nearest=null,distance=Infinity;
    for(const portal of walkPortals){
      const d=Math.hypot(portal.position.x-walkX,portal.position.z-walkZ);
      if(d<distance){distance=d;nearest=portal.userData.room;}
    }
    return distance<=1.85?nearest:null;
  }
  function updateNearby(){
    const found=nearestPortal();
    walkInteract.disabled=!(active&&viewMode==="walk"&&found);
    walkInteract.textContent=zone==="vault-chamber"?"♛ VƯƠNG MIỆN":zone==="interior"?"✦ GIẢI CÂU ĐỐ":found==="vault"?"♛ KHO BÁU":"✦ VÀO CỔNG";
    document.querySelector("#castle-walk-nearby").textContent=zone==="vault-chamber"
      ?(found==="crown"?"♛ VƯƠNG MIỆN TRONG TẦM TAY — NHẤN E ĐỂ CHIÊM NGƯỠNG":"ĐẾN GẦN VƯƠNG MIỆN TRÊN NGAI ĐỂ XEM ĐOẠN KẾT")
      :zone==="interior"
      ?(found?"✦ CỔ VẬT ĐÃ Ở TRONG TẦM TAY — NHẤN E ĐỂ GIẢI ĐỐ":"TÌM CỔ VẬT PHÁT SÁNG Ở CUỐI PHÒNG — NHẤN E KHI ĐẾN GẦN")
      :(found==="vault"?"♛ RƯƠNG BÁU CUỐI CÙNG — NHẤN E ĐỂ KIỂM TRA CỔ VẬT":found?"✦ CỔNG "+roomNames[found].toUpperCase()+" — NHẤN E / VÀO CỔNG"
      :"ĐI ĐẾN MỘT TRONG BỐN CỔNG SÁNG ĐỂ TƯƠNG TÁC");
    if(found!==walkNear){
      walkNear=found;
      if(found)showStatus(zone==="vault-chamber"
        ?"♛ Đã đến gần Vương Miện Bí Ẩn. Nhấn E để xem đoạn kết."
        :zone==="interior"
        ?"✦ Đã tìm thấy cổ vật trong "+roomNames[found]+". Nhấn E để giải câu đố."
        :found==="vault"?"♛ Đã đến rương báu. Nhấn E để giải phong ấn.":"✦ Đã đến cổng "+roomNames[found]+". Nhấn E để đi vào nội thất 3D.");
    }
  }
  function walkMove(forward=0,strafe=0,units=.65){
    if(!active||viewMode!=="walk"||riddleDialog.open||vaultDialog.open||crownDialog.open)return;
    const length=Math.hypot(forward,strafe)||1;
    forward/=length;strafe/=length;
    // Solid courtyard bounds keep the player outside castle walls and cliffs.
    const dx=(-Math.sin(walkYaw)*forward+Math.cos(walkYaw)*strafe)*units;
    const dz=(-Math.cos(walkYaw)*forward-Math.sin(walkYaw)*strafe)*units;
    if((zone==="interior"||zone==="vault-chamber")&&interior){
      const radius=.28;
      const blocked=(x,z)=>interior.colliders.some(c=>
        x>c.minX-radius&&x<c.maxX+radius&&z>c.minZ-radius&&z<c.maxZ+radius);
      const nextX=THREE.MathUtils.clamp(walkX+dx,-4.05,4.05);
      if(!blocked(nextX,walkZ))walkX=nextX;
      const nextZ=THREE.MathUtils.clamp(walkZ+dz,-4.05,4.05);
      if(!blocked(walkX,nextZ))walkZ=nextZ;
    }else{
      walkX=THREE.MathUtils.clamp(walkX+dx,-6.6,6.6);
      walkZ=THREE.MathUtils.clamp(walkZ+dz,4.75,14.2);
    }
    updateWalkCamera();updateNearby();
  }
  function updateWalkMovement(now){
    if(riddleDialog.open||vaultDialog.open||crownDialog.open){clearWalkInput();walkLast=now;return;}
    const delta=Math.min(.065,Math.max(0,(now-walkLast)/1000));
    walkLast=now;
    if(!walkKeys.size&&!walkHeld.size)return;
    // Hold a mobile direction pad for continuous movement; a quick tap stays a single step.
    const pressed=action=>{
      const press=walkHeld.get(action);
      if(!press||now-press.started<HOLD_DELAY)return false;
      press.moved=true;
      return true;
    };
    const forward=Number(walkKeys.has("w")||walkKeys.has("arrowup")||pressed("forward"))-Number(walkKeys.has("s")||walkKeys.has("arrowdown")||pressed("back"));
    const strafe=Number(walkKeys.has("d")||pressed("right"))-Number(walkKeys.has("a")||pressed("left"));
    if(walkKeys.has("arrowleft")||pressed("turn-left"))walkYaw-=delta*1.6;
    if(walkKeys.has("arrowright")||pressed("turn-right"))walkYaw+=delta*1.6;
    if(forward||strafe)walkMove(forward,strafe,delta*4.25);
    else updateWalkCamera();
  }
  function switchView(){
    if(!active)return;
    if(viewMode==="walk"&&(zone==="interior"||zone==="vault-chamber"))exitInterior();
    viewMode=viewMode==="walk"?"orbit":"walk";
    clearWalkInput();dragging=false;
    if(viewMode==="walk"){
      walkX=0;walkZ=11.5;walkYaw=0;walkPitch=-.08;
      updateWalkCamera();updateNearby();
      showStatus("✦ Đang đi bộ ngoài sân lâu đài. W/A/S/D di chuyển, mũi tên quay, E vào cổng.");
      canvas.focus({preventScroll:true});
    }else{
      updateCamera(1);
      showStatus("✦ Đã trở lại góc nhìn toàn cảnh 3D.");
    }
    root.dataset.tourView=viewMode;
    viewToggle.setAttribute("aria-pressed",String(viewMode==="walk"));
    viewToggle.textContent=viewMode==="walk"?"✧ TRỞ VỀ TOÀN CẢNH":"🚶 ĐI BỘ WASD";
    walkHud.hidden=viewMode!=="walk";walkPad.hidden=viewMode!=="walk";
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
    renderer=null;scene=null;camera=null;hotspots=[];glowObjects=[];walkPortals=[];
    interior=null;exteriorObjects=[];outsidePosition=null;zone="courtyard";
    vaultChest=null;vaultLid=null;vaultGem=null;
    delete root.dataset.interiorRoom;root.dataset.tourZone=zone;
  }
  function stop(reason){
    closeVaultDialog();closeCrownDialog();
    active=false;closeRelicRiddle();dragging=false;clearWalkInput();walkNear=null;dispose();setMode("illustration");
    wayfinder.reset();
    if(reason)showStatus(reason);
  }
  function renderFrame(now){
    if(!active)return;
    raf=requestAnimationFrame(renderFrame);
    if(document.hidden||!inView){walkLast=now;return;}
    if(now-lastFrame<(window.innerWidth<680?1000/25:1000/36))return;
    lastFrame=now;
    if(viewMode==="walk")updateWalkMovement(now);
    else updateCamera();
    if(vaultLid){
      const open=vaultProgress().completed;
      const targetAngle=open?-1.12:0;
      vaultLid.rotation.x=(reduceMotion||!isEffectsEnabled())?targetAngle:THREE.MathUtils.lerp(vaultLid.rotation.x,targetAngle,.085);
    }
    if(interior&&isEffectsEnabled()&&!reduceMotion){
      interior.relic.rotation.y=now*.0008;
      interior.relicHalo.rotation.z=now*.00035;
    }
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
      active=true;lastFrame=0;walkLast=0;setMode("webgl");
      showStatus("✦ Lâu đài 3D đã mở. Kéo để xoay hoặc chạm các quả cầu sáng để chọn phòng.");
      raf=requestAnimationFrame(renderFrame);
    }catch(error){
      stop("Thiết bị không tạo được cảnh 3D. Bản đồ 2D và toàn bộ các câu đố vẫn dùng được.");
      console.info("Castle WebGL fallback:",error?.message||error);
    }
  }
  toggle.addEventListener("click",()=>{if(active)stop("Đã tắt WebGL để tiết kiệm tài nguyên. Vẫn chọn phòng bằng nút được.");else start();});
  viewToggle.addEventListener("click",switchView);
  function walkStep(action){
    if(!active||viewMode!=="walk"||riddleDialog.open||vaultDialog.open||crownDialog.open)return;
    if(action==="forward")walkMove(1,0,.7);
    if(action==="back")walkMove(-1,0,.7);
    if(action==="left")walkMove(0,-1,.7);
    if(action==="right")walkMove(0,1,.7);
    if(action==="turn-left"){walkYaw-=.24;updateWalkCamera();wayfinder.sync(true);}
    if(action==="turn-right"){walkYaw+=.24;updateWalkCamera();wayfinder.sync(true);}
  }
  root.querySelectorAll("[data-walk-action]").forEach(button=>{
    const action=button.dataset.walkAction;
    let lastPress=null,ignoreNextPointerClick=false;
    button.addEventListener("pointerdown",e=>{
      if((e.pointerType==="mouse"&&e.button!==0)||!active||viewMode!=="walk"||riddleDialog.open||vaultDialog.open||crownDialog.open)return;
      ignoreNextPointerClick=false;
      lastPress={started:performance.now(),pointerId:e.pointerId,moved:false};
      walkHeld.set(action,lastPress);
      button.dataset.pressed="true";
      button.setPointerCapture?.(e.pointerId);
    });
    button.addEventListener("pointerup",e=>{
      if(!lastPress||lastPress.pointerId!==e.pointerId)return;
      ignoreNextPointerClick=lastPress.moved;
      if(walkHeld.get(action)===lastPress)walkHeld.delete(action);
      delete button.dataset.pressed;
      lastPress=null;
    });
    button.addEventListener("pointercancel",()=>{
      if(walkHeld.get(action)===lastPress)walkHeld.delete(action);
      delete button.dataset.pressed;lastPress=null;
      ignoreNextPointerClick=true;
    });
    button.addEventListener("click",e=>{
      // A long-press already moved continuously, so never add an extra tap step.
      if(ignoreNextPointerClick&&e.detail!==0){ignoreNextPointerClick=false;return;}
      ignoreNextPointerClick=false;
      walkStep(action);
    });
  });
  function orbit(delta){theta+=delta;canvas.dataset.orbitYaw=theta.toFixed(3);if(active)updateCamera(.22);}
  function zoom(delta){radius=THREE.MathUtils.clamp(radius+delta,7.6,22);canvas.dataset.orbitZoom=radius.toFixed(2);if(active)updateCamera(.22);}
  document.querySelector("#castle-tour-left").addEventListener("click",()=>orbit(-.28));
  document.querySelector("#castle-tour-right").addEventListener("click",()=>orbit(.28));
  document.querySelector("#castle-tour-zoom-in").addEventListener("click",()=>zoom(-1.4));
  document.querySelector("#castle-tour-zoom-out").addEventListener("click",()=>zoom(1.4));
  canvas.addEventListener("keydown",e=>{
    if(viewMode==="walk"&&active){
      const key=e.key.toLowerCase();
      if(key==="e"){e.preventDefault();if(!e.repeat)walkInteract.click();return;}
      if(key==="escape"){e.preventDefault();switchView();return;}
      if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(key)){
        e.preventDefault();walkKeys.add(key);return;
      }
      return;
    }
    const deltas={ArrowLeft:-.22,ArrowRight:.22,ArrowUp:-.13,ArrowDown:.13};
    if(!(e.key in deltas))return;
    e.preventDefault();
    if(e.key==="ArrowLeft"||e.key==="ArrowRight")orbit(deltas[e.key]);
    else phi=THREE.MathUtils.clamp(phi+deltas[e.key],.13,1.17);
  });
  canvas.addEventListener("keyup",e=>walkKeys.delete(e.key.toLowerCase()));
  canvas.addEventListener("blur",()=>clearWalkInput());
  window.addEventListener("keyup",e=>walkKeys.delete(e.key.toLowerCase()));
  window.addEventListener("blur",clearWalkInput);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)clearWalkInput();});
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
    if(viewMode==="walk"){
      walkYaw-=dx*.006;
      walkPitch=THREE.MathUtils.clamp(walkPitch-dy*.004,-.65,.5);
      updateWalkCamera();
    }else{
      theta-=dx*.008;canvas.dataset.orbitYaw=theta.toFixed(3);
      phi=THREE.MathUtils.clamp(phi+dy*.005,.13,1.17);
    }
    lastX=e.clientX;lastY=e.clientY;
  });
  canvas.addEventListener("pointerup",e=>{
    if(!active)return;
    const clicked=dragging&&!moved;dragging=false;
    if(!clicked)return;
    const rect=canvas.getBoundingClientRect();
    pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    if(zone==="vault-chamber"&&interior){
      if(raycaster.intersectObject(interior.relic,true).length)showCrownFinale();
      return;
    }
    if(zone==="interior"&&interior){
      if(raycaster.intersectObject(interior.relic,false).length){
        if(nearestPortal())openRelicRiddle();
        else showStatus("✦ Hãy tiến gần cổ vật trước khi nhận thử thách.");
      }
      return;
    }
    if(viewMode==="walk"&&vaultGem&&raycaster.intersectObject(vaultGem,false).length){
      openVaultDialog(true);
      return;
    }
    const intersections=raycaster.intersectObjects(viewMode==="walk"?walkPortals:hotspots,false);
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
  function openSelectedRoom(){
    const room=document.querySelector('#expedition-map [data-room="'+selected+'"]');
    room?.click();
    document.querySelector("#expedition-scene")?.scrollIntoView({block:"center",behavior:reduceMotion?"auto":"smooth"});
    showStatus("✦ Đã mở câu đố tại "+roomNames[selected]+".");
  }
  document.querySelector("#castle-tour-enter").addEventListener("click",()=>{
    if(active&&viewMode==="walk"&&zone==="courtyard")enterInterior(selected);
    else if(active&&viewMode==="walk"&&zone==="vault-chamber")showCrownFinale();
    else if(active&&viewMode==="walk"&&zone==="interior")openRelicRiddle();
    else openSelectedRoom();
  });
  interiorExit.addEventListener("click",exitInterior);
  walkInteract.addEventListener("click",()=>{
    if(!active||viewMode!=="walk"||!walkNear)return;
    if(zone==="vault-chamber"){
      showCrownFinale();
      return;
    }
    if(zone==="interior"){
      openRelicRiddle();
      return;
    }
    if(walkNear==="vault"){
      if(vaultProgress().completed)enterVaultChamber();
      else openVaultDialog(true);
      return;
    }
    enterInterior(walkNear);
  });
  document.querySelectorAll("#expedition-map [data-room]").forEach(button=>{
    button.addEventListener("click",()=>pickRoom(button.dataset.room,false));
  });
  pickRoom("hall",false);
  canvas.dataset.orbitYaw=theta.toFixed(3);
  canvas.dataset.orbitZoom=radius.toFixed(2);
  setMode("illustration");
  syncVaultState();
}