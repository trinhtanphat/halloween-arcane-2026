const CACHE_NAME = "ravenhollow-static-20261027-v4";
const ROOT = new URL("./", self.location.href);
const CORE = ["./", "./index.html", "./style.css", "./magic.css", "./alchemy.css", "./app.js", "./magic.js", "./alchemy.js", "./favicon.svg", "./icon-192.png", "./icon-512.png", "./manifest.webmanifest", "./assets/haunted-hero.jpg", "./assets/haunted-origins.jpg", "./assets/party-hero.webp", "./assets/party-location.webp"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE.map(asset=>new URL(asset,ROOT).href))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("ravenhollow-static-") && key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin || !url.pathname.startsWith(ROOT.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try {
      const response=await fetch(request);
      if(response.ok && response.type==="basic")await cache.put(request,response.clone());
      return response;
    }catch(error){
      const cached=await cache.match(request,{ignoreSearch:true});
      if(cached)return cached;
      if(request.mode==="navigate"){
        const home=await cache.match(new URL("./index.html",ROOT).href);
        if(home)return home;
      }
      throw error;
    }
  })());
});