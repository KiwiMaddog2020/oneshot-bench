/* ============================================================================
   VOXELCRAFT STAGE-0 REGRESSION SUITE — Protocol v3 (2026-06-12)

   Runs in-page under ?test=1&suite=1 (loader hook in index.html injects this
   file after boot completes). Drives the sim synchronously through the
   window.__vox TEST API — fixed seed 1337, synthetic frames via __vox.step(),
   zero token cost to re-run.

   TEST RATCHET: assertions are never deleted or weakened except by explicit
   owner approval. Every newly credited feature adds an assertion at crediting
   time. See tests/README.md.

   Results: window.__suiteResult = {pass, fail, total, failures:[{id,reason}],
   world_hash}; one greppable "ERROR <id> <reason>" console line per failure;
   final "SUITE PASS|FAIL x/y" line.

   All goldens below were captured live on seed 1337 against the round-12
   build (post lane A/B/C + viewmodel fix) and cross-checked against the
   round-11 panel ledger fingerprints.
   ========================================================================= */
(function(){
'use strict';
var V=window.__vox;
if(!V){console.log('SUITE FAIL 0/0 no __vox (not in ?test=1 mode)');window.__suiteResult={pass:0,fail:1,total:1,failures:[{id:'boot-vox',reason:'no __vox'}],world_hash:null};return;}

/* ---------- tiny assertion + helper kit ---------- */
function A(cond,msg){if(!cond)throw new Error(msg);}
function eq(a,b,msg){if(a!==b)throw new Error(msg+' (got '+JSON.stringify(a)+', want '+JSON.stringify(b)+')');}
function near(a,b,eps,msg){if(!(Math.abs(a-b)<=eps))throw new Error(msg+' (got '+a+', want '+b+'±'+eps+')');}
function fnv(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return(h>>>0).toString(16);}
function st(){return V.getState();}
function invCount(id){var n=0,f=V.invFull();for(var i=0;i<36;i++)if(f[i]&&f[i].id===id)n+=f[i].count;return n;}
function selectItem(id){var f=V.invFull(),i=-1;for(var k=0;k<36;k++)if(f[k]&&f[k].id===id){i=k;break;}if(i<0)return false;if(i!==8)V.swapSlots(i,8);V.key('9');return true;}
function selectEmptyHand(){var f=V.invFull(),i=-1;for(var k=0;k<36;k++)if(!f[k]){i=k;break;}if(i<0)return false;if(i!==8)V.swapSlots(i,8);V.key('9');return true;}
/* stand 2 cells south (-z) of a block, aim eye at a point biased into its top face */
function aimTop(bx,by,bz){var sx=bx,sz=bz-2,sy=V.colInfo(sx,sz).h+1.02,ex=sx+.5,ey=sy+1.62,ez=sz+.5;
var tx=bx+.5,ty=by+1,tz=bz+.6,dx=tx-ex,dy=ty-ey,dz=tz-ez,len=Math.hypot(dx,dy,dz);
V.setCam(ex,sy,ez,Math.atan2(-dx,-dz),Math.asin(dy/len));}
/* stand 2 cells south, aim at a block's center (for mining / brk) */
function aimCenter(bx,by,bz){var sx=bx,sz=bz-2,sy=V.colInfo(sx,sz).h+1.02,ex=sx+.5,ey=sy+1.62,ez=sz+.5;
var tx=bx+.5,ty=by+.5,tz=bz+.5,dx=tx-ex,dy=ty-ey,dz=tz-ez,len=Math.hypot(dx,dy,dz);
V.setCam(ex,sy,ez,Math.atan2(-dx,-dz),Math.asin(dy/len));}
/* place item id so the result lands at (bx,by,bz): aims at top face of the support below */
function placeAt(id,bx,by,bz){if(!selectItem(id))throw new Error('placeAt: no item '+id+' in inventory');aimTop(bx,by-1,bz);V.place();return V.block(bx,by,bz);}
function sfxCount(t){var n=0;for(var i=0;i<V.sfx.length;i++)if(V.sfx[i].t===t)n++;return n;}
function dropsOf(id){return V.dropList().filter(function(d){return d.id===id;});}

/* deterministic flat-strip finder (claims prevent overlap between tests).
   A strip: len cells along +x at row z, identical height h, surface grass/sand,
   air to h+6 on rows z, z-1, z-2 (z-2 is the stand/aim corridor). */
var claims=[];
function clearCol(x,z,h,top){for(var y=h+1;y<=top;y++)if(V.block(x,y,z)!==0)return false;return true;}
function findStrip(len){
for(var z=60;z<=300;z++)for(var x0=40;x0<=300-len;x0++){
var bad=false;for(var c=0;c<claims.length;c++){var cl=claims[c];if(z>=cl.z-3&&z<=cl.z+3&&x0+len-1>=cl.x0-3&&x0<=cl.x1+3){bad=true;break;}}
if(bad)continue;
var h0=V.colInfo(x0,z).h;if(h0<=27)continue;var ok=true;
for(var i=0;i<len&&ok;i++){var x=x0+i;
for(var d=0;d>=-2;d--){var ci=V.colInfo(x,z+d);
if(ci.h!==h0||(d===0&&ci.tp!==1&&ci.tp!==4)||!clearCol(x,z+d,h0,h0+6)){ok=false;break;}}}
if(ok){claims.push({x0:x0,x1:x0+len-1,z:z});return[x0,h0,z];}}
return null;}

/* ---------- suite framework ---------- */
var T=[];
function t(id,family,desc,fn){T.push({id:id,family:family,desc:desc,fn:fn});}
var G={};  /* cross-test context (strips, captured values) */

/* ===================== A. BOOT / WORLD DETERMINISM ===================== */

t('boot-complete','boot','world generation completes (suite drives chunk builds when rAF is starved)',function(){
return new Promise(function(res,rej){var t0=performance.now();
(function poll(){
var ov=document.getElementById('ov');
if(ov&&ov.style.display==='none')return res();
/* hidden tabs starve requestAnimationFrame; updChunks is a top-level classic-script
   function, so we can drive the identical boot path synchronously */
if(typeof window.updChunks==='function'){var n=0;while(n++<600&&ov.style.display!=='none')window.updChunks();}
if(ov.style.display==='none')return res();
if(performance.now()-t0>60000)return rej(new Error('boot timeout after 60s'));
setTimeout(poll,200);})();});});

t('boot-noerrors','boot','zero page errors at suite start',function(){
G.err0=V.errors.length;
eq(G.err0,0,'errors at boot');});

t('spawn-fingerprint','boot','fresh-boot spawn lands at the seed-1337 anchor (116.5,~29.0,115.5)',function(){
var s=st();
eq(s.x,116.5,'spawn x');eq(s.z,115.5,'spawn z');
near(s.y,29.01,0.05,'spawn y (settled)');
A(!s.flying,'not flying at boot');});

t('spawn-safe-solid','boot','spawn is standing on solid ground, not water/air/embedded',function(){
var s=st();var fx=Math.floor(s.x),fz=Math.floor(s.z);
var below=V.block(fx,Math.floor(s.y)-1,fz);
A(below!==0&&below!==5,'block below feet solid, got '+below);
eq(V.block(fx,Math.floor(s.y),fz),0,'feet cell is air');
eq(V.block(fx,Math.floor(s.y)+1,fz),0,'head cell is air');});

t('world-hash','worldgen','pristine world lattice fingerprint (FNV-1a over 7,938 block samples)',function(){
var parts=[];
for(var x=60;x<=180;x+=6)for(var z=60;z<=180;z+=6)for(var y=2;y<=44;y+=6)parts.push(V.block(x,y,z));
G.worldHash=fnv(parts.join(','));
eq(G.worldHash,'911b6032','world lattice hash');});

t('soil-layering','worldgen','spawn column: grass cap, 3 dirt, then stone',function(){
var ci=V.colInfo(116,115);
eq(ci.h,28,'spawn col height');eq(ci.tp,1,'grass surface');
var col=[];for(var y=ci.h+1;y>=ci.h-7;y--)col.push(V.block(116,y,115));
eq(col.join(','),'0,1,2,2,2,3,3,3,3','soil column top-down');});

t('bedrock-floor','worldgen','unbreakable bedrock at y=0 and below-world reads',function(){
eq(V.block(116,0,115),9,'bedrock at y0');
eq(V.block(116,-1,115),9,'below-world reads bedrock');
eq(V.block(204,0,60),9,'bedrock at y0 far afield');});

t('biome-grid','worldgen','4 distinct biomes; 81-point biome grid bit-identical',function(){
var bg='',bs={};
for(var z=-256;z<=256;z+=64)for(var x=-256;x<=256;x+=64){var b=V.colInfo(x,z).biome;bs[b]=1;bg+=b[0];}
eq(Object.keys(bs).length,4,'distinct biome count');
eq(bg,'fsffffffffsfffffffppppdpfffddpppdfffdpdddpfffddddppfffddddppfffddddppfffdpppddddp','biome grid string');});

t('sea-level-water','worldgen','ocean column fills to global sea level (y=26), air above',function(){
var c=V.colInfo(116,91);
eq(c.h,19,'ocean floor depth at (116,91)');
eq(V.block(116,26,91),5,'water at SEA');
eq(V.block(116,27,91),0,'air above SEA');
eq(V.block(116,20,91),5,'water at depth');});

/* ===================== B. FINDERS / STRUCTURES / HAMLET ===================== */

t('structures-registry','structures','findStructures(512): 21 sites — 13 ruins, 7 wells, 1 hamlet at (488,31,440)',function(){
var ss=V.findStructures(512);G.structs=ss;
eq(ss.length,21,'total structures');
var by={};ss.forEach(function(s){by[s.type]=(by[s.type]||0)+1;});
eq(by.ruin,13,'ruins');eq(by.well,7,'wells');eq(by.hamlet,1,'hamlets');
var h=ss.filter(function(s){return s.type==='hamlet';})[0];
eq(h.x,488,'hamlet x');eq(h.y,31,'hamlet y');eq(h.z,440,'hamlet z');});

t('hamlet-torch-registry','structures','gen-placed hamlet torches sync into the light registry (exactly 2, exact coords)',function(){
var tor=V.torches().map(function(p){return p.join(',');}).sort().join(';');
eq(tor,'487,34,441;489,34,438','hamlet torch coords');});

t('hamlet-interior-light','light','hut interior torch-light fingerprint 0.0903 (occlusion-aware)',function(){
var l=V.lightAt(485.5,32.5,438.5);
near(l.torch,0.0903,0.002,'interior torch light');});

t('chest-loot-take','villages','hamlet chest at (484,32,436): deterministic seed 3 bread/4 torch/1 ingot, take-only',function(){
eq(V.block(484,32,436),44,'chest block');
eq(V.chestInfo(484,32,436),null,'chestInfo is map-only (null before first touch)');
var b0=invCount(109),t0=invCount(22),i0=invCount(104);
A(V.chestTake(484,32,436,0),'take slot0');
A(V.chestTake(484,32,436,1),'take slot1');
A(V.chestTake(484,32,436,2),'take slot2');
eq(invCount(109)-b0,3,'bread taken');
eq(invCount(22)-t0,4,'torches taken');
eq(invCount(104)-i0,1,'ingot taken');
var ci=V.chestInfo(484,32,436);
A(ci&&ci[0]===null&&ci[1]===null&&ci[2]===null,'chest emptied');
eq(V.chestTake(484,32,436,0),false,'re-take of emptied slot refuses');});

t('cave-mouth-finder','worldgen','findCaveMouth(160): 4 mouths, nearest (129,32,148)',function(){
var cm=V.findCaveMouth(160);
eq(cm.length,4,'cave mouth count');
eq(cm[0].x,129,'nearest x');eq(cm[0].y,32,'nearest y');eq(cm[0].z,148,'nearest z');});

t('cave-light-floor','light','deep cave pocket skylight floors at exactly 0.1',function(){
V.setCam(116.5,29.02,115.5,0,0);
var pk=V.findCavePocket(64);
A(pk.length>=1,'found a cave pocket near spawn');
var p=pk[0],depth=V.colInfo(p.x,p.z).h-p.y;
A(depth>=6,'pocket deep enough ('+depth+')');
var l=V.lightAt(p.x+.5,p.y+.5,p.z+.5);
eq(l.sky,0.1,'skylight floor');
eq(l.torch,0,'no torch light in pristine cave');});

/* ===================== C. WEATHER ===================== */

t('weather-schedule-hash','weather','deterministic gt-seeded schedule: 48-sample sweep hash + 26 wet samples',function(){
V.setWeather(null);
var sched=[];
for(var h=0;h<24;h+=0.5){V.setTime(h);sched.push(V.weather().scheduled.toFixed(3));}
var nz=sched.filter(function(s){return +s>0;}).length;
eq(fnv(sched.join(',')),'1cd3dc16','weather schedule hash');
eq(nz,26,'wet sample count');
V.setTime(12);});

t('weather-biome-kinds','weather','rain on plains, none in desert, snow in snowy (override path)',function(){
V.setCam(116.5,29.02,115.5,0,0);V.setWeather(1);
var pk=V.weather();eq(pk.kind,'rain','plains kind');eq(pk.intensity,1,'override intensity');
V.setCam(-35.5,30.02,164.5,0,0);V.setWeather(1);
eq(V.weather().kind,'none','desert kind');
V.setCam(-203.5,29.02,-251.5,0,0);V.setWeather(1);
eq(V.weather().kind,'snow','snowy kind');
V.setWeather(null);
eq(V.setWeather(null),null,'override cleared');});

/* ===================== D. PLAYER PHYSICS ===================== */

t('strips-precondition','env','deterministic flat build strips all found',function(){
G.sA=findStrip(19);G.sB=findStrip(10);G.sC=findStrip(10);G.sD=findStrip(8);G.sE=findStrip(8);G.sF=findStrip(8);G.sG=findStrip(6);
A(G.sA&&G.sB&&G.sC&&G.sD&&G.sE&&G.sF&&G.sG,'strips found: '+JSON.stringify([G.sA,G.sB,G.sC,G.sD,G.sE,G.sF,G.sG]));
/* tall clear fall column (air to h+18) with a stand corridor */
G.fall=null;
for(var z=60;z<=240&&!G.fall;z++)for(var x=40;x<=240;x++){
var h0=V.colInfo(x,z).h;if(h0<=27)continue;
var c2=V.colInfo(x,z-2);
if(clearCol(x,z,h0,h0+18)&&Math.abs(c2.h-h0)<=1&&clearCol(x,z-2,c2.h,c2.h+4)){G.fall=[x,h0,z];break;}}
A(G.fall,'fall column found');});

t('move-camera-relative','player','W moves toward view (-z at yaw 0), no sideways drift',function(){
var s0=G.sB;var x=s0[0]+5,h=s0[1],z=s0[2];
V.setCam(x+.5,h+1.02,z+.5,0,0);V.step(0.2);
var a=st();V.key('W',true);V.step(0.5);V.key('W',false);
var b=st();
A(b.z-a.z<-1.9&&b.z-a.z>-2.5,'walked ~2.2 toward -z, got '+(b.z-a.z).toFixed(2));
A(Math.abs(b.x-a.x)<0.05,'no x drift');});

t('jump-one-block','player','calibrated jump arc: mounts one block, never two (~1.4 peak)',function(){
var s0=G.sB;var x=s0[0]+5,h=s0[1],z=s0[2];
V.setCam(x+.5,h+1.02,z+.5,0,0);V.step(0.3);
var y0=st().y,peak=0;
V.key('Space',true);
for(var i=0;i<30;i++){V.step(0.05);var d=st().y-y0;if(d>peak)peak=d;}
V.key('Space',false);V.step(1.5);
A(peak>1.2&&peak<1.95,'jump peak '+peak.toFixed(3));
A(st().onGround,'landed');});

t('sprint-fov','player','sprint engages on Ctrl+W with eased FOV kick toward 87',function(){
var s0=G.sA;var x=s0[0]+1,h=s0[1],z=s0[2];
V.setCam(x+.5,h+1.02,z+.5,-Math.PI/2,0);V.step(0.2); /* face +x along the strip */
V.key('W',true);V.key('Ctrl',true);V.step(1.0);
var s=st();
A(s.sprint===true,'sprint flag');
A(s.fov>82,'fov kicked, got '+s.fov.toFixed(1));
V.key('Ctrl',false);V.key('W',false);V.step(0.5);
A(st().sprint===false,'sprint released');});

t('sneak-eyeheight','player','sneak lowers the camera toward 1.3 and survives release',function(){
var s0=G.sB;var x=s0[0]+5,h=s0[1],z=s0[2];
V.setCam(x+.5,h+1.02,z+.5,0,0);V.step(0.2);
V.key('Shift',true);V.step(0.8);
var s=st();
A(s.sneak===true,'sneak flag');
A(s.eyeH<1.42,'eye lowered, got '+s.eyeH.toFixed(2));
V.key('Shift',false);V.step(0.8);
A(st().eyeH>1.55,'eye restored');});

t('fly-toggle','player','F toggles fly: hover without falling, gravity restored on exit',function(){
var s0=G.sB;var x=s0[0]+5,h=s0[1],z=s0[2];
V.setCam(x+.5,h+4,z+.5,0,0);
V.key('F');A(st().flying===true,'flying on');
var y0=st().y;V.step(0.5);
near(st().y,y0,0.01,'hovers in fly');
V.key('F');A(st().flying===false,'flying off');
V.step(0.3);A(st().y<y0-0.3,'falls after fly off');V.step(1.0);});

t('fall-damage','health','15-block fall deals exact armor-free damage',function(){
var f=G.fall;
V.setHunger(20);V.setHp(20);
V.setCam(f[0]+.5,f[1]+1.02+15,f[2]+.5,0,0);V.step(3);
var s=st();
A(s.onGround,'landed');
G.fallHp=s.hp;
A(s.hp<20&&s.hp>0,'took fall damage, hp '+s.hp);
eq(s.hp,7,'exact fall damage (20 -> 7: discrete-integration impact vy ~-27.5, dmg 13)');});

t('fall-armor-reduction','combat','plank armor flat -1 on the same fall; durability ticks',function(){
var f=G.fall;
V.give(115,1);
V.setHp(20);V.setCam(f[0]+.5,f[1]+1.02+15,f[2]+.5,0,0);V.step(3);
eq(st().hp,G.fallHp+1,'armor absorbed exactly 1');
var inv=V.invFull(),arm=null;for(var i=0;i<36;i++)if(inv[i]&&inv[i].id===115)arm=inv[i];
A(arm&&arm.dur===59,'armor durability 60 -> 59');
/* discard armor so later combat math stays armor-free: swap to slot 8 and Q-drop, then walk away */
selectItem(115);V.key('Q');
V.setCam(f[0]+.5,f[1]+1.02,f[2]+.5,0,0);
eq(invCount(115),0,'armor discarded');
V.setHp(20);});

t('swim-clamps','player','deep-water vertical velocity clamps at exactly +3.2/-2.8 under held Space',function(){
V.setHp(20);
V.setCam(116.5,21,91.5,0,0);V.step(0.5);
var vmax=-99,vmin=99;
V.key('Space',true);
for(var i=0;i<60;i++){V.step(0.05);var vy=st().vel.y;if(vy>vmax)vmax=vy;if(vy<vmin)vmin=vy;}
V.key('Space',false);
eq(vmax,3.2,'swim up clamp');
eq(vmin,-2.8,'sink clamp');});

t('drowning','health','air drains 1/s for 10s, then 2 dmg per second; recovery at 3/s on land',function(){
V.setHp(20);
V.setCam(116.5,21,91.5,0,0);
V.step(9.5);
var a=st();
A(a.air<1&&a.air>0,'air nearly empty at 9.5s, got '+a.air.toFixed(2));
eq(a.hp,20,'no damage before air empties');
V.step(4.0);
eq(st().hp,14,'exactly 3 drown ticks of 2 (20 -> 14)');
V.setCam(116.5,29.02,115.5,0,0);V.step(2.5);
A(st().air>6,'air recovers on land');
V.setHp(20);V.setHunger(20);});

/* ===================== E. INVENTORY / CRAFT / FOOD / TOOLS ===================== */

t('give-stacking','inventory','stacks cap at 64 and split correctly',function(){
var before=invCount(3);
V.give(3,70);
eq(invCount(3)-before,70,'all 70 stone arrived');
var f=V.invFull();
for(var i=0;i<36;i++)if(f[i])A(f[i].count<=64,'slot '+i+' over 64: '+f[i].count);});

t('craft-matrix','crafting','all 23 recipes resolve through the grid matcher with zero shadowing',function(){
var M=[[{6:1},16,4],[{16:2},100,4],[{16:4},17,1],
[{16:3,100:2},101,1],[{3:3,100:2},102,1],[{104:3,100:2},103,1],
[{108:3},109,1],[{3:5},23,1],[{100:1,10:1},22,4],
[{16:2,100:1},111,1],[{3:2,100:1},112,1],[{104:2,100:1},113,1],
[{16:6},115,1],[{104:5},116,1],[{3:1,100:1},25,1],
[{10:1},27,4],[{10:2,16:2},29,1],[{16:5},31,1],
[{16:3,24:3},35,1],[{100:3,24:2},117,1],
[{4:4},40,1],[{3:4},41,4],[{3:1},42,1],[{27:1,100:1},45,1]];
for(var i=0;i<M.length;i++){var rec=M[i],stacks=[];
for(var id in rec[0])stacks.push([+id,rec[0][id]]);
var r=V.matchGrid(stacks);
A(r,'recipe '+i+' (out '+rec[1]+') resolves');
eq(r.out,rec[1],'recipe '+i+' output');
eq(r.n,rec[2],'recipe '+i+' count');}});

t('craft-shadow-probes','crafting','most-specific-wins: 5 stone=furnace, 6 planks=armor, stone+stick=lever',function(){
eq(V.matchGrid([[3,5]]).out,23,'5 stone -> furnace not bricks/button');
eq(V.matchGrid([[16,6]]).out,115,'6 planks -> armor not sticks/door');
eq(V.matchGrid([[3,1],[100,1]]).out,25,'stone+stick -> lever not button');
eq(V.matchGrid([[3,3],[100,2]]).out,102,'3 stone + 2 stick -> stone pick not lever');
eq(V.matchGrid([[100,1],[10,1]]).out,22,'stick+coal -> torch');
eq(V.matchGrid([[27,1],[100,1]]).out,45,'wire+stick -> redstone torch (no torch-22 collision)');});

t('craft-consumes','crafting','craft() consumes exact inputs and yields output',function(){
V.give(4,4);
var sand0=invCount(4),ss0=invCount(40);
A(V.craft(40),'craft sandstone');
eq(sand0-invCount(4),4,'4 sand consumed');
eq(invCount(40)-ss0,1,'1 sandstone gained');
eq(V.craft(999),false,'unknown recipe refuses');});

t('hunger-eat-bread','hunger','bread restores exactly +5 (10 -> 15)',function(){
V.setHunger(10);
A(selectItem(109),'bread in hand');
A(V.eat(),'ate');V.step(0.5);
eq(st().hunger,15,'hunger after bread');});

t('hunger-eat-mutton','hunger','cooked mutton +6 (10 -> 16), berries +2 on top',function(){
V.give(120,1);V.give(118,1);
V.setHunger(10);
selectItem(120);A(V.eat(),'ate mutton');V.step(0.5);
eq(st().hunger,16,'hunger after cooked mutton');
selectItem(118);A(V.eat(),'ate berries');V.step(0.5);
eq(st().hunger,18,'hunger after berries');});

t('eat-full-refuses','hunger','eating at hunger 20 refuses',function(){
V.setHunger(20);V.give(109,1);selectItem(109);
eq(V.eat(),false,'refused at full hunger');});

t('poison-flesh','health','rotten flesh: +3 hunger, 8s poison drains exactly 4 hp, never below floor',function(){
V.give(114,1);V.setHp(20);V.setHunger(10);
selectItem(114);A(V.eat(),'ate flesh');
eq(st().hunger,13,'hunger +3');
A(st().poison>0,'poison active');
V.step(8.5);
eq(st().hp,16,'poison drained exactly 4');
eq(st().poison,0,'poison expired clean');
V.setHp(20);V.setHunger(20);});

t('tool-gate-barehand','tools','stone bricks: bare hand mines slow (2.2s) and drops NOTHING',function(){
var s0=G.sC;var x=s0[0]+1,h=s0[1],z=s0[2];
V.give(3,8);A(V.craft(41),'craft bricks');
eq(placeAt(41,x,h+1,z),41,'brick placed');
A(selectEmptyHand(),'empty hand');
aimCenter(x,h+1,z);
var d0=dropsOf(41).length;
V.mineHold(true);V.step(1.0);
eq(V.block(x,h+1,z),41,'brick survives 1.0s bare-hand');
V.step(1.6);
eq(V.block(x,h+1,z),0,'brick broken by 2.6s');
V.mineHold(false);
eq(dropsOf(41).length,d0,'NO drop without the tool tier');});

t('tool-gate-woodpick','tools','wood pick mines the brick ~3x faster (0.7s) WITH the drop',function(){
var s0=G.sC;var x=s0[0]+1,h=s0[1],z=s0[2];
V.give(16,3);V.give(100,2);A(V.craft(101),'craft wood pick');
eq(placeAt(41,x,h+1,z),41,'brick placed');
A(selectItem(101),'pick in hand');
aimCenter(x,h+1,z);
var d0=dropsOf(41).length;
V.mineHold(true);V.step(0.35);
eq(V.block(x,h+1,z),41,'brick survives 0.35s with pick');
V.step(0.6);
eq(V.block(x,h+1,z),0,'brick broken by 0.95s with pick');
V.mineHold(false);
eq(dropsOf(41).length,d0+1,'tier-gated drop appeared');});

t('furnace-smelt','smelting','raw mutton + plank fuel cooks in 5s into cooked mutton',function(){
var s0=G.sC;var x=s0[0]+4,h=s0[1],z=s0[2];
V.give(3,5);A(V.craft(23),'craft furnace');
eq(placeAt(23,x,h+1,z),23,'furnace placed');
V.give(119,1);V.give(16,1);
A(V.furnacePut(x,h+1,z,'inp',119,1),'put input');
A(V.furnacePut(x,h+1,z,'fuel',16,1),'put fuel');
V.step(5.3);
var f=V.furnaceInfo(x,h+1,z);
A(f&&f.out&&f.out.id===120&&f.out.count===1,'cooked mutton out, got '+JSON.stringify(f));
A(f.inp===null,'input consumed');});

t('farm-grow-stages','farming','seeds till-and-plant; crop advances 19 -> 20 -> 21 on the growth ticker',function(){
var s0=G.sC;var x=s0[0]+7,h=s0[1],z=s0[2];
eq(V.block(x,h,z),1,'farm cell is grass');
V.give(107,1);
A(selectItem(107),'seeds in hand');
aimTop(x,h,z);V.place();
eq(V.block(x,h,z),18,'tilled to farmland');
eq(V.block(x,h+1,z),19,'planted stage 1');
V.growCrops();V.step(1.2);
eq(V.block(x,h+1,z),20,'stage 2');
V.growCrops();V.step(1.2);
eq(V.block(x,h+1,z),21,'mature');});

t('farm-harvest','farming','mature wheat drops wheat + bonus seed',function(){
var s0=G.sC;var x=s0[0]+7,h=s0[1],z=s0[2];
var w0=dropsOf(108).length,sd0=dropsOf(107).length;
aimCenter(x,h+1,z);V.brk();
eq(V.block(x,h+1,z),0,'harvested');
eq(dropsOf(108).length,w0+1,'wheat dropped');
eq(dropsOf(107).length,sd0+1,'bonus seed dropped');});

t('bush-harvest-regrow','farming','berry bush: harvest 38->39 with berries, regrows to 38 after 60s',function(){
/* deterministic natural-bush scan with a clear south aim corridor */
var bush=null;
for(var r=0;r<80&&!bush;r++)for(var a=0;a<24;a++){
var x=Math.round(116+Math.cos(a*0.2618)*r),z=Math.round(115+Math.sin(a*0.2618)*r);
var h=V.colInfo(x,z).h;
if(V.block(x,h+1,z)!==38)continue;
var hs=V.colInfo(x,z-2).h;
if(Math.abs(hs-h)<=1&&clearCol(x,z-1,Math.min(h,V.colInfo(x,z-1).h),h+3)&&clearCol(x,z-2,hs,hs+3)){bush=[x,h+1,z];break;}}
A(bush,'natural bush with clear corridor found');
G.bush=bush;
var b0=dropsOf(118).length;
aimCenter(bush[0],bush[1],bush[2]);V.brk();
eq(V.block(bush[0],bush[1],bush[2]),39,'bush picked (39, never air)');
A(dropsOf(118).length>b0,'berries dropped');
V.key('N');  /* +150 gt — beyond the 60s regrow window */
V.step(1.5);
eq(V.block(bush[0],bush[1],bush[2]),38,'bush regrew');});

t('bow-fires','combat','bow fires an arrow skyward and spends durability',function(){
V.give(117,1);
A(selectItem(117),'bow in hand');
var s0=G.sB;V.setCam(s0[0]+5.5,s0[1]+1.02,s0[2]+.5,0,1.2);
var n0=V.arrows().length,b0=sfxCount('bow');
V.place();
A(V.arrows().length>n0,'arrow in flight');
eq(sfxCount('bow'),b0+1,'bow twang logged');
var f=V.invFull(),bow=null;for(var i=0;i<36;i++)if(f[i]&&f[i].id===117)bow=f[i];
A(bow&&bow.dur===59,'bow durability 60 -> 59');
V.step(2.2); /* let the arrow land/expire */});

/* ===================== F. REDSTONE ===================== */

t('redstone-wire-decay','redstone','lever radiates 15, wire decays 1/step: wire14 powered, wire15 dead',function(){
var s0=G.sA;var x0=s0[0],h=s0[1],z=s0[2];
V.give(3,2);V.give(100,2);V.give(10,8);V.give(16,10);
A(V.craft(25),'craft lever');A(V.craft(31),'craft door');
for(var c=0;c<5;c++)A(V.craft(27),'craft wires '+c);
eq(placeAt(31,x0,h+1,z),31,'door placed at west end');
eq(placeAt(25,x0+1,h+1,z),25,'lever placed');
for(var i=2;i<=17;i++)eq(placeAt(27,x0+i,h+1,z),27,'wire '+(i-1)+' placed');
V.interact(x0+1,h+1,z); /* lever ON */
eq(V.block(x0+1,h+1,z),26,'lever ON');
eq(V.block(x0+2,h+1,z),28,'wire1 powered (14)');
eq(V.block(x0+15,h+1,z),28,'wire14 powered (pow 1)');
eq(V.block(x0+16,h+1,z),27,'wire15 dead (pow 0)');
eq(V.block(x0+17,h+1,z),27,'wire16 dead');});

t('redstone-powered-door','redstone','door opens on the power edge, closes on the drop, pdoor cue logged',function(){
var s0=G.sA;var x0=s0[0],h=s0[1],z=s0[2];
eq(V.block(x0,h+1,z),33,'door lower OPEN under power');
eq(V.block(x0,h+2,z),34,'door upper OPEN under power');
A(sfxCount('pdoor')>=1,'pdoor cue');
V.interact(x0+1,h+1,z); /* lever OFF */
eq(V.block(x0+1,h+1,z),25,'lever OFF');
eq(V.block(x0,h+1,z),31,'door closed on power drop');
eq(V.block(x0,h+2,z),32,'door upper closed');
eq(V.block(x0+2,h+1,z),27,'wires depowered');});

t('door-manual-toggle','redstone','free-standing door toggles by hand from both halves',function(){
var s0=G.sD;var x=s0[0]+5,h=s0[1],z=s0[2];
V.give(16,5);A(V.craft(31),'craft door');
eq(placeAt(31,x,h+1,z),31,'door placed');
eq(V.block(x,h+2,z),32,'upper half placed');
V.interact(x,h+1,z);
eq(V.block(x,h+1,z),33,'opened from lower half');
eq(V.block(x,h+2,z),34,'upper followed atomically');
V.interact(x,h+2,z);
eq(V.block(x,h+1,z),31,'closed from upper half');
eq(V.block(x,h+2,z),32,'lower followed atomically');});

t('redstone-button-pulse','redstone','button: momentary 15-source, exact 1.5 sim-second release',function(){
var s0=G.sD;var x=s0[0]+1,h=s0[1],z=s0[2];
V.give(3,1);V.give(10,3);V.give(16,2);
A(V.craft(42),'craft button');A(V.craft(27),'craft wire');A(V.craft(29),'craft lamp');
eq(placeAt(42,x,h+1,z),42,'button placed');
eq(placeAt(27,x+1,h+1,z),27,'wire placed');
eq(placeAt(29,x+2,h+1,z),29,'lamp placed');
V.interact(x,h+1,z);
eq(V.block(x,h+1,z),43,'button pressed');
eq(V.block(x+1,h+1,z),28,'wire powered');
eq(V.block(x+2,h+1,z),30,'lamp lit');
var bt=V.buttons();
A(bt.length===1&&bt[0].x===x,'button timer armed');
V.step(0.8);
eq(V.block(x,h+1,z),43,'still pressed at 0.8s');
V.step(1.0);
eq(V.block(x,h+1,z),42,'released by 1.8s');
eq(V.block(x+1,h+1,z),27,'wire depowered');
eq(V.block(x+2,h+1,z),29,'lamp dark');
A(sfxCount('button')>=1&&sfxCount('buttonoff')>=1,'press+release cues');});

t('lamp-light-registry','light','lit lamp joins the torch registry with exact 1/7-step falloff',function(){
var s0=G.sD;var x=s0[0]+1,h=s0[1],z=s0[2];
var t0=V.torches().length;
V.interact(x,h+1,z); /* press button -> lamp lit */
eq(V.torches().length,t0+1,'lamp registered while lit');
var l1=V.lightAt(x+2.5,h+2.5,z+.5); /* 1 block above lamp */
near(l1.torch,0.857143,0.001,'falloff at dist 1');
var l2=V.lightAt(x+2.5,h+3.5,z+.5); /* 2 blocks above */
near(l2.torch,0.714286,0.001,'falloff at dist 2');
V.step(2.0); /* button expires */
eq(V.torches().length,t0,'lamp deregistered when dark');});

t('torch-occlusion-AB','light','one wall between torch and sample cuts light to exactly 25%',function(){
var s0=G.sB;var x=s0[0]+6,h=s0[1],z=s0[2];
eq(placeAt(22,x,h+1,z),22,'torch placed');
var open=V.lightAt(x+2.5,h+1.5,z+.5); /* dist 2 along +x, clear */
near(open.torch,0.714286,0.001,'A: open value at dist 2');
eq(placeAt(3,x+1,h+1,z),3,'occluder placed between');
var occ=V.lightAt(x+2.5,h+1.5,z+.5);
near(occ.torch,0.714286*0.25,0.002,'B: occluded value = A x 0.25');});

t('redstone-inverter','redstone','redstone torch: sources 15 by default, dies when its support is powered (NOT gate)',function(){
var s0=G.sB;var x0=s0[0],h=s0[1],z=s0[2];
V.give(3,5);V.give(10,3);V.give(16,2);V.give(100,2);
A(V.craft(27),'craft wires');A(V.craft(29),'craft lamp');A(V.craft(25),'craft lever');A(V.craft(45),'craft redstone torch');
eq(placeAt(3,x0+2,h+1,z),3,'support placed');
eq(placeAt(3,x0+3,h+1,z),3,'support2 placed');
eq(placeAt(3,x0+4,h+1,z),3,'support3 placed');
eq(placeAt(25,x0+1,h+1,z),25,'lever placed beside support');
eq(placeAt(45,x0+2,h+2,z),45,'redstone torch on support');
eq(placeAt(27,x0+3,h+2,z),28,'wire placed — born powered by the lit torch');
eq(placeAt(29,x0+4,h+2,z),30,'lamp placed — born lit');
var rt0=sfxCount('rtorch');
V.interact(x0+1,h+1,z); /* lever ON powers the support -> torch dies */
eq(V.block(x0+1,h+1,z),26,'lever ON');
eq(V.block(x0+2,h+2,z),46,'torch killed (NOT gate)');
eq(V.block(x0+3,h+2,z),27,'wire dead');
eq(V.block(x0+4,h+2,z),29,'lamp dark');
V.interact(x0+1,h+1,z); /* lever OFF -> torch relights */
eq(V.block(x0+2,h+2,z),45,'torch restored');
eq(V.block(x0+3,h+2,z),28,'wire repowered');
eq(V.block(x0+4,h+2,z),30,'lamp relit');
A(sfxCount('rtorch')>=rt0+2,'rtorch flips logged');
G.invTorch=[x0+2,h+2,z];G.invLamp=[x0+4,h+2,z];});

t('pwr-edit-triggered-only','redstone','updatePower never runs on idle frames',function(){
var p0=V.pwrCalls();
V.step(2.0);
eq(V.pwrCalls(),p0,'pwrCalls flat across 120 idle frames');});

t('placement-refusals','player','non-solid deco refuses as support; zero-item place refuses audibly',function(){
/* wire onto a natural grass tuft face */
var tuft=null;
for(var r=0;r<60&&!tuft;r++)for(var a=0;a<24;a++){
var x=Math.round(116+Math.cos(a*0.2618)*r),z=Math.round(115+Math.sin(a*0.2618)*r);
var h=V.colInfo(x,z).h;
if(V.block(x,h+1,z)!==14)continue;
var hs=V.colInfo(x,z-2).h;
if(Math.abs(hs-h)<=1&&clearCol(x,z-1,Math.min(h,V.colInfo(x,z-1).h),h+3))tuft=[x,h+1,z];}
A(tuft,'natural tuft found');
V.give(10,1);A(V.craft(27),'craft wire');
A(selectItem(27),'wire in hand');
var r0=sfxCount('refuse');
aimCenter(tuft[0],tuft[1],tuft[2]);V.place();
eq(sfxCount('refuse'),r0+1,'deco-face refusal logged');
eq(V.block(tuft[0],tuft[1],tuft[2]),14,'tuft untouched');
eq(V.block(tuft[0],tuft[1]+1,tuft[2]),0,'no floating wire above the tuft');
/* zero-item refusal on a valid face */
var s0=G.sD;A(selectEmptyHand(),'empty hand');
aimTop(s0[0]+7,s0[1],s0[2]);
var r1=sfxCount('refuse');
V.place();
eq(sfxCount('refuse'),r1+1,'zero-item refusal logged');});

/* ===================== G. MOBS / COMBAT / SPAWN GATING ===================== */

t('spawn-gate-dark','mobs','midnight unlit column accepts a zombie ("ok"), real mob appears',function(){
V.clearMobs();V.setTime(0);
var s0=G.sF;var x=s0[0]+1,z=s0[2];
eq(V.lightAt(x+.5,s0[1]+1.5,z+.5).torch,0,'column truly unlit');
eq(V.spawnAt('zombie',x,z),'ok','dark spawn accepted');
eq(V.mobs().filter(function(m){return m.type==='zombie';}).length,1,'zombie exists');
V.clearMobs();});

t('spawn-gate-light','mobs','torch-lit column rejects hostiles ("light") at midnight',function(){
var s0=G.sF;var x=s0[0]+1,h=s0[1],z=s0[2];
eq(placeAt(22,x,h+1,z),22,'torch placed');
eq(V.spawnAt('zombie',x+2,z),'light','lit column rejected');
V.setTime(12);
eq(V.spawnAt('zombie',s0[0]+6,z),'light','daylight rejects hostiles');});

t('spawn-gate-biome-cap','mobs','passives gate on biome; spawner respects the global mob cap',function(){
eq(V.spawnAt('pig',-36,164),'biome','pig refuses desert');
V.clearMobs();
var s0=G.sG;
for(var i=0;i<8;i++)A(V.spawnMob('pig',s0[0]+.5+(i%6),s0[1]+1.1,s0[2]+.5),'spawn pig '+i);
eq(V.mobs().length,8,'cap filled');
eq(V.spawnAt('pig',s0[0]+2,s0[2]),'cap','9th spawn refused at cap');
eq(V.spawnMob('zombie',s0[0]+.5,s0[1]+1.1,s0[2]+.5),false,'direct spawn also refused at cap');
V.clearMobs();});

t('mob-containment','containment','non-finite inputs bounce off every state-mutating probe',function(){
var s=st();
eq(V.setCam(NaN,30,100,0,0),false,'setCam NaN refused');
var s2=st();
eq(s2.x,s.x,'pos untouched');eq(s2.yaw,s.yaw,'yaw untouched');
V.look(NaN,NaN);
eq(st().yaw,s.yaw,'look NaN no-op');
eq(V.spawnMob('zombie',NaN,5,NaN),false,'spawnMob NaN refused');
eq(V.mobs().length,0,'no mob from NaN spawn');});

t('villager-def','villages','villager species exists on the mob substrate (hp 10, passive)',function(){
V.clearMobs();
var s0=G.sG;
A(V.spawnMob('villager',s0[0]+.5,s0[1]+1.1,s0[2]+.5),'villager spawns');
var m=V.mobs()[0];
eq(m.type,'villager','type');eq(m.hp,10,'hp 10');
V.clearMobs();});

t('sheep-chain','mobs','sheep dies to exactly 4 bare-hand hits (8/6/4/2), drops wool + mutton',function(){
V.clearMobs();V.setTime(12);
var s0=G.sF;var x=s0[0]+4,h=s0[1],z=s0[2];
A(V.spawnMob('sheep',x+.5,h+1.02,z+.5),'sheep spawned');
A(selectEmptyHand(),'bare hand');
/* aim from 2 south at the sheep body */
var sy=V.colInfo(x,z-2).h+1.02,ex=x+.5,ey=sy+1.62,ez=z-2+.5;
var dx=0,dy=(h+1.6)-ey,dz=2.0,len=Math.hypot(dx,dy,dz);
V.setCam(ex,sy,ez,Math.atan2(-dx,-dz),Math.asin(dy/len));
var hps=[];
for(var i=0;i<4;i++){A(V.attack(),'hit '+(i+1)+' connected');
var m=V.mobs().filter(function(q){return q.type==='sheep';})[0];
hps.push(m?m.hp:null);}
eq(hps[0],6,'hp after hit 1');eq(hps[1],4,'hp after hit 2');eq(hps[2],2,'hp after hit 3');
A(hps[3]!==null&&hps[3]<=0,'dead after hit 4');
var w0=dropsOf(24).length,m0=dropsOf(119).length;
V.step(0.2);
eq(V.mobs().length,0,'sheep removed');
var wool=dropsOf(24).length-w0,mut=dropsOf(119).length-m0;
A(wool>=1,'wool dropped');
eq(mut,1,'exactly 1 raw mutton');
/* walk over the drops to bank wool for the bed */
V.setCam(x+.5,h+1.02,z+.5,0,0);V.step(1.4);
A(invCount(24)>=1,'wool picked up');});

t('wool-bed-craft','crafting','sheep wool + planks craft a bed',function(){
if(invCount(24)<3)V.give(24,3-invCount(24));
V.give(16,3);
var b0=invCount(35);
A(V.craft(35),'bed crafted');
eq(invCount(35),b0+1,'bed in inventory');});

/* ===================== H. BED / DEATH / CORPSE RUN ===================== */

t('bed-spawnset','beds','bed right-click sets the respawn point (daytime: no sleep)',function(){
V.setTime(12);
var s0=G.sE;var x=s0[0]+2,h=s0[1],z=s0[2];
eq(placeAt(35,x,h+1,z),35,'bed placed');
var ss0=sfxCount('spawnset'),ns0=sfxCount('nosleep');
A(V.interact(x,h+1,z),'bed used');
eq(sfxCount('spawnset'),ss0+1,'spawnset logged');
eq(sfxCount('nosleep'),ns0+1,'daytime: nosleep path');
G.bed=[x,h+1,z];});

t('corpse-run-spill','combat','death drops every occupied slot at the death point; inventory wipes',function(){
var f=G.fall;
var slots=V.invFull().filter(function(s){return !!s;}).length;
A(slots>=3,'carrying at least 3 stacks ('+slots+')');
var d0=V.dropList().length;
V.setHp(20);V.setCam(f[0]+.5,f[1]+1.02+40,f[2]+.5,0,0);
V.step(4);
eq(st().hp,0,'died to the fall');
A(V.dropList().length-d0>=slots,'all slots spilled ('+(V.dropList().length-d0)+'/'+slots+')');
A(V.invFull().every(function(s){return !s;}),'inventory wiped');});

t('bed-respawn','beds','respawn returns to the bed while it stands, vitals restored',function(){
document.getElementById('respawn').onclick();
var s=st();
eq(s.hp,20,'hp restored');
eq(s.x,G.bed[0]+.5,'respawn x at bed');
eq(s.z,G.bed[2]+.5,'respawn z at bed');
near(s.y,G.bed[1]+1.02,0.05,'respawn y standing on the bed');});

t('bedgone-fallback','beds','destroyed bed falls back to world spawn with the bedgone cue',function(){
aimCenter(G.bed[0],G.bed[1],G.bed[2]);V.brk();
eq(V.block(G.bed[0],G.bed[1],G.bed[2]),0,'bed broken');
var f=G.fall,bg0=sfxCount('bedgone');
V.setHp(20);V.setCam(f[0]+.5,f[1]+1.02+40,f[2]+.5,0,0);V.step(4);
eq(st().hp,0,'died again');
document.getElementById('respawn').onclick();
var s=st();
eq(sfxCount('bedgone'),bg0+1,'bedgone logged');
eq(s.x,116.5,'world spawn x');eq(s.z,115.5,'world spawn z');
near(s.y,29.02,0.05,'world spawn y');});

/* ===================== I. SAVE / LOAD ROUND TRIP ===================== */

t('save-integrity','saveload','save() writes a v:1 snapshot carrying edits, chests, player state',function(){
V.give(4,4);A(V.craft(40),'craft marker sandstone');
var s0=G.sB;
eq(placeAt(40,s0[0]+8,s0[1]+1,s0[2]),40,'marker placed');
G.marker=[s0[0]+8,s0[1]+1,s0[2]];
/* park far afield with no bed, then save: the classic spawn-anchor trap */
V.setCam(204.5,29.02,60.5,0,0);V.step(0.3);
V.save();
var sv=JSON.parse(localStorage.getItem('vox_'+1337));
G.savedGt=sv.player.gt;
eq(sv.v,1,'save version');
A(Array.isArray(sv.edits)&&sv.edits.length>10,'edits persisted ('+sv.edits.length+')');
A(Array.isArray(sv.chs),'chest field present');
eq(sv.player.x,204.5,'player x saved');
/* spawnPt persists by design even after its bed is destroyed; the LOAD path must then take
   the bedgone fallback to true world spawn — exactly the r10 credit the r11 hunter falsified */
A(sv.player.sp&&sv.player.sp.x===G.bed[0]+.5,'sp persisted, pointing at the destroyed bed');
var ids={};sv.edits.forEach(function(e){ids[e[1]]=1;});
A(ids[40]&&ids[45]&&ids[26]===undefined,'marker + lit redstone torch among edits');});

t('load-roundtrip','saveload','?load=1 boot restores position, edits, redstone state, emptied chest',function(){
return new Promise(function(res,rej){
var ifr=document.createElement('iframe');
ifr.style.cssText='position:fixed;left:0;top:0;width:320px;height:200px;visibility:hidden';
ifr.src='/?test=1&load=1';
document.body.appendChild(ifr);G.ifr=ifr;
var t0=performance.now();
(function poll(){
var W=ifr.contentWindow;
if(!W||!W.__vox){
if(performance.now()-t0>45000)return rej(new Error('iframe boot timeout (45s) — CDN three.js unreachable?'));
return setTimeout(poll,300);}
try{
var IV=W.__vox,s=IV.getState();
eq(s.x,204.5,'loaded boot keeps the saved position x');
eq(s.z,60.5,'loaded boot z');
A(Math.abs(s.time-G.savedGt)<90,'gt restored (drift '+(s.time-G.savedGt).toFixed(1)+'s)');
eq(IV.block(G.marker[0],G.marker[1],G.marker[2]),40,'marker block persisted');
eq(IV.block(G.invTorch[0],G.invTorch[1],G.invTorch[2]),45,'lit redstone torch persisted');
eq(IV.block(G.invLamp[0],G.invLamp[1],G.invLamp[2]),30,'lit lamp persisted');
var reg=IV.torches().map(function(p){return p.join(',');});
A(reg.indexOf(G.invLamp.join(','))>=0,'lit lamp re-registered in the light registry on load');
var ci=IV.chestInfo(484,32,436);
A(ci&&ci[0]===null&&ci[1]===null&&ci[2]===null,'taken chest loot stays taken across reload');
eq(IV.errors.length,0,'no errors in loaded instance');
res();}catch(e){rej(e);}})();});});

t('load-spawn-anchor','saveload','no-bed death after reload respawns at WORLD spawn, not the save point',function(){
var IV=G.ifr.contentWindow.__vox,ID=G.ifr.contentDocument;
IV.setHp(20);IV.setCam(204.5,69.02,60.5,0,0);IV.step(4);
eq(IV.getState().hp,0,'died in loaded instance');
ID.getElementById('respawn').onclick();
var s=IV.getState();
eq(s.x,116.5,'respawn x = world spawn (not 204.5)');
eq(s.z,115.5,'respawn z = world spawn');
near(s.y,29.02,0.05,'respawn y');
eq(s.hp,20,'vitals restored');});

t('save-cleanup','saveload','clearSave leaves the origin pristine for future fresh boots',function(){
if(G.ifr){G.ifr.remove();G.ifr=null;}
V.clearSave();
eq(localStorage.getItem('vox_'+1337),null,'save cleared');});

/* ===================== J. AUDIO / PERF / FINAL ===================== */

t('audio-generators','audio','all 9 registered sfx generators render real signal offline',function(){
return V.audioCheck().then(function(out){
if(out===null)return; /* environment without OfflineAudioContext: vacuous pass, flagged in README */
var gens=['break','place','chirp','rain','step','bow','arrowhit','poison','caveamb'];
gens.forEach(function(g){A(out[g]!==undefined&&out[g]>0.01,g+' peak '+out[g]);});});});

t('viewmodel-api','rendering','held-item viewmodel pass exposes coherent state',function(){
var vm=V.vm();
A(vm&&typeof vm.id==='number'&&typeof vm.children==='number','vm() shape');});

t('perf-sanity','perf','chunk build cost and heap stay inside the marathon envelope',function(){
var p=V.perf(),m=V.mem();
A(p.build.n>50,'built chunks ('+p.build.n+')');
A(p.build.avg<60,'build avg ms '+p.build.avg);
A(m.chunks>100,'chunk map populated');
A(m.heap===null||m.heap<600e6,'heap '+(m.heap/1e6|0)+'MB');});

t('sfx-ledger','audio','every credited action cue appeared in the sfx ledger this run',function(){
var need=['break','place','lever','door','pdoor','button','buttonoff','rtorch','eat','poison','spawnset','nosleep','bedgone','refuse','hit','bow','rain'];
var have={};V.sfx.forEach(function(s){have[s.t]=1;});
var miss=need.filter(function(n){return !have[n];});
eq(miss.join(','),'','missing cues');});

t('final-noerrors','boot','zero sim/render/page errors across the whole suite',function(){
eq(V.errors.length,0,'errors after full suite: '+JSON.stringify(V.errors.slice(0,3)));});

/* ---------- runner ---------- */
window.__suite={
tests:T,
run:function(){
var pass=0,fail=0,failures=[],i=0,t0=performance.now();
function fin(){
var total=pass+fail;
window.__suiteResult={pass:pass,fail:fail,total:total,failures:failures,world_hash:G.worldHash||null,ms:Math.round(performance.now()-t0)};
console.log('SUITE '+(fail?'FAIL':'PASS')+' '+pass+'/'+total);
return window.__suiteResult;}
return new Promise(function(resolve){
(function next(){
if(i>=T.length)return resolve(fin());
var tc=T[i++];
var done=function(){next();};
var bad=function(e){fail++;var reason=String(e&&e.message||e);failures.push({id:tc.id,reason:reason});console.log('ERROR '+tc.id+' '+reason);next();};
try{var r=tc.fn();
if(r&&typeof r.then==='function')r.then(function(){pass++;done();},bad);
else{pass++;done();}}
catch(e){bad(e);}})();});}};

window.__suite.run();
})();
