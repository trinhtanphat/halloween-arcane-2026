/**
 * Ravenhollow: accessible 2D minimap and objective compass for 3D exploration.
 * Draws on local canvas only. No geolocation, network or extra dependencies.
 */
export function createCastleWayfinder({root,canvas,getState,roomNames}) {
  if(!root||!canvas)return {sync(){},reset(){}};
  const ctx=canvas.getContext("2d");
  const next=root.querySelector("#castle-wayfinder-next");
  const target=root.querySelector("#castle-wayfinder-target");
  const guidance=root.querySelector("#castle-wayfinder-guidance");
  const heading=root.querySelector("#castle-wayfinder-direction");
  const distance=root.querySelector("#castle-wayfinder-distance");
  const progress=root.querySelector("#castle-wayfinder-progress");
  const positions={
    hall:{x:0,z:5.75,label:roomNames.hall},
    library:{x:-1.35,z:6.8,label:roomNames.library},
    tower:{x:1.35,z:6.8,label:roomNames.tower},
    crypt:{x:3.6,z:5.75,label:roomNames.crypt},
    vault:{x:0,z:13.45,label:"Rương Kho Báu"}
  };
  const questIds=["hall","library","tower","crypt","vault"];
  let manual=null,lastDraw=0,lastGoal=null,lastZone=null,lastCollected=null;
  const map={size:canvas.width,pad:20};
  function zoneOptions(state) {
    if(state.zone==="interior")return {
      bounds:{minX:-4.35,maxX:4.35,minZ:-4.35,maxZ:4.35},
      locations:[{id:"relic",x:0,z:-3.15}],
      destination:{id:"relic",x:0,z:-3.15,label:"CỔ VẬT PHÁT SÁNG"},
      story:"Tiến đến cổ vật ở cuối phòng, nhấn E để giải đố.",
      progressLabel:"PHÒNG "+(roomNames[state.roomId]||"BÍ ẨN")
    };
    if(state.zone==="vault-chamber")return {
      bounds:{minX:-4.35,maxX:4.35,minZ:-4.35,maxZ:4.35},
      locations:[{id:"crown",x:0,z:-3.05}],
      destination:{id:"crown",x:0,z:-3.05,label:"VƯƠNG MIỆN BÍ ẨN"},
      story:"Đến gần ngai vương miện rồi nhấn E để xem cảnh kết.",
      progressLabel:"MẬT THẤT ĐÃ MỞ"
    };
    const missing=questIds.slice(0,4).filter(id=>!state.collected.includes(id));
    const suggested=missing[0]||"vault";
    if(manual&&!questIds.includes(manual))manual=null;
    const goal=manual||(missing.includes(state.selected)?state.selected:suggested);
    const item=positions[goal];
    return {
      bounds:{minX:-6.8,maxX:6.8,minZ:4.4,maxZ:14.5},
      locations:questIds.map(id=>({id,x:positions[id].x,z:positions[id].z,collected:state.collected.includes(id)})),
      destination:{...item,id:goal,label:item.label.toUpperCase()},
      story:goal==="vault"
        ?(state.opened?"Đến rương đã mở và nhấn E để vào Mật Thất Vương Miện."
          :state.collected.length===4?"Đến rương báu rồi nhấn E để giải phong ấn."
          :"Rương còn khóa. Thu thập đủ bốn cổ vật trước khi mở.")
        :state.collected.includes(goal)?"Cổ vật đã được nhận. Có thể quay lại tham quan phòng."
          :"Đi đến cổng "+item.label+" rồi nhấn E để vào phòng.",
      progressLabel:state.collected.length+" / 4 CỔ VẬT"
    };
  }
  function directionText(diff) {
    const degrees=((diff*180/Math.PI)+360)%360;
    if(degrees<25||degrees>=335)return "↑ PHÍA TRƯỚC";
    if(degrees<70)return "↗ CHÉO PHẢI";
    if(degrees<120)return "→ BÊN PHẢI";
    if(degrees<160)return "↘ SAU BÊN PHẢI";
    if(degrees<200)return "↓ PHÍA SAU";
    if(degrees<240)return "↙ SAU BÊN TRÁI";
    if(degrees<290)return "← BÊN TRÁI";
    return "↖ CHÉO TRÁI";
  }
  function draw({state,options}) {
    if(!ctx)return;
    const {minX,maxX,minZ,maxZ}=options.bounds,{size,pad}=map;
    const scale=size-2*pad;
    const project=(x,z)=>({x:pad+(x-minX)/(maxX-minX)*scale,y:pad+(z-minZ)/(maxZ-minZ)*scale});
    ctx.clearRect(0,0,size,size);
    ctx.fillStyle="#1d172d";ctx.fillRect(0,0,size,size);
    ctx.strokeStyle="#ae8bba55";ctx.lineWidth=1;
    for(let i=0;i<=4;i++){
      const v=pad+scale*i/4;
      ctx.beginPath();ctx.moveTo(pad,v);ctx.lineTo(size-pad,v);ctx.moveTo(v,pad);ctx.lineTo(v,size-pad);ctx.stroke();
    }
    if(state.zone!=="courtyard"){
      ctx.strokeStyle="#c6a371";
      ctx.lineWidth=3;ctx.strokeRect(pad,pad,scale,scale);
      ctx.fillStyle="#594560";
      ctx.fillRect(size/2-19,size/2-12,38,23);
      ctx.fillStyle="#ccbdab";ctx.font="8px Arial";
      ctx.textAlign="center";ctx.fillText("PHÒNG",size/2,size/2+2);
    }else{
      ctx.fillStyle="#5a416f";
      ctx.fillRect(pad+19,pad+6,scale-38,16);
      ctx.fillStyle="#94809f";
      ctx.font="8px Arial";ctx.textAlign="center";
      ctx.fillText("CỔNG LÂU ĐÀI",size/2,pad+18);
      ctx.fillStyle="#60557277";
      ctx.fillRect(size/2-7,pad+19,14,scale-28);
    }
    for(const loc of options.locations){
      const {x,y}=project(loc.x,loc.z);
      const isGoal=loc.id===options.destination.id;
      ctx.beginPath();ctx.arc(x,y,isGoal?7:5,0,2*Math.PI);
      ctx.fillStyle=loc.collected?"#99c9a7":isGoal?"#ffdb99":"#a78dde";ctx.fill();
      if(isGoal){ctx.strokeStyle="#ffdeaa";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,11,0,2*Math.PI);ctx.stroke();}
      if(loc.collected){ctx.fillStyle="#14241b";ctx.font="bold 8px Arial";ctx.textAlign="center";ctx.fillText("✓",x,y+3);}
    }
    const player=project(state.x,state.z),end=project(options.destination.x,options.destination.z);
    ctx.strokeStyle="#e4c48b90";ctx.lineWidth=1.5;
    ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.setLineDash([]);
    ctx.save();ctx.translate(player.x,player.y);ctx.rotate(-state.yaw);
    ctx.fillStyle="#fff6de";ctx.strokeStyle="#332942";ctx.lineWidth=1.3;
    ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(7,8);ctx.lineTo(0,4);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
    ctx.strokeStyle="#dab781";ctx.lineWidth=1.5;ctx.strokeRect(1,1,size-2,size-2);
    canvas.dataset.playerX=state.x.toFixed(2);
    canvas.dataset.playerZ=state.z.toFixed(2);
    canvas.dataset.objective=options.destination.id;
  }
  function sync(force=false){
    const s=getState();
    if(lastCollected!==null&&lastCollected!==s.collected.length){manual=null;lastGoal=null;}
    lastCollected=s.collected.length;
    const visible=!!s.active&&s.viewMode==="walk";
    root.hidden=!visible;
    if(!visible)return;
    const opts=zoneOptions(s);
    const {destination}=opts;
    const dx=destination.x-s.x,dz=destination.z-s.z;
    const dst=Math.hypot(dx,dz);
    const desired=Math.atan2(-dx,-dz);
    const relative=((s.yaw-desired+3*Math.PI)%(2*Math.PI))-Math.PI;
    const title=destination.label;
    if(lastGoal!==title||lastZone!==s.zone||force){
      target.textContent=title;
      guidance.textContent=opts.story;
      progress.textContent=opts.progressLabel;
      lastGoal=title;lastZone=s.zone;
    }else if(progress.textContent!==opts.progressLabel)progress.textContent=opts.progressLabel;
    heading.textContent=directionText(relative);
    distance.textContent=dst<1?"✦ ĐÃ ĐẾN GẦN":dst.toFixed(1)+" ĐƠN VỊ";
    root.dataset.objective=destination.id;
    root.dataset.zone=s.zone;
    root.dataset.collected=String(s.collected.length);
    // Low-cost minimap update; limit 2D canvas work independently of WebGL FPS.
    const now=performance.now();
    if(force||now-lastDraw>=100){draw({state:s,options:opts});lastDraw=now;}
    next.disabled=s.zone!=="courtyard";
    next.textContent=s.zone==="courtyard"?"⌖ ĐỔI MỤC TIÊU":"✦ ĐANG KHÁM PHÁ PHÒNG";
  }
  next.addEventListener("click",()=>{
    const state=getState();
    if(state.zone!=="courtyard")return;
    const current=manual||zoneOptions(state).destination.id;
    manual=questIds[(questIds.indexOf(current)+1)%questIds.length];
    lastGoal=null;sync(true);
  });
  function reset(){manual=null;lastGoal=null;lastZone=null;sync(true);}
  function choose(id){if(!questIds.includes(id))return;manual=id;lastGoal=null;sync(true);}
  return {sync,reset,choose};
}
