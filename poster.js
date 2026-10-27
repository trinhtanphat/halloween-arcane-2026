/**
 * Ravenhollow Invitation Atelier.
 * Original 900 × 1200 canvas artwork. No external images/fonts are fetched by
 * the renderer, no input is uploaded, and PNG is generated on-device.
 */
const posterCanvas=document.querySelector("#poster-canvas");
const posterCtx=posterCanvas?.getContext("2d");
const posterInput=document.querySelector("#poster-name");
const themeButtons=[...document.querySelectorAll("[data-poster-theme]")];
const output=document.querySelector("#poster-status");
const posterThemes={
  moon:{top:"#211332",bottom:"#090d22",glow:"#7755b4",accent:"#f5d9a1",highlight:"#cdb2fa",hill:"#110f27",castle:"#15112c",pumpkin:"#e88635"},
  ember:{top:"#4c1d26",bottom:"#190c13",glow:"#db7139",accent:"#ffe1a0",highlight:"#ffc08b",hill:"#230e19",castle:"#29111c",pumpkin:"#ff983a"},
  forest:{top:"#113b34",bottom:"#091b1c",glow:"#3c9674",accent:"#e9dba7",highlight:"#a8e4ca",hill:"#092825",castle:"#102d2a",pumpkin:"#e49945"}
};
let activeTheme="moon";
try{
  const saved=localStorage.getItem("ravenhollow-poster-theme");
  if(Object.hasOwn(posterThemes,saved))activeTheme=saved;
  const savedName=localStorage.getItem("ravenhollow-wizard");
  if(savedName && savedName.trim().length>=2)posterInput.value=savedName.trim().slice(0,32);
}catch(_){}
const ctx=posterCtx, W=900, H=1200;
function saveLocal(key,value){try{localStorage.setItem(key,value);}catch(_){}}
function setStatus(message){if(output)output.textContent=message;}
function circle(x,y,r,fill){
  ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}
