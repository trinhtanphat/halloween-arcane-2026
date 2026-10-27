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
  browser=await chromium.launch({headless:true,executablePath:"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",args:["--no-first-run","--disable-background-networking","--enable-unsafe-swiftshader"]});
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
