import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 0;
const MIME = { ".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".md":"text/markdown",".webmanifest":"application/manifest+json" };
const server = createServer(async (req,res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    if(pathname === "/") pathname = "/index.html";
    const target = path.resolve(ROOT, "."+pathname);
    if(!target.startsWith(ROOT+path.sep)) {res.writeHead(403);res.end("Forbidden");return;}
    const file = await readFile(target);
    res.writeHead(200,{"Content-Type":MIME[path.extname(target)]||"application/octet-stream","Cache-Control":"no-cache"});
    res.end(file);
  }catch(err){res.writeHead(404);res.end("Not found: "+err.message);}
});
await new Promise(resolve=>server.listen(PORT,"127.0.0.1",resolve));
const base = (process.env.SMOKE_URL || "http://127.0.0.1:"+server.address().port).replace(/\/$/, "");
let browser;
try {
  const chrome = process.env.BROWSER_EXE || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  browser = await chromium.launch({headless:true,executablePath:chrome,args:["--no-first-run","--disable-background-networking","--enable-unsafe-swiftshader"]});
  const context = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console", msg=>{if(msg.type()==="error" && !msg.text().includes("fonts.googleapis")) errors.push("console: "+msg.text());});
  await page.goto(base,{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForFunction(()=>document.querySelector("#days")?.textContent !== "--",{timeout:15000});
  assert.match(await page.title(),/Ravenhollow/);
  assert.match(await page.locator("#hero-title").innerText(),/MAGIC/);
  assert.equal(await page.locator(".realm-card").count(),3);
  assert.equal(await page.locator(".timeline-item").count(),4);
  const assets = ["assets/party-hero.webp","assets/party-location.webp","assets/haunted-hero.jpg","assets/haunted-origins.jpg","app.js","style.css","magic.js","magic.css","sw.js","manifest.webmanifest","icon-192.png","icon-512.png","alchemy.js","alchemy.css","expedition.js","expedition.css","castle-tour.css","pumpkin.css","soundscape.js","candy.js","candy.css","poster.js","poster.css","runes.js","runes.css","spell-duel.js","spell-duel.css"];
  for(const asset of assets){
    const response=await page.request.get(base+"/"+asset);
    assert.equal(response.status(),200,"asset missing: "+asset);
  }
  // Interactive Three.js castle is opt-in; its 2D controls must remain useful.
  assert.equal(await page.locator("#castle-tour").getAttribute("data-render-mode"),"illustration");
  assert.equal(await page.locator("#castle-tour").getAttribute("data-vault-state"),"locked");
  await page.locator("#castle-vault-action").click();
  assert.equal(await page.locator("#castle-vault-dialog").isVisible(),true);
  assert.equal(await page.locator("#castle-vault-relics [data-collected=true]").count(),0);
  assert.equal(await page.locator("#castle-vault-unlock").isDisabled(),true);
  assert.equal(await page.locator("#castle-vault-enter").isVisible(),false);
  await page.locator("#castle-vault-close").click();
  assert.equal(await page.locator("[data-castle-room]").count(),4);
  assert.equal(await page.locator("#castle-tour-start").getAttribute("aria-pressed"),"false");
  await page.locator('[data-castle-room="library"]').click();
  assert.equal(await page.locator('[data-castle-room="library"]').getAttribute("aria-pressed"),"true");
  await page.locator("#castle-tour-enter").click();
  assert.equal(await page.locator("#expedition-scene").getAttribute("data-room-scene"),"library");
  const yawBefore=Number(await page.locator("#castle-tour-canvas").getAttribute("data-orbit-yaw"));
  const distanceBefore=Number(await page.locator("#castle-tour-canvas").getAttribute("data-orbit-zoom"));
  await page.locator("#castle-tour-right").click();
  await page.locator("#castle-tour-zoom-in").click();
  assert.notEqual(Number(await page.locator("#castle-tour-canvas").getAttribute("data-orbit-yaw")),yawBefore);
  assert.ok(Number(await page.locator("#castle-tour-canvas").getAttribute("data-orbit-zoom"))<distanceBefore);
  await page.locator("#castle-tour-start").click();
  await page.waitForFunction(()=>["webgl","illustration"].includes(document.querySelector("#castle-tour")?.dataset.renderMode)
    && document.querySelector("#castle-tour-mode")?.textContent!=="3D CHƯA KÍCH HOẠT",{timeout:20000});
  const castleMode=await page.locator("#castle-tour").getAttribute("data-render-mode");
  if(castleMode==="webgl"){
    assert.equal(await page.locator("#castle-tour-canvas").isVisible(),true);
    assert.equal(await page.locator("#castle-tour-start").getAttribute("aria-pressed"),"true");
    const yaw=Number(await page.locator("#castle-tour-canvas").getAttribute("data-orbit-yaw"));
    await page.locator("#castle-tour-canvas").focus();
    await page.keyboard.press("ArrowLeft");
    assert.notEqual(Number(await page.locator("#castle-tour-canvas").getAttribute("data-orbit-yaw")),yaw);
    // First-person movement: W, on-screen controls, proximity interaction and bounds.
    assert.equal(await page.locator("#castle-tour-view").isEnabled(),true);
    await page.locator("#castle-tour-view").click();
    assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-view"),"walk");
    assert.equal(await page.locator("#castle-walk-pad").isVisible(),true);
    assert.equal(await page.locator("#castle-wayfinder").isVisible(),true);
    assert.equal(await page.locator("#castle-wayfinder").getAttribute("data-zone"),"courtyard");
    assert.equal(await page.locator("#castle-wayfinder").getAttribute("data-objective"),"library");
    assert.match(await page.locator("#castle-wayfinder-progress").innerText(),/0 \/ 4 CỔ VẬT/);
    assert.match(await page.locator("#castle-wayfinder-direction").innerText(),/PHÍA TRƯỚC|CHÉO|BÊN/);
    assert.equal(await page.locator("#castle-wayfinder-map").evaluate(el=>el.getContext("2d")!==null),true);
    await page.locator("#castle-wayfinder-next").click();
    assert.equal(await page.locator("#castle-wayfinder").getAttribute("data-objective"),"tower");
    assert.match(await page.locator("#castle-wayfinder-target").innerText(),/THÁP THIÊN VĂN/);
    await page.locator('[data-castle-room="hall"]').click();
    assert.equal(await page.locator("#castle-wayfinder").getAttribute("data-objective"),"hall");
    const initialZ=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    await page.locator("#castle-tour-canvas").focus();
    await page.keyboard.down("w");
    await page.waitForTimeout(450);
    await page.keyboard.up("w");
    assert.ok(Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"))<initialZ-.3,"W moves forward");
    assert.ok(Number(await page.locator("#castle-wayfinder-map").getAttribute("data-player-z"))<initialZ-.3,"minimap tracks WASD position");
    const yaw0=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-yaw"));
    await page.locator('[data-walk-action="turn-left"]').click();
    assert.notEqual(Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-yaw")),yaw0);
    await page.locator('[data-walk-action="turn-right"]').click();
    const x0=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-x"));
    await page.locator('[data-walk-action="right"]').click();
    assert.ok(Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-x"))>x0);
    for(let i=0;i<6;i++)await page.locator('[data-walk-action="forward"]').click();
    assert.equal(await page.locator("#castle-walk-interact").isEnabled(),true,"must reach a glowing portal");
    await page.locator("#castle-tour-canvas").focus();
    await page.keyboard.press("e");
    assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-zone"),"interior","E at a gateway enters the real indoor 3D scene");
    assert.equal(await page.locator("#castle-wayfinder").getAttribute("data-zone"),"interior");
    assert.equal(await page.locator("#castle-wayfinder").getAttribute("data-objective"),"relic");
    assert.match(await page.locator("#castle-wayfinder-target").innerText(),/CỔ VẬT/);
    assert.equal(await page.locator("#castle-wayfinder-next").isDisabled(),true);
    const firstInterior=await page.locator("#castle-tour").getAttribute("data-interior-room");
    assert.ok(["tower","library"].includes(firstInterior));
    assert.equal(await page.locator("#expedition-scene").getAttribute("data-room-scene"),firstInterior);
    assert.equal(await page.locator("#castle-interior-exit").isVisible(),true);
    assert.equal(await page.locator("#castle-walk-interact").isDisabled(),true,"riddle is proximity gated");
    // Approach the indoor relic by walking around the central furniture.
    for(let i=0;i<3;i++)await page.locator('[data-walk-action="right"]').click();
    for(let i=0;i<7;i++)await page.locator('[data-walk-action="forward"]').click();
    for(let i=0;i<3;i++)await page.locator('[data-walk-action="left"]').click();
    for(let i=0;i<2;i++)await page.locator('[data-walk-action="forward"]').click();
    assert.equal(await page.locator("#castle-walk-interact").isEnabled(),true,"indoor artifact is reachable");
    await page.locator("#castle-tour-canvas").focus();
    await page.keyboard.press("e");
    assert.equal(await page.locator("#castle-riddle-dialog").isVisible(),true);
    assert.equal(await page.locator("#castle-riddle-choices button").count(),3);
    assert.equal(await page.locator("#expedition-scene").getAttribute("data-room-scene"),firstInterior);
    assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-zone"),"interior");
    await page.locator('[data-riddle-answer="1"]').click();
    assert.match(await page.locator("#castle-riddle-feedback").innerText(),/Chưa đúng/);
    assert.equal(await page.locator("#expedition-relic").isVisible(),false);
    const rightAnswer=firstInterior==="library"?"0":"2";
    await page.locator('[data-riddle-answer="'+rightAnswer+'"]').click();
    assert.equal(await page.locator("#castle-riddle-earned").isVisible(),true);
    assert.equal(await page.locator("#expedition-relic").isVisible(),true);
    assert.ok(JSON.parse(await page.evaluate(()=>localStorage.getItem("ravenhollow-expedition-relics"))).includes(firstInterior));
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#castle-riddle-dialog").isVisible(),false);
    const castleRooms=["hall","library","tower","crypt"];
    await page.locator("#castle-interior-exit").click();
    assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-zone"),"courtyard");
    assert.equal(await page.locator("#castle-wayfinder").getAttribute("data-zone"),"courtyard");
    assert.ok(Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"))>=4.75);
    // Independently enter and leave all four distinct interior scenes.
    for(const room of castleRooms){
      await page.locator('[data-castle-room="'+room+'"]').click();
      await page.locator("#castle-tour-enter").click();
      assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-zone"),"interior");
      assert.equal(await page.locator("#castle-tour").getAttribute("data-interior-room"),room);
      assert.equal(await page.locator("#expedition-scene").getAttribute("data-room-scene"),room);
      const bound0=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
      for(let i=0;i<19;i++)await page.locator('[data-walk-action="back"]').click();
      const boundZ=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
      assert.ok(boundZ>=-4.05&&boundZ<=4.05,"indoor collision bounds");
      assert.ok(boundZ>=bound0,"back button moves within room");
      await page.locator("#castle-interior-exit").click();
      assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-zone"),"courtyard");
    }
    // Exterior collision bounds remain intact.
    for(let i=0;i<15;i++)await page.locator('[data-walk-action="forward"]').click();
    const boundaryZ=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    assert.ok(boundaryZ>=4.75 && boundaryZ<=14.2,"walking remains in the courtyard");
    // Regression: mobile direction pad supports tap, continuous hold and release.
    const backControl=page.locator('[data-walk-action="back"]');
    await backControl.scrollIntoViewIfNeeded();
    const hit=await backControl.boundingBox();
    assert.ok(hit&&hit.width>=35&&hit.height>=35,"mobile movement button has a usable hit target");
    const centerX=hit.x+hit.width/2,centerY=hit.y+hit.height/2;
    assert.equal(await backControl.evaluate(el=>getComputedStyle(el).touchAction),"none");
    const heldStart=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    await page.mouse.move(centerX,centerY);
    await page.mouse.down();
    await page.waitForTimeout(640);
    const heldZ=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    assert.ok(heldZ>heldStart+1.1&&heldZ<heldStart+3.3,"holding back must walk continuously, without teleporting");
    await page.mouse.up();
    assert.equal(await backControl.getAttribute("data-pressed"),null);
    const releasedZ=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    await page.waitForTimeout(190);
    assert.ok(Math.abs(Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"))-releasedZ)<.07,"movement stops after release");
    const tappedZ=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    await backControl.click();
    const tapStep=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"))-tappedZ;
    assert.ok(tapStep>.63&&tapStep<.77,"single tap moves exactly one step");
    const blurStart=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    await page.mouse.move(centerX,centerY);
    await page.mouse.down();
    await page.waitForTimeout(320);
    await page.evaluate(()=>window.dispatchEvent(new Event("blur")));
    const blurStopped=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    assert.ok(blurStopped>blurStart+.2,"pointer hold moves until focus is lost");
    await page.waitForTimeout(150);
    assert.ok(Math.abs(Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"))-blurStopped)<.07,"background focus loss cancels movement");
    await page.mouse.up();
    await page.locator("#castle-tour-view").click();
    assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-view"),"orbit");
    assert.equal(await page.locator("#castle-walk-pad").isVisible(),false);
    await page.locator("#castle-tour-start").click();
    assert.equal(await page.locator("#castle-tour").getAttribute("data-render-mode"),"illustration");
    assert.equal(await page.locator("#castle-wayfinder").isVisible(),false);
  }else{
    assert.equal(await page.locator("#castle-tour-illustration").isVisible(),true);
    assert.equal(await page.locator("#castle-wayfinder").isVisible(),false);
  }
  await page.locator('[data-castle-room="hall"]').click();
  await page.locator("#castle-tour-enter").click();
  assert.equal(await page.locator("#expedition-scene").getAttribute("data-room-scene"),"hall");
  await page.locator("#summon-ghosts").click();
  assert.equal(await page.locator(".cemetery").evaluate(e=>e.classList.contains("summoned")),true);
  await page.locator("#wizard-name").fill("Merlin Demo");
  await page.locator("#invitation-form button").click();
  await page.locator("#invitation-response").waitFor();
  assert.match(await page.locator("#invitation-response").innerText(),/Merlin Demo/);
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-wizard")),"Merlin Demo");
  // The original invitation and the shareable 900x1200 poster stay in sync.
  assert.equal(await page.locator("#poster-name").inputValue(),"Merlin Demo");
  assert.equal(await page.locator("[data-poster-theme]").count(),3);
  const canvasDimensions=await page.locator("#poster-canvas").evaluate(canvas=>({width:canvas.width,height:canvas.height,loaded:!!canvas.getContext("2d")}));
  assert.deepEqual(canvasDimensions,{width:900,height:1200,loaded:true});
  const samplePixel=()=>page.locator("#poster-canvas").evaluate(canvas=>[...canvas.getContext("2d").getImageData(80,180,1,1).data]);
  const initialColor=await samplePixel();
  await page.locator('[data-poster-theme="ember"]').click();
  assert.equal(await page.locator('[data-poster-theme="ember"]').getAttribute("aria-pressed"),"true");
  assert.notDeepEqual(await samplePixel(),initialColor,"switching poster themes must redraw the canvas");
  await page.locator('[data-poster-theme="forest"]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-poster-theme")),"forest");
  await page.locator("#poster-name").fill("Luna Pháp Sư");
  assert.equal(await page.locator("#wizard-name").inputValue(),"Luna Pháp Sư");
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-wizard")),"Luna Pháp Sư");
  // Invalid short names must not trigger a PNG download.
  await page.locator("#poster-name").fill("X");
  await page.locator("#poster-download").click();
  assert.match(await page.locator("#poster-status").innerText(),/tối thiểu 2 ký tự/);
  await page.locator("#poster-name").fill("Luna Pháp Sư");
  const downloadPromise=page.waitForEvent("download",{timeout:20000});
  await page.locator("#poster-download").click();
  const png=await downloadPromise;
  assert.match(png.suggestedFilename(),/ravenhollow-halloween-2026-.*\.png$/);
  const bytes=await readFile(await png.path());
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],"PNG header");
  assert.ok(bytes.byteLength>25000,"PNG should contain a complete illustration");
  const pngSize={width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
  assert.deepEqual(pngSize,{width:900,height:1200},"Exported PNG resolution");
  assert.match(await page.locator("#poster-status").innerText(),/Đã tạo thiệp PNG/);

  assert.equal(await page.locator("#order-options button").count(),4);
  for (let i=0;i<3;i++) {
    await page.locator("#order-options button").first().click();
    assert.equal(await page.locator("#order-next").isEnabled(),true);
    await page.locator("#order-next").click();
  }
  assert.match(await page.locator("#order-name").innerText(),/SOLARIS/);
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-order")),"0");
  await page.locator("#restart-order").click();
  assert.equal(await page.locator("#order-options button").count(),4);
  for (let i=0;i<3;i++) {
    await page.locator("#order-options button").first().click();
    await page.locator("#order-next").click();
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-order")),"0");
  for (const spell of ["nebulora","asterium","florastra","luminara"]) {
    await page.locator('[data-cast="'+spell+'"]').click();
    assert.equal(await page.locator("#spell-chamber").getAttribute("data-spell"),spell);
    assert.equal(await page.locator('[data-cast="'+spell+'"]').getAttribute("aria-pressed"),"true");
    assert.equal(await page.locator(".magic-mote").count(),34);
  }
  await page.locator("#open-portal").click();
  assert.equal(await page.locator("#portal-dialog").evaluate(e=>e.open),true);
  for(const correctIndex of [1,0,2]){
    await page.locator("#answer-list button").nth(correctIndex).click();
    await page.locator("#quiz-next").click();
  }
  assert.match(await page.locator("#dialog-title").innerText(),/WIZARD OF RAVENHOLLOW/);
  assert.match(await page.locator("#question-text").innerText(),/3 câu/);
  await page.locator("#close-portal").click();
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-portal-finished")),"1");
  for(const ingredient of ["root","ember","tear"]) {
    await page.locator('[data-ingredient="'+ingredient+'"]').click();
  }
  assert.match(await page.locator("#potion-feedback").innerText(),/chưa đúng/);
  assert.match(await page.locator("#potion-selection").innerText(),/0 \/ 3/);
  const potionRecipes = [["moon","star","bloom"],["ember","star","tear"],["bloom","moon","root"]];
  for(const [i,recipe] of potionRecipes.entries()) {
    for(const ingredient of recipe) {
      await page.locator('[data-ingredient="'+ingredient+'"]').click();
    }
    assert.equal(await page.locator("#potion-next").isVisible(),true);
    assert.match(await page.locator("#potion-feedback").innerText(),/—/);
    if(i<potionRecipes.length-1) await page.locator("#potion-next").click();
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-potion-finished")),"1");
  assert.equal(await page.locator("#passport-count").innerText(),"4/7");
  assert.equal(await page.locator(".passport-stamp.unlocked").count(),4);
  assert.equal(await page.locator("#vault-open").isDisabled(),true);
  await page.locator('[data-room="hall"]').click();
  await page.locator('#expedition-answers [data-answer="0"]').click();
  assert.match(await page.locator("#expedition-feedback").innerText(),/Chưa đúng/);
  const riddles = [["hall",1],["library",0],["tower",2],["crypt",0]];
  for(const [room,correct] of riddles) {
    await page.locator('[data-room="'+room+'"]').click();
    const realAnswer=page.locator('#expedition-answers [data-answer="'+correct+'"]');
    if(await realAnswer.isEnabled())await realAnswer.click();
    assert.equal(await page.locator("#expedition-relic").isVisible(),true);
    assert.equal(await page.locator('[data-room="'+room+'"] .room-check').innerText(),"✓");
  }
  assert.equal(await page.locator("#vault-open").isEnabled(),true);
  assert.equal(await page.locator("#castle-tour").getAttribute("data-vault-state"),"ready");
  await page.locator("#castle-tour-start").click();
  assert.equal(await page.locator("#castle-tour").getAttribute("data-render-mode"),"webgl");
  await page.locator("#castle-tour-view").click();
  assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-view"),"walk");
  assert.equal(await page.locator("#castle-wayfinder").getAttribute("data-objective"),"vault");
  assert.match(await page.locator("#castle-wayfinder-progress").innerText(),/4 \/ 4 CỔ VẬT/);
  assert.equal(await page.locator("#castle-walk-interact").isDisabled(),true);
  // The treasury altar is behind the courtyard spawn, reached by stepping back.
  await page.locator('[data-walk-action="back"]').click();
  await page.locator('[data-walk-action="back"]').click();
  assert.equal(await page.locator("#castle-walk-interact").isEnabled(),true);
  assert.match(await page.locator("#castle-walk-interact").innerText(),/KHO BÁU/);
  await page.locator("#castle-tour-canvas").focus();
  await page.keyboard.press("e");
  assert.equal(await page.locator("#castle-vault-dialog").isVisible(),true);
  assert.equal(await page.locator("#castle-vault-relics [data-collected=true]").count(),4);
  assert.equal(await page.locator("#castle-vault-unlock").isEnabled(),true);
  assert.equal(await page.locator("#castle-vault-enter").isVisible(),false);
  await page.locator("#castle-vault-unlock").click();
  assert.equal(await page.locator("#castle-tour").getAttribute("data-vault-state"),"opened");
  assert.equal(await page.locator("#castle-vault-dialog").getAttribute("data-completed"),"true");
  assert.equal(await page.locator("#castle-vault-unlock").isDisabled(),true);
  assert.equal(await page.locator("#expedition-final").isVisible(),true);
  assert.equal(await page.locator("#castle-vault-enter").isVisible(),true,"secret chamber unlocks after canonical vault");
  await page.locator("#castle-vault-enter").click();
  assert.equal(await page.locator("#castle-vault-dialog").isVisible(),false);
  assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-zone"),"vault-chamber");
  assert.equal(await page.locator("#castle-tour").getAttribute("data-interior-room"),"vault");
  assert.equal(await page.locator("#castle-wayfinder").getAttribute("data-objective"),"crown");
  assert.match(await page.locator("#castle-wayfinder-target").innerText(),/VƯƠNG MIỆN/);
  assert.equal(await page.locator("#castle-interior-exit").isVisible(),true);
  assert.match(await page.locator("#castle-interior-exit").innerText(),/MẬT THẤT/);
  assert.equal(await page.locator("#castle-walk-interact").isDisabled(),true);
  for(let i=0;i<7;i++)await page.locator('[data-walk-action="forward"]').click();
  assert.equal(await page.locator("#castle-walk-interact").isEnabled(),true,"the throne crown must be reachable");
  assert.match(await page.locator("#castle-walk-interact").innerText(),/VƯƠNG MIỆN/);
  await page.locator("#castle-tour-canvas").focus();
  await page.keyboard.press("e");
  assert.equal(await page.locator("#castle-crown-dialog").isVisible(),true);
  assert.match(await page.locator("#castle-crown-player").innerText(),/Luna Pháp Sư/);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#castle-crown-dialog").isVisible(),false);
  await page.locator("#castle-interior-exit").click();
  assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-zone"),"courtyard");
  assert.ok(Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"))>=4.75);
  await page.locator("#castle-walk-interact").click();
  assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-zone"),"vault-chamber","opened chest supports reentry");
  await page.locator("#castle-interior-exit").click();
  await page.locator("#castle-tour-start").click();
  assert.equal(await page.locator("#castle-tour").getAttribute("data-render-mode"),"illustration");
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-vault-finished")),"1");
  assert.equal(await page.locator("#passport-count").innerText(),"5/7");
  assert.equal(await page.locator(".passport-stamp.unlocked").count(),5);
  assert.equal(await page.locator("#candy-score").innerText(),"0");
  assert.equal(await page.locator("#candy-round").innerText(),"LƯỢT 01 / 10");
  // Collision penalty followed by successful keyboard/touch lane collection.
  await page.locator('[data-lane="4"]').click();
  await page.locator("#candy-grab").click();
  assert.match(await page.locator("#candy-feedback").innerText(),/bóng ma/i);
  assert.equal(await page.locator("#candy-score").innerText(),"0");
  const candyPositions=[3,0,4,2,0,3,1,4,2];
  for(const [idx,lane] of candyPositions.entries()){
    if(idx===0){
      await page.locator("#candy-road").focus();
      await page.keyboard.press("ArrowLeft");
      assert.equal(await page.locator('[data-lane="3"]').getAttribute("aria-pressed"),"true");
      await page.keyboard.press("Space");
    }else{
      await page.locator('[data-lane="'+lane+'"]').click();
      await page.locator("#candy-grab").click();
    }
  }
  assert.equal(await page.locator("#candy-completion").isVisible(),true);
  assert.equal(await page.locator("#candy-score").innerText(),"9");
  assert.equal(await page.locator("#candy-best").innerText(),"9");
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-candy-best")),"9");
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-candy-finished")),"1");
  assert.equal(await page.locator("#passport-count").innerText(),"6/7");
  assert.equal(await page.locator(".passport-stamp.unlocked").count(),6);
  assert.match(await page.locator("#passport-status").innerText(),/6\/7 nhiệm vụ/);
  await page.locator("#candy-replay").click();
  assert.equal(await page.locator("#candy-score").innerText(),"0");
  assert.equal(await page.locator("#candy-best").innerText(),"9");
  assert.equal(await page.locator("#passport-count").innerText(),"6/7");
  await page.locator("#potion-next").click();
  assert.match(await page.locator("#potion-step").innerText(),/01 \/ 03/);
  assert.equal(await page.locator("#passport-count").innerText(),"6/7");
  assert.equal((JSON.parse(await page.evaluate(()=>localStorage.getItem("ravenhollow-spells")))).length,4);
  // Accessible memory game: mismatched cards reset after a short grace period.
  assert.equal(await page.locator("#rune-board .rune-card").count(),12);
  assert.equal(await page.locator("#rune-matched").innerText(),"0/6");
  assert.equal(await page.locator("#passport-count").innerText(),"6/7");
  let cards=await page.locator("#rune-board .rune-card").evaluateAll(els=>els.map(e=>({index:Number(e.dataset.runeCard),pair:e.dataset.pair})));
  const wrongPair=cards.find(card=>card.pair!==cards[0].pair);
  await page.locator('[data-rune-card="0"]').click();
  assert.match(await page.locator('[data-rune-card="0"]').getAttribute("aria-label"),/đang mở/);
  await page.locator('[data-rune-card="'+wrongPair.index+'"]').click();
  assert.equal(await page.locator("#rune-moves").innerText(),"1");
  assert.match(await page.locator("#rune-message").innerText(),/khác nhau/);
  await page.waitForFunction(()=>[...document.querySelectorAll("#rune-board .rune-card")].every(e=>!e.classList.contains("revealed")),{timeout:7000});
  const pairs=new Map();
  for(const card of cards){if(!pairs.has(card.pair))pairs.set(card.pair,[]);pairs.get(card.pair).push(card.index);}
  for(const indices of pairs.values()){
    // Mouse/touch and native keyboard activation must both reveal a card.
    await page.locator('[data-rune-card="'+indices[0]+'"]').focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-rune-card="'+indices[1]+'"]').click();
  }
  assert.equal(await page.locator("#rune-matched").innerText(),"6/6");
  assert.equal(await page.locator("#rune-moves").innerText(),"7");
  assert.equal(await page.locator("#rune-victory").isVisible(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-runes-finished")),"1");
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-runes-best-normal")),"7");
  assert.equal(await page.locator("#passport-count").innerText(),"7/7");
  assert.equal(await page.locator(".passport-stamp.unlocked").count(),7);
  assert.match(await page.locator("#passport-status").innerText(),/ĐẠI PHÁP SƯ/);
  await page.locator("#rune-restart").click();
  assert.equal(await page.locator("#rune-moves").innerText(),"0");
  assert.equal(await page.locator("#rune-best").innerText(),"7");
  assert.equal(await page.locator("#passport-count").innerText(),"7/7");
  // Hard mode adds two new pairs without removing previously earned badges.
  await page.locator('[data-rune-level="hard"]').click();
  assert.equal(await page.locator("#rune-board .rune-card").count(),16);
  assert.equal(await page.locator('[data-rune-level="hard"]').getAttribute("aria-pressed"),"true");
  cards=await page.locator("#rune-board .rune-card").evaluateAll(els=>els.map(e=>({index:Number(e.dataset.runeCard),pair:e.dataset.pair})));
  const hardPairs=new Map();
  for(const card of cards){if(!hardPairs.has(card.pair))hardPairs.set(card.pair,[]);hardPairs.get(card.pair).push(card.index);}
  for(const indices of hardPairs.values()){
    await page.locator('[data-rune-card="'+indices[0]+'"]').click();
    await page.locator('[data-rune-card="'+indices[1]+'"]').click();
  }
  assert.equal(await page.locator("#rune-matched").innerText(),"8/8");
  assert.equal(await page.locator("#rune-moves").innerText(),"8");
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-runes-best-hard")),"8");
  assert.equal(await page.locator("#passport-count").innerText(),"7/7");
  await page.locator("#rune-restart").click();
  assert.equal(await page.locator("#rune-best").innerText(),"8");

  // Bonus Ghost Rhythm Duel — practice completion and timed challenge.
  const duel=page.locator("#duel-game");
  assert.equal(await duel.getAttribute("data-state"),"idle");
  assert.equal(await page.locator("#duel-sound").getAttribute("aria-pressed"),"false","audio is opt-in");
  await page.locator("#duel-start").click();
  assert.equal(await duel.getAttribute("data-state"),"running");
  assert.equal(await page.locator("[data-duel-lane]").count(),4);
  for(let step=0;step<12;step++){
    const lane=Number(await duel.getAttribute("data-current-lane"));
    assert.ok(lane>=0&&lane<=3);
    if(step%2===0)await page.locator('[data-duel-lane="'+lane+'"]').click();
    else {await page.locator('[data-duel-lane="'+lane+'"]').focus();await page.keyboard.press(String(lane+1));}
  }
  assert.equal(await duel.getAttribute("data-state"),"finished");
  assert.equal(await duel.getAttribute("data-result"),"won");
  assert.equal(await duel.getAttribute("data-hits"),"12");
  assert.equal(await duel.getAttribute("data-misses"),"0");
  assert.equal(await page.locator("#duel-score").innerText(),"1860");
  assert.equal(await page.locator("#duel-best").innerText(),"1860");
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-duel-best-practice")),"1860");
  assert.equal(await page.locator("#passport-count").innerText(),"7/7","bonus must not alter original stamps");
  await page.locator('[data-duel-mode="duel"]').click();
  assert.equal(await duel.getAttribute("data-mode"),"duel");
  await page.locator("#duel-start").click();
  assert.equal(await duel.getAttribute("data-state"),"running");
  await page.locator("#duel-pause").click();
  assert.equal(await duel.getAttribute("data-state"),"paused");
  const frozen=await duel.getAttribute("data-index");
  await page.waitForTimeout(1000);
  assert.equal(await duel.getAttribute("data-index"),frozen,"pause freezes the ghost duel");
  await page.locator("#duel-pause").click();
  assert.equal(await duel.getAttribute("data-state"),"running");
  for(let mistake=0;mistake<5;mistake++){
    const lane=Number(await duel.getAttribute("data-current-lane"));
    await page.locator('[data-duel-lane="'+(lane+1)%4+'"]').click();
  }
  assert.equal(await duel.getAttribute("data-result"),"lost");
  assert.equal(await duel.getAttribute("data-health"),"0");
  assert.equal(await page.locator("#duel-result").isVisible(),true);
  await page.locator("#duel-restart").click();
  assert.equal(await duel.getAttribute("data-state"),"idle");
  assert.equal(await page.locator("#duel-best").innerText(),"0","timed best is separate from practice");
  await page.locator('[data-duel-mode="practice"]').click();
  assert.equal(await page.locator("#duel-best").innerText(),"1860","practice record retained");
  assert.equal(await page.locator("#passport-count").innerText(),"7/7");
  // Bonus daily challenge: same date + same pattern, independent leaderboard and share.
  await page.locator('[data-duel-mode="daily"]').click();
  assert.equal(await duel.getAttribute("data-mode"),"daily");
  assert.equal(await page.locator("#duel-daily-label").isVisible(),true);
  await page.locator("#duel-start").click();
  const dailyDate=await duel.getAttribute("data-challenge-date");
  const dailyPattern=await duel.getAttribute("data-challenge-pattern");
  assert.match(dailyDate,/^\d{4}-\d{2}-\d{2}$/);
  assert.match(dailyPattern,/^[0-3]{16}$/);
  assert.equal(await page.locator("#duel-progress").innerText(),"0/16");
  await page.locator("#duel-pause").click();
  assert.equal(await duel.getAttribute("data-state"),"paused");
  const otherDaily=await context.newPage();
  await otherDaily.goto(base,{waitUntil:"domcontentloaded"});
  await otherDaily.locator('[data-duel-mode="daily"]').click();
  await otherDaily.locator("#duel-start").click();
  assert.equal(await otherDaily.locator("#duel-game").getAttribute("data-challenge-date"),dailyDate,"calendar date must be shared");
  assert.equal(await otherDaily.locator("#duel-game").getAttribute("data-challenge-pattern"),dailyPattern,"daily challenge must be deterministic");
  await otherDaily.close();
  // The paused daily timer preserves its rune while another tab is active.
  assert.equal(await duel.getAttribute("data-state"),"paused");
  const savedRune=await duel.getAttribute("data-index");
  await page.waitForTimeout(950);
  assert.equal(await duel.getAttribute("data-index"),savedRune);
  await page.locator("#duel-pause").click();
  for(let mistake=0;mistake<5;mistake++){
    const lane=Number(await duel.getAttribute("data-current-lane"));
    await page.locator('[data-duel-lane="'+((lane+1)%4)+'"]').click();
  }
  assert.equal(await duel.getAttribute("data-result"),"lost");
  assert.equal(await page.locator("#duel-share").isVisible(),true);
  assert.match(await page.locator("#duel-share-preview").innerText(),new RegExp(dailyDate));
  await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{
    writeText:async text=>{window.__testDuelShare=text;}
  }}));
  await page.locator("#duel-share").click();
  const shared=await page.evaluate(()=>window.__testDuelShare);
  assert.ok(shared.includes("?duelDate="+dailyDate+"#spell-duel"),"copy includes a dated challenge link");
  await page.locator("#duel-restart").click();
  await page.locator("#duel-start").click();
  assert.equal(await duel.getAttribute("data-challenge-pattern"),dailyPattern,"daily replay must use same pattern");
  await page.locator("#duel-restart").click();
  await page.evaluate(date=>localStorage.setItem("ravenhollow-duel-best-daily-"+date,"580"),dailyDate);
  await page.locator("#duel-restart").click();
  assert.equal(await page.locator("#duel-best").innerText(),"580","daily best saved by date");
  await page.locator('[data-duel-mode="practice"]').click();
  assert.equal(await page.locator("#duel-best").innerText(),"1860","daily mode must preserve existing practice high score");
  assert.equal(await page.locator("#duel-share").isVisible(),false);
  assert.equal(await page.locator("#passport-count").innerText(),"7/7");
  const sound=page.locator("#sound-toggle");
  assert.equal(await sound.getAttribute("aria-pressed"),"false");
  await sound.click();
  assert.equal(await sound.getAttribute("aria-pressed"),"true");
  await sound.click();
  assert.equal(await sound.getAttribute("aria-pressed"),"false");
  const effect=page.locator("#effects-toggle");
  await effect.click();
  assert.equal(await effect.getAttribute("aria-pressed"),"false");
  await effect.click();
  assert.equal(await effect.getAttribute("aria-pressed"),"true");
  const mode = await page.locator("#pumpkin-canvas").getAttribute("data-render-mode");
  assert.ok(["webgl","fallback"].includes(mode),"Must report actual rendering mode: "+mode);
  if (mode==="webgl") assert.match(await page.locator("#scene-badge").innerText(),/WEBGL/);
  if (mode==="fallback") assert.match(await page.locator("#scene-badge").innerText(),/2D FALLBACK/);
  const forcedFallback = await context.newPage();
  await forcedFallback.addInitScript(() => {
    Object.defineProperty(window,"WebGLRenderingContext",{value:undefined,configurable:true});
  });
  await forcedFallback.goto(base,{waitUntil:"domcontentloaded",timeout:30000});
  await forcedFallback.waitForFunction(()=>document.querySelector("#pumpkin-canvas")?.dataset.renderMode==="fallback",{timeout:15000});
  assert.equal(await forcedFallback.locator("#pumpkin-fallback").isVisible(),true);
  assert.equal(await forcedFallback.locator("#pumpkin-canvas").isVisible(),false);
  assert.match(await forcedFallback.locator("#scene-badge").innerText(),/2D FALLBACK/);
  assert.equal(await forcedFallback.locator(".pumpkin-eye").count(),2);
  await forcedFallback.locator("#castle-tour-start").click();
  assert.equal(await forcedFallback.locator("#castle-tour").getAttribute("data-render-mode"),"illustration");
  assert.equal(await forcedFallback.locator("#castle-tour-view").isDisabled(),true);
  assert.equal(await forcedFallback.locator("#castle-wayfinder").isVisible(),false);
  assert.equal(await forcedFallback.locator("#castle-walk-pad").isVisible(),false);
  assert.equal(await forcedFallback.locator("#castle-tour-start").getAttribute("aria-pressed"),"false");
  await forcedFallback.locator('[data-castle-room="crypt"]').click();
  await forcedFallback.locator("#castle-tour-enter").click();
  assert.equal(await forcedFallback.locator("#expedition-scene").getAttribute("data-room-scene"),"crypt");
  await forcedFallback.close();
  // Simulate GPU context loss in an isolated Chrome tab; keep the main tab untouched.
  const lossPage=await context.newPage();
  await lossPage.goto(base,{waitUntil:"domcontentloaded",timeout:30000});
  await lossPage.waitForFunction(()=>["webgl","fallback"].includes(document.querySelector("#pumpkin-canvas")?.dataset.renderMode),{timeout:15000});
  let contextLossChecked=false;
  if(await lossPage.locator("#pumpkin-canvas").getAttribute("data-render-mode")==="webgl"){
    const extensionAvailable=await lossPage.evaluate(()=>{
      const canvas=document.querySelector("#pumpkin-canvas");
      const gl=canvas.getContext("webgl2")||canvas.getContext("webgl");
      const ext=gl?.getExtension("WEBGL_lose_context");
      if(!ext)return false;
      ext.loseContext();
      return true;
    });
    if(extensionAvailable){
      await lossPage.waitForFunction(()=>document.querySelector("#pumpkin-canvas")?.dataset.renderMode==="fallback",{timeout:10000});
      assert.equal(await lossPage.locator("#pumpkin-fallback").isVisible(),true);
      contextLossChecked=true;
    }
  }
  await lossPage.close();
  const scene = await page.locator("#pumpkin-canvas").evaluate(e=>{
    const style=getComputedStyle(e);
    return {visible:style.display!=="none",width:e.clientWidth,height:e.clientHeight};
  });
  assert.ok(scene.visible||await page.locator("#pumpkin-fallback").isVisible(),"Canvas or fallback must be visible");
  await mkdir(path.join(ROOT,"tests","artifacts"),{recursive:true});
  await page.screenshot({path:path.join(ROOT,"tests","artifacts","desktop.png"),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(450);
  assert.ok(await page.locator("#menu-toggle").isVisible());
  await page.locator("#menu-toggle").click();
  assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"),"true");
  await page.locator('#nav-links a[href="#realms"]').click();
  assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"),"false");
  const mobileWidth=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
  if(mobileWidth.page>mobileWidth.viewport+3) {
    const offenders=await page.evaluate(()=>[...document.querySelectorAll("*")].map(el=>{const b=el.getBoundingClientRect();return {tag:el.tagName,id:el.id,cls:typeof el.className==="string"?el.className.slice(0,45):"",left:Math.round(b.left),right:Math.round(b.right),width:Math.round(b.width)};}).filter(x=>x.right>innerWidth+5||x.left<-5).slice(0,45));
    console.log("OVERFLOW_DIAGNOSTIC",JSON.stringify(offenders));
  }
  assert.ok(mobileWidth.page<=mobileWidth.viewport+3,"Mobile horizontal overflow: "+JSON.stringify(mobileWidth));
  await page.screenshot({path:path.join(ROOT,"tests","artifacts","mobile.png"),fullPage:true});
  const viewportReport = [];
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    await page.waitForTimeout(120);
    const result = await page.evaluate(() => ({page:document.documentElement.scrollWidth, viewport:innerWidth}));
    viewportReport.push(result);
    if(result.page>result.viewport+3) {
      const offenders=await page.evaluate(()=>[...document.querySelectorAll("*")].map(el=>{const b=el.getBoundingClientRect();return {tag:el.tagName,id:el.id,cls:typeof el.className==="string"?el.className.slice(0,45):"",left:Math.round(b.left),right:Math.round(b.right),width:Math.round(b.width)};}).filter(x=>x.right>innerWidth+2||x.left<-2).slice(0,35));
      console.log("OVERFLOW_AT_"+width,JSON.stringify(offenders));
    }
    assert.ok(result.page<=result.viewport+3,"Horizontal overflow at "+width+"px: "+JSON.stringify(result));
  }
  // Minimap must remain usable at the smallest supported phone viewport.
  await page.setViewportSize({width:320,height:900});
  await page.locator("#castle-tour-start").click();
  if(await page.locator("#castle-tour").getAttribute("data-render-mode")==="webgl"){
    await page.locator("#castle-tour-view").click();
    assert.equal(await page.locator("#castle-wayfinder").isVisible(),true);
    const mobileMap=await page.locator("#castle-wayfinder").evaluate(el=>{
      const box=el.getBoundingClientRect();
      const canvas=el.querySelector("canvas").getBoundingClientRect();
      return {width:box.width,mapWidth:canvas.width,page:document.documentElement.scrollWidth,viewport:innerWidth};
    });
    assert.ok(mobileMap.mapWidth>=100&&mobileMap.mapWidth<180,"phone minimap size "+JSON.stringify(mobileMap));
    assert.ok(mobileMap.width<=mobileMap.viewport,"minimap fits phone "+JSON.stringify(mobileMap));
    assert.ok(mobileMap.page<=mobileMap.viewport+3,"no phone horizontal overflow while wayfinder is visible");
    await page.locator("#castle-tour-view").click();
    await page.locator("#castle-tour-start").click();
  }
  const sw = await page.evaluate(async()=>{
    if (!("serviceWorker" in navigator)) return "unsupported";
    const controller = await Promise.race([
      navigator.serviceWorker.ready.then(reg=>Boolean(reg.active)),
      new Promise(resolve=>setTimeout(()=>resolve("timeout"),9000))
    ]);
    return controller;
  });
  assert.equal(sw,true,"Service worker should activate and cache the static site");
  assert.deepEqual(errors,[],"Browser JS/console errors");
  const offlineTab = await context.newPage();
  await offlineTab.goto(base,{waitUntil:"domcontentloaded",timeout:30000});
  await offlineTab.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),{timeout:10000});
  await context.setOffline(true);
  try {
    await offlineTab.reload({waitUntil:"domcontentloaded",timeout:20000});
    assert.match(await offlineTab.locator("#hero-title").innerText(),/MAGIC/);
    assert.equal(await offlineTab.locator(".order-emblem").count(),4);
    assert.equal(await offlineTab.locator("[data-ingredient]").count(),6);
    assert.equal(await offlineTab.locator("#passport-count").innerText(),"7/7");
    assert.equal(await offlineTab.locator("#candy-road [data-lane]").count(),5);
    assert.equal(await offlineTab.locator("#candy-best").innerText(),"9");
    assert.equal(await offlineTab.locator("#rune-board .rune-card").count(),12);
    assert.equal(await offlineTab.locator("#duel-game [data-duel-lane]").count(),4);
    await offlineTab.locator("#duel-start").click();
    assert.equal(await offlineTab.locator("#duel-game").getAttribute("data-state"),"running");
    await offlineTab.locator("#duel-restart").click();
    assert.equal(await offlineTab.locator("#rune-best").innerText(),"7");
    assert.equal(await offlineTab.evaluate(()=>localStorage.getItem("ravenhollow-runes-best-hard")),"8");
    assert.equal(await offlineTab.locator("#castle-tour").getAttribute("data-render-mode"),"illustration");
    assert.equal(await offlineTab.locator("[data-castle-room]").count(),4);
    assert.equal(await offlineTab.locator("#poster-canvas").evaluate(canvas=>canvas.width),900);
    assert.equal(await offlineTab.locator("#poster-name").inputValue(),"Luna Pháp Sư");
    assert.equal(await offlineTab.locator("[data-room]").count(),4);
    assert.equal(await offlineTab.locator("#expedition-final").isVisible(),true);
    // An archived invite must remain navigable using only cached offline files.
    await offlineTab.goto(base+"/?duelDate=2026-10-27#spell-duel",{waitUntil:"domcontentloaded",timeout:20000});
    await offlineTab.waitForFunction(()=>document.querySelector("#duel-game")?.dataset.challengeSource==="invite",{timeout:10000});
    assert.equal(await offlineTab.locator("#duel-game").getAttribute("data-mode"),"daily");
    assert.equal(await offlineTab.locator("#duel-daily-date").innerText(),"2026-10-27");
    await offlineTab.locator("#duel-start").click();
    assert.match(await offlineTab.locator("#duel-game").getAttribute("data-challenge-pattern"),/^[0-3]{16}$/);
  } finally {
    await context.setOffline(false);
    await offlineTab.close();
  }
  console.log(JSON.stringify({ok:true,base,assets_checked:assets.length,quiz:"3/3",invitation:true,ghosts:true,mobile_menu:true,mobileWidth,viewports:viewportReport,scene,render_mode:mode,webgl_fallback:true,context_loss_tested:contextLossChecked,soundscape:true,effects_toggle:true,arcane_orders:true,spellbook:true,potions:true,castle_expedition:true,castle_tour_3d:castleMode,castle_tour_controls:true,touch_hold_controls:true,first_person_walk:castleMode==='webgl',castle_interiors:'4/4',castle_indoor_collision:true,immersive_relic_riddle:true,secret_crown_chamber:true,quest_wayfinder:true,candy_hunt:true,poster_studio:true,poster_png:"900x1200",rune_memory:true,spell_rhythm_duel:true,passport:"7/7",pwa:sw,offline:true,js_errors:errors,desktop_screenshot:"tests/artifacts/desktop.png",mobile_screenshot:"tests/artifacts/mobile.png"},null,2));
  await context.close();
}catch(err){console.error(err.stack||String(err));process.exitCode=1;}
finally{console.error("SMOKE_CLEANUP_START");await browser?.close();console.error("SMOKE_BROWSER_CLOSED");server.closeAllConnections();await new Promise(resolve=>server.close(resolve));console.error("SMOKE_CLEANUP_DONE");}