function poly(points,fill){
  ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
}
function drawLine(x1,y1,x2,y2,color,width=2){
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function fitText(text,maxWidth,baseFont,minFont=30){
  let size=baseFont;while(size>minFont){
    ctx.font="600 "+size+"px Georgia, serif";
    if(ctx.measureText(text).width<=maxWidth)break;
    size-=2;
  }
  return size;
}
function centeredText(text,y,size,color,tracking=0){
  ctx.font="600 "+size+"px Georgia, serif";
  ctx.fillStyle=color;
  ctx.textAlign="center";
  if(!tracking){ctx.fillText(text,W/2,y);return;}
  const chars=Array.from(text);
  const widths=chars.map(ch=>ctx.measureText(ch).width);
  const total=widths.reduce((a,b)=>a+b,0)+(chars.length-1)*tracking;
  let x=(W-total)/2;ctx.textAlign="left";
  chars.forEach((ch,i)=>{ctx.fillText(ch,x,y);x+=widths[i]+tracking;});
  ctx.textAlign="center";
}
function drawPumpkin(x,y,scale,palette){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const glow=ctx.createRadialGradient(0,10,8,0,0,140);
  glow.addColorStop(0,palette.glow+"aa");glow.addColorStop(1,"#00000000");
  circle(0,2,144,glow);
  for(const [cx,rx] of [[-52,50],[52,50],[0,73]]){
    const g=ctx.createLinearGradient(cx-58,-45,cx+75,98);
    g.addColorStop(0,"#ffd287");g.addColorStop(.4,palette.pumpkin);g.addColorStop(1,"#783215");
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(cx,12,rx,84,0,0,Math.PI*2);ctx.fill();
    ctx.lineWidth=3;ctx.strokeStyle="#6e301966";ctx.stroke();
  }
  poly([[-15,-70],[-13,-109],[10,-117],[21,-103],[9,-69]],"#597244");
  poly([[0,-91],[52,-104],[39,-80],[4,-76]],"#71904b");
  const eye="#ffeaa4";
  poly([[-67,-12],[-12,-22],[-47,18]],eye);
  poly([[12,-22],[67,-12],[47,18]],eye);
  poly([[-7,15],[0,-2],[8,15]],eye);
  poly([[-72,39],[-39,53],[-18,46],[1,63],[27,46],[49,54],[73,38],[52,81],[16,88],[0,75],[-15,87],[-54,79]],eye);
  ctx.restore();
}
function drawCastle(y,color){
  const x=450;
  ctx.fillStyle=color;
  ctx.fillRect(x-192,y-157,384,240);
  for(const [ox,top,width] of [[-250,-250,74],[-146,-340,68],[0,-399,83],[149,-308,68],[242,-234,58]]){
    ctx.fillRect(x+ox-width/2,y+top,width,220-top/8);
    poly([[x+ox-width*.7,y+top+14],[x+ox,y+top-53],[x+ox+width*.7,y+top+14]],color);
    circle(x+ox,y+top-53,5,"#dfc787");
    ctx.fillStyle="#f8b96677";
    ctx.fillRect(x+ox-5,y+top+49,10,24);
    ctx.fillStyle=color;
  }
  for(const [ox,oy] of [[-140,-65],[40,-130],[133,-56]]){
    ctx.fillStyle="#ffdc8a77";ctx.fillRect(x+ox,y+oy,13,31);
  }
}
function drawPoster(){
  if(!ctx)return;
  const p=posterThemes[activeTheme];
  const gradient=ctx.createLinearGradient(0,0,0,H);
  gradient.addColorStop(0,p.top);gradient.addColorStop(1,p.bottom);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
  const halo=ctx.createRadialGradient(450,320,20,450,320,515);
  halo.addColorStop(0,p.glow+"a9");halo.addColorStop(.65,p.glow+"25");halo.addColorStop(1,p.glow+"00");
  ctx.fillStyle=halo;ctx.fillRect(0,0,W,860);
  // Bright stars with deterministic positions, so a card's layout stays stable.
  for(let i=0;i<148;i++){
    const x=(i*239.17+73)%W,y=(i*127.63+59)%700;
    const radius=i%13===0?2.5:.9;
    circle(x,y,radius,i%6===0?p.accent+"b0":"#fff5ee84");
    if(i%29===0){drawLine(x-9,y,x+9,y,p.highlight+"66",1);drawLine(x,y-9,x,y+9,p.highlight+"66",1);}
  }
  // Concentric magical rings frame the moon and tower silhouette.
  ctx.strokeStyle=p.highlight+"77";ctx.lineWidth=3;
  for(const radius of [238,269,306]){
    ctx.beginPath();ctx.arc(450,365,radius,0,2*Math.PI);ctx.stroke();
  }
  ctx.setLineDash([8,18]);ctx.strokeStyle=p.accent+"72";
  ctx.beginPath();ctx.arc(450,365,293,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  const moon=ctx.createRadialGradient(405,249,6,451,306,122);
  moon.addColorStop(0,"#ffffff");moon.addColorStop(.32,"#fff3c5");moon.addColorStop(1,p.highlight);
  circle(450,300,103,moon);
  circle(416,285,12,"#ad9eb73a");circle(490,328,19,"#ad9eb72b");
  drawCastle(814,p.castle);
  poly([[0,829],[103,761],[220,816],[341,778],[483,832],[642,780],[779,821],[900,754],[900,1200],[0,1200]],p.hill);
  for(const [x,y,scale] of [[122,849,.43],[770,864,.52],[450,923,1.06]]){
    drawPumpkin(x,y,scale,p);
  }
  // Ornate, double-stroked golden frame.
  ctx.strokeStyle=p.accent+"c9";ctx.lineWidth=5;ctx.strokeRect(29,29,W-58,H-58);
  ctx.strokeStyle=p.accent+"85";ctx.lineWidth=2;ctx.strokeRect(46,46,W-92,H-92);
  for(const x of [84,816]){
    for(const y of [83,1117]){
      circle(x,y,7,p.accent);circle(x,y,3,p.bottom);
    }
  }
  ctx.textBaseline="alphabetic";
  centeredText("R A V E N H O L L O W",112,29,p.accent);
  centeredText("A C A D E M Y   O F   T H E   A R C A N E",151,15,p.highlight);
  centeredText("✦",218,45,p.accent);
  centeredText("YOU ARE CORDIALLY INVITED",566,27,p.accent,3);
  centeredText("THE ENCHANTED",631,53,"#fff8e9");
  centeredText("HALLOWEEN",701,76,p.accent);
  // Always stay within the card, including long nicknames.
  const name=(posterInput?.value||"").trim().replace(/\s+/g," ").slice(0,32)||"WIZARD OF RAVENHOLLOW";
  const fontSize=fitText(name,720,50,23);
  centeredText(name,788,fontSize,"#fff6de");
  drawLine(208,802,692,802,p.accent+"ad",2);
  // Bottom event details are over a translucent backdrop for contrast.
  ctx.fillStyle="#130d21b8";ctx.fillRect(85,1020,730,119);
  centeredText("31 OCTOBER 2026 • 18:00 GMT+7",1060,26,p.accent);
  centeredText("A MAGICAL ONLINE EXPERIENCE",1101,19,"#fff1e1");
  centeredText("trinhtanphat.github.io/halloween-arcane-2026",1159,16,p.highlight);
}
function currentName(){
  return (posterInput.value||"").trim().replace(/\s+/g," ").slice(0,32);
}
function validateName(){
  const name=currentName();
  if(name.length<2){
    setStatus("☾ Bí danh cần tối thiểu 2 ký tự trước khi tải thiệp.");
    posterInput.focus();
    return null;
  }
  return name;
}
themeButtons.forEach(button=>{
  button.addEventListener("click",()=>{
    const value=button.dataset.posterTheme;
    if(!Object.hasOwn(posterThemes,value))return;
    activeTheme=value;
    saveLocal("ravenhollow-poster-theme",activeTheme);
    updateThemeButtons();drawPoster();
    setStatus("✦ Đã chọn phong cách mới. Thiệp đã sẵn sàng.");
  });
});
function updateThemeButtons(){
  themeButtons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.posterTheme===activeTheme)));
}
posterInput?.addEventListener("input",()=>{
  const name=currentName();
  const original=document.querySelector("#wizard-name");
  if(original)original.value=name;
  if(name.length>=2)saveLocal("ravenhollow-wizard",name);
  drawPoster();
});
document.querySelector("#invitation-form")?.addEventListener("submit",()=>{
  const name=(document.querySelector("#wizard-name")?.value||"").trim().replace(/\s+/g," ").slice(0,32);
  if(name.length>=2){posterInput.value=name;drawPoster();}
});
document.querySelector("#poster-download")?.addEventListener("click",()=>{
  const name=validateName();if(!name)return;
  drawPoster();
  const downloadBlob=(blob)=>{
    if(!blob || blob.type!=="image/png"){setStatus("Không thể tạo ảnh PNG trên trình duyệt này.");return;}
    const objectUrl=URL.createObjectURL(blob);
    const link=document.createElement("a");
    const safeName=name.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,35)||"wizard";
    link.download="ravenhollow-halloween-2026-"+safeName+".png";
    link.href=objectUrl;document.body.appendChild(link);
    link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(objectUrl),30000);
    setStatus("✦ Đã tạo thiệp PNG 900 × 1200 px. Nếu không thấy ảnh, hãy kiểm tra thư mục tải xuống.");
  };
  try{posterCanvas.toBlob(downloadBlob,"image/png");}
  catch(_){setStatus("Trình duyệt không cho phép xuất ảnh từ Canvas. Hãy thử Chrome hoặc Edge mới hơn.");}
});
document.querySelector("#poster-copy")?.addEventListener("click",async()=>{
  const name=validateName();if(!name)return;
  const text="✦ RAVENHOLLOW HALLOWEEN 2026 ✦\n"+name+" trân trọng mời bạn khám phá học viện phép thuật!\n☾ 18:00 GMT+7, 31/10/2026 — Trải nghiệm trực tuyến\nhttps://trinhtanphat.github.io/halloween-arcane-2026/";
  try{await navigator.clipboard.writeText(text);setStatus("✦ Đã sao chép lời mời. Bạn có thể dán vào tin nhắn.");}
  catch(_){setStatus("Trình duyệt chưa cho phép sao chép. Hãy thử ở trang HTTPS hoặc lưu ảnh PNG.");}
});
updateThemeButtons();
drawPoster();
