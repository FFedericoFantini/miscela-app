const CACHE='miscela-app-v1',FILES=['./','./index.html','./app.css','./app.js','./planner.js','./recipes-model.js','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('miscela-app-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 const path=new URL(e.request.url).pathname;if(e.request.mode!=='navigate'&&!FILES.some(f=>new URL(f,self.location.href).pathname===path))return;
 e.respondWith(fetch(e.request).then(response=>{if(response.ok&&!response.redirected){const copy=response.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return response;}).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('./index.html').then(x=>x||Response.error()):Response.error()))));
});
