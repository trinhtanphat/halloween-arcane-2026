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
  const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
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
  const assets = ["assets/party-hero.webp","assets/party-location.webp","assets/haunted-hero.jpg","assets/haunted-origins.jpg","app.js","style.css","magic.js","magic.css","sw.js","manifest.webmanifest","icon-192.png","icon-512.png","alchemy.js","alchemy.css"];
  for(const asset of assets){
    const response=await page.request.get(base+"/"+asset);
    assert.equal(response.status(),200,"asset missing: "+asset);
  }
  await page.locator("#summon-ghosts").click();
  assert.equal(await page.locator(".cemetery").evaluate(e=>e.classList.contains("summoned")),true);
  await page.locator("#wizard-name").fill("Merlin Demo");
  await page.locator("#invitation-form button").click();
  await page.locator("#invitation-response").waitFor();
  assert.match(await page.locator("#invitation-response").innerText(),/Merlin Demo/);
  assert.equal(await page.evaluate(()=>localStorage.getItem("ravenhollow-wizard")),"Merlin Demo");
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
  assert.equal(await page.locator("#passport-count").innerText(),"4/4");
  assert.equal(await page.locator(".passport-stamp.unlocked").count(),4);
  assert.match(await page.locator("#passport-status").innerText(),/ĐẠI PHÁP SƯ/);
  await page.locator("#potion-next").click();
  assert.match(await page.locator("#potion-step").innerText(),/01 \/ 03/);
  assert.equal(await page.locator("#passport-count").innerText(),"4/4");
  assert.equal((JSON.parse(await page.evaluate(()=>localStorage.getItem("ravenhollow-spells")))).length,4);
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
    assert.equal(await offlineTab.locator("#passport-count").innerText(),"4/4");
  } finally {
    await context.setOffline(false);
    await offlineTab.close();
  }
  console.log(JSON.stringify({ok:true,base,assets_checked:assets.length,quiz:"3/3",invitation:true,ghosts:true,mobile_menu:true,mobileWidth,viewports:viewportReport,scene,arcane_orders:true,spellbook:true,potions:true,passport:"4/4",pwa:sw,offline:true,js_errors:errors,desktop_screenshot:"tests/artifacts/desktop.png",mobile_screenshot:"tests/artifacts/mobile.png"},null,2));
  await context.close();
}catch(err){console.error(err.stack||String(err));process.exitCode=1;}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}