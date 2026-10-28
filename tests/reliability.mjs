import {chromium} from "playwright-core";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".webmanifest":"application/manifest+json",".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp",".jpg":"image/jpeg",".json":"application/json"};
const server=createServer(async(req,res)=>{
  try{
    let name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    if(name==="/")name="/index.html";
    const file=path.resolve(ROOT,"."+name);
    if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
    const body=await readFile(file);
    res.writeHead(200,{"Content-Type":MIME[path.extname(file)]||"application/octet-stream","Cache-Control":"no-cache"});
    res.end(body);
  }catch(_){res.writeHead(404);res.end("not found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base=(process.env.RELIABILITY_URL||"http://127.0.0.1:"+server.address().port).replace(/\/$/,"");
let browser;
const report={base,tests:[],errors:[]};
async function createPage(storage={}){
  const context=await browser.newContext({viewport:{width:1280,height:850},deviceScaleFactor:1});
  if(Object.keys(storage).length)await context.addInitScript(values=>{
    for(const [key,value] of Object.entries(values))localStorage.setItem(key,value);
  },storage);
  const page=await context.newPage();
  page.on("pageerror",error=>report.errors.push(error.message));
  await page.goto(base,{waitUntil:"load",timeout:30000});
  await page.waitForFunction(()=>document.querySelector("#castle-tour")?.dataset.vaultState!==undefined,{timeout:15000});
  return {page,context};
}
async function test(name,fn){
  await fn();
  report.tests.push(name);
  console.log("PASS "+name);
}
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXE||"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",args:["--no-first-run","--disable-background-networking","--enable-unsafe-swiftshader"]});
  await test("invalid vault state never grants final relic or passport stamp",async()=>{
    const {page,context}=await createPage({
      "ravenhollow-expedition-relics":'["hall","unexpected-room","hall"]',
      "ravenhollow-vault-finished":"1"
    });
    assert.equal(await page.locator("#vault-open").isDisabled(),true);
    assert.equal(await page.locator("#expedition-final").isVisible(),false);
    assert.equal(await page.locator("#castle-tour").getAttribute("data-vault-state"),"locked");
    assert.equal(await page.locator("#stamp-vault").getAttribute("data-complete"),"false");
    assert.notEqual(await page.evaluate(()=>localStorage.getItem("ravenhollow-vault-finished")),"1");
    await context.close();
  });
  await test("legitimate saved full progress survives reload",async()=>{
    const {page,context}=await createPage({
      "ravenhollow-expedition-relics":JSON.stringify(["hall","library","tower","crypt"]),
      "ravenhollow-vault-finished":"1"
    });
    assert.equal(await page.locator("#expedition-final").isVisible(),true);
    assert.equal(await page.locator("#castle-tour").getAttribute("data-vault-state"),"opened");
    assert.equal(await page.locator("#stamp-vault").getAttribute("data-complete"),"true");
    await page.reload({waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>document.querySelector("#castle-tour")?.dataset.vaultState!==undefined);
    assert.equal(await page.locator("#expedition-final").isVisible(),true);
    await context.close();
  });
  await test("invalid JSON relic storage is repaired, game stays playable",async()=>{
    const {page,context}=await createPage({
      "ravenhollow-expedition-relics":"{ definitely not json",
      "ravenhollow-vault-finished":"1"
    });
    assert.equal(await page.locator("#expedition-final").isVisible(),false);
    assert.equal(await page.locator("#castle-tour").getAttribute("data-vault-state"),"locked");
    await page.locator('#expedition-map [data-room="hall"]').click();
    await page.locator('#expedition-answers [data-answer="1"]').click();
    assert.equal(await page.locator("#expedition-relic").isVisible(),true);
    await context.close();
  });
  await test("two tabs synchronize relics, opened vault, and replay",async()=>{
    const {page:writer,context}=await createPage();
    const reader=await context.newPage();
    reader.on("pageerror",error=>report.errors.push(error.message));
    await reader.goto(base,{waitUntil:"load",timeout:30000});
    const answers={hall:1,library:0,tower:2,crypt:0};
    for(const [id,correct] of Object.entries(answers)){
      await writer.locator('#expedition-map [data-room="'+id+'"]').click();
      await writer.locator('#expedition-answers [data-answer="'+correct+'"]').click();
      await reader.waitForFunction((room)=>
        document.querySelector('#expedition-map [data-room="'+room+'"]')?.classList.contains("found"),id);
    }
    assert.match(await reader.locator("#expedition-progress-label").innerText(),/4\s*\/\s*4/);
    assert.equal(await reader.locator("#castle-tour").getAttribute("data-vault-state"),"ready");
    await writer.locator("#vault-open").click();
    await reader.waitForFunction(()=>document.querySelector("#castle-tour")?.dataset.vaultState==="opened");
    assert.equal(await reader.locator("#expedition-final").isVisible(),true);
    assert.equal(await reader.locator("#stamp-vault").getAttribute("data-complete"),"true");
    await writer.locator("#expedition-replay").click();
    await reader.waitForFunction(()=>document.querySelector("#castle-tour")?.dataset.vaultState==="locked");
    assert.match(await reader.locator("#expedition-progress-label").innerText(),/0\s*\/\s*4/);
    assert.equal(await reader.locator("#stamp-vault").getAttribute("data-complete"),"false");
    assert.equal(await reader.locator("#expedition-final").isVisible(),false);
    // Progress made from the other tab must also propagate back.
    await reader.locator('#expedition-map [data-room="hall"]').click();
    await reader.locator('#expedition-answers [data-answer="1"]').click();
    await writer.waitForFunction(()=>document.querySelector('#expedition-map [data-room="hall"]')?.classList.contains("found"));
    await context.close();
  });
  await test("concurrent tabs preserve both relics even if storage events are delayed",async()=>{
    const context=await browser.newContext({viewport:{width:1100,height:800}});
    // Simulate suspended/background tabs where storage listeners have not run yet.
    await context.addInitScript(()=>{
      const originalAdd=window.addEventListener.bind(window);
      window.addEventListener=(type,...args)=>type==="storage"?undefined:originalAdd(type,...args);
    });
    const a=await context.newPage(),b=await context.newPage();
    a.on("pageerror",error=>report.errors.push(error.message));
    b.on("pageerror",error=>report.errors.push(error.message));
    await Promise.all([
      a.goto(base,{waitUntil:"load",timeout:30000}),
      b.goto(base,{waitUntil:"load",timeout:30000})
    ]);
    await a.locator('#expedition-map [data-room="hall"]').click();
    await b.locator('#expedition-map [data-room="library"]').click();
    await a.locator('#expedition-answers [data-answer="1"]').click();
    await b.locator('#expedition-answers [data-answer="0"]').click();
    const relics=JSON.parse(await b.evaluate(()=>localStorage.getItem("ravenhollow-expedition-relics")));
    assert.deepEqual(new Set(relics),new Set(["hall","library"]),
      "stale tab must merge its new relic with existing persisted relics");
    await b.reload({waitUntil:"load"});
    assert.match(await b.locator("#expedition-progress-label").innerText(),/2\s*\/\s*4/);
    // A replay must not resurrect a previous run from a second stale tab.
    // Simulate a reset from another suspended tab before storage events arrive.
    await a.evaluate(()=>{
      localStorage.setItem("ravenhollow-expedition-relics","[]");
      localStorage.setItem("ravenhollow-vault-finished","");
    });
    await b.locator('#expedition-map [data-room="crypt"]').click();
    await b.locator('#expedition-answers [data-answer="0"]').click();
    const afterReset=JSON.parse(await b.evaluate(()=>localStorage.getItem("ravenhollow-expedition-relics")));
    assert.deepEqual(afterReset,["crypt"],"stale tab must not restore relics erased by replay");
    await a.reload({waitUntil:"load"});
    assert.match(await a.locator("#expedition-progress-label").innerText(),/1\s*\/\s*4/);
    await context.close();
  });
  await test("shared past-day challenge link reproduces rune pattern and ignores malformed dates",async()=>{
    const context=await browser.newContext({viewport:{width:1100,height:800}});
    const a=await context.newPage(),b=await context.newPage();
    for(const p of [a,b])p.on("pageerror",err=>report.errors.push(err.message));
    const date="2026-10-27";
    const url=base+"/?duelDate="+date+"#spell-duel";
    await a.goto(url,{waitUntil:"load",timeout:30000});
    assert.equal(await a.locator("#duel-game").getAttribute("data-mode"),"daily");
    assert.equal(await a.locator("#duel-game").getAttribute("data-challenge-source"),"invite");
    assert.equal(await a.locator("#duel-daily-date").innerText(),date);
    assert.equal(await a.locator("#duel-invite-label").isVisible(),true);
    assert.equal(await a.locator("#duel-today").isVisible(),true);
    await a.locator("#duel-start").click();
    const pattern=await a.locator("#duel-game").getAttribute("data-challenge-pattern");
    assert.match(pattern,/^[0-3]{16}$/);
    assert.equal(await a.locator("#duel-today").isDisabled(),true,"cannot change invite mid-round");
    await a.locator("#duel-pause").click();
    await b.goto(url,{waitUntil:"load",timeout:30000});
    assert.equal(await b.locator("#duel-game").getAttribute("data-mode"),"daily");
    await b.locator("#duel-start").click();
    assert.equal(await b.locator("#duel-game").getAttribute("data-challenge-pattern"),pattern);
    await b.locator("#duel-restart").click();
    await a.locator("#duel-pause").click();
    // Force a quick loss within a single browser task, avoiding timer advances.
    await a.evaluate(()=>{
      const game=document.querySelector("#duel-game");
      for(let i=0;i<5;i++){
        const target=Number(game.dataset.currentLane);
        game.querySelector('[data-duel-lane="'+((target+1)%4)+'"]').click();
      }
    });
    assert.equal(await a.locator("#duel-game").getAttribute("data-state"),"finished");
    const summary=await a.locator("#duel-share-preview").innerText();
    assert.ok(summary.includes("?duelDate="+date+"#spell-duel"),"shared link preserves archive date");
    await a.locator("#duel-today").click();
    assert.equal(await a.locator("#duel-game").getAttribute("data-challenge-source"),"today");
    assert.equal(await a.locator("#duel-today").isVisible(),false);
    assert.equal(new URL(a.url()).searchParams.has("duelDate"),false);
    await b.goto(base+"/?duelDate=2026-02-30#spell-duel",{waitUntil:"load"});
    assert.equal(await b.locator("#duel-game").getAttribute("data-mode"),"practice","invalid Gregorian date ignored");
    await b.goto(base+"/?duelDate=2999-01-01#spell-duel",{waitUntil:"load"});
    assert.equal(await b.locator("#duel-game").getAttribute("data-mode"),"practice","future date ignored");
    await b.goto(base+"/?duelDate="+date+"&duelDate="+date+"#spell-duel",{waitUntil:"load"});
    assert.equal(await b.locator("#duel-game").getAttribute("data-mode"),"practice","duplicate invite params ignored");
    await context.close();
  });
  await test("WebGL can repeatedly initialize and dispose with room transitions",async()=>{
    const {page,context}=await createPage();
    for(let i=0;i<4;i++){
      await page.locator("#castle-tour-start").click();
      const mode=await page.locator("#castle-tour").getAttribute("data-render-mode");
      assert.equal(mode,"webgl","cycle "+i+" enters WebGL");
      await page.locator("#castle-tour-view").click();
      await page.locator('[data-castle-room="tower"]').click();
      await page.locator("#castle-tour-enter").click();
      assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-zone"),"interior");
      await page.locator("#castle-tour-start").click();
      assert.equal(await page.locator("#castle-tour").getAttribute("data-render-mode"),"illustration");
      assert.equal(await page.locator("#castle-tour").getAttribute("data-tour-zone"),"courtyard");
      assert.equal(await page.locator("#castle-wayfinder").isVisible(),false);
    }
    assert.equal(await page.locator("[data-castle-room]").count(),4);
    await context.close();
  });
  await test("genuine mobile touch hold, release and single-tap movement",async()=>{
    // Emulate actual touch pointer events, not mouse clicks.
    const context=await browser.newContext({
      viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true
    });
    const page=await context.newPage();
    page.on("pageerror",error=>report.errors.push(error.message));
    await page.goto(base,{waitUntil:"load",timeout:30000});
    await page.locator("#castle-tour-start").click();
    assert.equal(await page.locator("#castle-tour").getAttribute("data-render-mode"),"webgl");
    await page.locator("#castle-tour-view").click();
    const control=page.locator('[data-walk-action="forward"]');
    await control.scrollIntoViewIfNeeded();
    const rect=await control.boundingBox();
    assert.ok(rect?.width>=35&&rect?.height>=35,"phone pad has adequate target size");
    const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
    const initial=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    const client=await context.newCDPSession(page);
    await client.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
    await page.waitForTimeout(720);
    const held=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    assert.ok(held<initial-1.25,"touch hold must move steadily: "+initial+" -> "+held);
    await client.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await page.waitForTimeout(90);
    assert.equal(await control.getAttribute("data-pressed"),null);
    const released=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    await page.waitForTimeout(220);
    const after=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    assert.ok(Math.abs(after-released)<.08,"released touch must stop movement: "+released+" -> "+after);
    await page.touchscreen.tap(x,y);
    const tapped=Number(await page.locator("#castle-tour-canvas").getAttribute("data-walk-z"));
    assert.ok(tapped<=after-.62&&tapped>=after-.78,"mobile tap must move one step: "+after+" -> "+tapped);
    assert.equal(await page.locator("#castle-wayfinder").isVisible(),true);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),"mobile 3D pad should not overflow");
    await context.close();
  });
  await test("castle WebGL context loss gracefully falls back to fully working 2D",async()=>{
    const {page,context}=await createPage();
    await page.locator("#castle-tour-start").click();
    assert.equal(await page.locator("#castle-tour").getAttribute("data-render-mode"),"webgl");
    const wasLost=await page.locator("#castle-tour-canvas").evaluate(canvas=>{
      const gl=canvas.getContext("webgl2")||canvas.getContext("webgl");
      const ext=gl?.getExtension("WEBGL_lose_context");
      if(!ext)return false;
      ext.loseContext();return true;
    });
    if(!wasLost)throw Error("WEBGL_lose_context unavailable on test GPU");
    await page.waitForFunction(()=>document.querySelector("#castle-tour")?.dataset.renderMode==="illustration",{timeout:10000});
    assert.equal(await page.locator("#castle-wayfinder").isVisible(),false);
    assert.equal(await page.locator("#castle-tour-view").isDisabled(),true);
    await page.locator('[data-castle-room="library"]').click();
    await page.locator("#castle-tour-enter").click();
    assert.equal(await page.locator("#expedition-scene").getAttribute("data-room-scene"),"library");
    await context.close();
  });
  assert.deepEqual(report.errors,[]);
  console.log(JSON.stringify({ok:true,...report},null,2));
}catch(error){
  console.error(error.stack||String(error));process.exitCode=1;
}finally{
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
