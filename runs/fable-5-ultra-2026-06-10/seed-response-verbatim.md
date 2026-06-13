```html
<!DOCTYPE html>
<html lang="en">
<!--
VOXELCRAFT - single-file procedural voxel world. SEED=1337 (override with ?seed=N)
Beyond-checklist / alive features:
- Full day/night cycle (10 min): moving sun disc, moon, fading starfield, warm dusk/dawn horizon,
  fog color always matched to sky (no gray band), world light tint shifts warm at sunset.
- Drifting world-anchored cloud layer.
- Procedural audio: distinct break/place sounds, footsteps only while walking on ground,
  wind ambience, songbirds by day, crickets at night, M mutes.
- Winding rivers carving lowlands and feeding seas; deep multi-block oceans; sand beaches.
- Spaghetti cave tunnels + deep caverns with walkable surface cave mouths and true overhangs.
- Coal shallow / iron deep ore distribution; unbreakable bedrock floor.
- Per-biome smooth grass/leaf tint blending; altitude snow line with rocky slopes below; spruce
  vs oak trees; cacti only on desert sand; flowers/grass tufts; vegetation never floats
  (breaking support removes plants/cacti above).
- Animated water texture, lowered surface, underwater blue fog/tint with swim-up.
- Sprint with eased FOV widening; sneak (slower, lower camera, edge-guarded); fly mode;
  ghost preview of placement; per-vertex ambient occlusion; break particles in block colors.
- Pause fully freezes time/clouds/particles/physics; controls overlay; HUD with FPS/coords/biome/clock/seed.
-->
<head>
<meta charset="utf-8">
<title>Voxelcraft</title>
<style>
html,body{margin:0;padding:0;overflow:hidden;background:#000;height:100%;font-family:'Segoe UI',system-ui,sans-serif;user-select:none}
canvas{display:block}
#vig{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 62%,rgba(0,0,0,.28));z-index:3}
#uw{position:fixed;inset:0;pointer-events:none;background:rgba(18,62,148,.30);display:none;z-index:4}
#xh{position:fixed;left:50%;top:50%;width:20px;height:20px;margin:-10px 0 0 -10px;pointer-events:none;z-index:5;mix-blend-mode:difference}
#xh:before,#xh:after{content:"";position:absolute;background:#fff}
#xh:before{left:9px;top:2px;width:2px;height:16px}
#xh:after{left:2px;top:9px;width:16px;height:2px}
#hud{position:fixed;left:10px;top:10px;color:#fff;font:12px/1.6 monospace;text-shadow:0 1px 2px #000;z-index:6;pointer-events:none}
#hotbar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:4px;z-index:6;pointer-events:none}
.slot{width:48px;height:48px;background:rgba(10,10,14,.55);border:2px solid rgba(255,255,255,.25);border-radius:5px;position:relative;display:flex;align-items:center;justify-content:center}
.slot.sel{border-color:#fff;background:rgba(40,40,50,.7);transform:translateY(-4px)}
.slot canvas{width:36px;height:36px;image-rendering:pixelated}
.slot span{position:absolute;left:3px;top:1px;color:#ccc;font:9px monospace}
.slot i{position:absolute;bottom:1px;right:3px;color:#aaa;font:8px monospace;font-style:normal}
.ovl{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(8,10,18,.78);color:#eee;z-index:10;backdrop-filter:blur(3px)}
.ovl h1{font-size:42px;letter-spacing:8px;margin:0 0 4px;color:#fff;text-shadow:0 2px 12px #4af}
.ovl h2{margin:0 0 10px}
#seedline{color:#9ab;font:13px monospace;margin-bottom:18px}
#keys{display:grid;grid-template-columns:auto auto;gap:5px 16px;font:13px monospace;color:#cde;margin-bottom:20px}
#keys b{color:#fff;background:#223;border:1px solid #456;border-radius:4px;padding:1px 7px;justify-self:end}
#play{font:bold 17px inherit;padding:12px 36px;border-radius:8px;border:1px solid #6af;background:#1a3a6a;color:#fff;cursor:pointer}
#play:hover{background:#2a4f8a}
#prog{font:13px monospace;color:#8fc}
#pause p{color:#abc;font:13px monospace}
</style>
</head>
<body>
<div id="hud"></div>
<div id="xh"></div><div id="vig"></div><div id="uw"></div>
<div id="hotbar"></div>
<div id="ov" class="ovl">
<h1>VOXELCRAFT</h1>
<div id="seedline"></div>
<div id="keys">
<b>Mouse</b><span>look around</span>
<b>W A S D</b><span>move &nbsp;(double-tap W or Ctrl = sprint)</span>
<b>Space</b><span>jump / swim up</span>
<b>Shift</b><span>sneak (slow, edge-safe, lower camera)</span>
<b>L-click</b><span>break block (hold to keep mining)</span>
<b>R-click</b><span>place block</span>
<b>1-7 / wheel</b><span>select block</span>
<b>F</b><span>toggle fly (Space up / Shift down)</span>
<b>N</b><span>skip time of day</span>
<b>M</b><span>mute sound</span>
<b>H</b><span>show / hide this help</span>
<b>Esc</b><span>pause / release mouse</span>
</div>
<div id="prog">Generating world...</div>
<button id="play" style="display:none">Click to Play</button>
</div>
<div id="pause" class="ovl" style="display:none"><h2>Paused</h2><p>Click to resume &middot; H for help</p></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"></script>
<script>
'use strict';
const SEED=1337;
const qs=new URLSearchParams(location.search);
const WS=(parseInt(qs.get('seed'),10)||SEED)|0;
if(!window.THREE){document.getElementById('prog').textContent='Failed to load three.js from CDN (network needed once).';throw 0;}
THREE.ColorManagement.enabled=false;
/* ---------- noise ---------- */
function h2i(x,z){let n=Math.imul(x,374761393)^Math.imul(z,668265263)^Math.imul(WS,974711);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;}
function h2f(x,z){return h2i(x,z)/4294967296;}
function h3i(x,y,z){let n=Math.imul(x,374761393)^Math.imul(y,2246822519)^Math.imul(z,668265263)^Math.imul(WS,974711);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;}
function h3f(x,y,z){return h3i(x,y,z)/4294967296;}
const lerp=(a,b,t)=>a+(b-a)*t;
function sst(e0,e1,x){let t=(x-e0)/(e1-e0);t=t<0?0:t>1?1:t;return t*t*(3-2*t);}
function vn2(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
return lerp(lerp(h2f(xi,zi),h2f(xi+1,zi),u),lerp(h2f(xi,zi+1),h2f(xi+1,zi+1),u),v);}
function fbm2(x,z,o){let a=0,m=.5,f=1,s=0;for(let i=0;i<o;i++){a+=m*vn2(x*f,z*f);s+=m;m*=.5;f*=2.03;}return a/s;}
function vn3(x,y,z){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi,
u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf),
a=lerp(lerp(h3f(xi,yi,zi),h3f(xi+1,yi,zi),u),lerp(h3f(xi,yi,zi+1),h3f(xi+1,yi,zi+1),u),w),
b=lerp(lerp(h3f(xi,yi+1,zi),h3f(xi+1,yi+1,zi),u),lerp(h3f(xi,yi+1,zi+1),h3f(xi+1,yi+1,zi+1),u),w);
return lerp(a,b,v);}
function mb(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/* ---------- textures ---------- */
const TC=document.createElement('canvas');TC.width=128;TC.height=64;const tg=TC.getContext('2d');
function T(i,f){const ox=(i&7)*16,oy=(i>>3)*16,R=mb(i*7919+17);
f((x,y,r,g,b,a)=>{tg.fillStyle='rgba('+(r|0)+','+(g|0)+','+(b|0)+','+(a===undefined?1:a)+')';tg.fillRect(ox+x,oy+y,1,1);},R);}
function noisy(P,R,r,g,b,v){for(let x=0;x<16;x++)for(let y=0;y<16;y++){const n=1+(R()-.5)*v;P(x,y,r*n,g*n,b*n);}}
T(0,(P,R)=>{noisy(P,R,168,176,142,.3);for(let i=0;i<26;i++)P(R()*16|0,R()*16|0,130,142,108);});
T(1,(P,R)=>{noisy(P,R,140,100,68,.3);for(let x=0;x<16;x++){const d=3+(R()*2|0);for(let y=0;y<d;y++)P(x,y,86+R()*30,150+R()*30,52+R()*20);}});
T(2,(P,R)=>{noisy(P,R,140,100,68,.3);for(let i=0;i<14;i++)P(R()*16|0,R()*16|0,104,72,46);});
T(3,(P,R)=>{noisy(P,R,128,128,128,.16);for(let i=0;i<5;i++){let x=R()*16|0,y=R()*16|0;for(let j=0;j<4;j++){P(x&15,y&15,96,96,98);x+=R()<.5?1:0;y+=1;}}});
T(4,(P,R)=>{noisy(P,R,219,205,158,.1);for(let i=0;i<12;i++)P(R()*16|0,R()*16|0,198,182,132);});
T(6,(P,R)=>{for(let x=0;x<16;x++){const c=R()<.28;for(let y=0;y<16;y++){const n=1+(R()-.5)*.2;c?P(x,y,80*n,60*n,36*n):P(x,y,106*n,82*n,50*n);}}P(7,4,60,44,26);P(8,4,60,44,26);P(7,5,60,44,26);});
T(7,(P,R)=>{for(let x=0;x<16;x++)for(let y=0;y<16;y++){const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5)),n=1+(R()-.5)*.18;
if(d>6.7)P(x,y,84*n,64*n,38*n);else (d|0)%2?P(x,y,112*n,88*n,54*n):P(x,y,142*n,114*n,72*n);}});
T(8,(P,R)=>{for(let x=0;x<16;x++)for(let y=0;y<16;y++){const r=R();r<.16?P(x,y,82,104,70):P(x,y,142+r*40,166+r*40,116+r*30);}});
T(9,(P,R)=>{noisy(P,R,238,243,250,.05);});
T(10,(P,R)=>{noisy(P,R,140,100,68,.3);for(let x=0;x<16;x++){const d=3+(R()*2|0);for(let y=0;y<d;y++)P(x,y,232+R()*15,238+R()*12,246);}});
T(11,(P,R)=>{for(let x=0;x<16;x++)for(let y=0;y<16;y++){const v=40+R()*55;P(x,y,v,v,v+4);}});
function oreT(i,r,g,b){T(i,(P,R)=>{noisy(P,R,128,128,128,.16);for(let k=0;k<5;k++){const x=1+R()*13|0,y=1+R()*13|0;P(x,y,r,g,b);P(x+1,y,r,g,b);P(x,y+1,r*1.2,g*1.2,b*1.2);P(x+1,y+1,r*.8,g*.8,b*.8);}});}
oreT(12,32,32,38);oreT(13,205,158,128);
T(14,(P,R)=>{for(let x=0;x<16;x++)for(let y=0;y<16;y++){const rid=x%4===0,n=1+(R()-.5)*.2;rid?P(x,y,44*n,94*n,36*n):P(x,y,60*n,122*n,48*n);if(rid&&y%5===2)P(x,y,190,212,160);}});
T(15,(P,R)=>{for(let x=0;x<16;x++)for(let y=0;y<16;y++){const c=x>3&&x<12&&y>3&&y<12,n=1+(R()-.5)*.2;c?P(x,y,140*n,182*n,110*n):P(x,y,58*n,118*n,46*n);}});
T(16,(P,R)=>{for(let y=7;y<16;y++)P(8,y,52+R()*20,126,40);P(6,10,52,120,40);P(7,9,60,134,44);P(10,11,52,120,40);P(9,10,60,134,44);
const px=[[8,3],[7,4],[9,4],[8,5],[6,3],[10,3],[8,1],[7,2],[9,2]];for(const q of px)P(q[0],q[1],212+R()*40,48,48);P(8,3,250,214,64);});
T(17,(P,R)=>{for(let i=0;i<10;i++){const x=1+(R()*14|0),h=4+R()*9|0;for(let y=0;y<h;y++)P(x,15-y,128+R()*60,158+R()*50,84+R()*30);}});
T(18,(P,R)=>{for(let x=0;x<16;x++)for(let y=0;y<16;y++){const r=R();r<.18?P(x,y,34,58,52):P(x,y,58+r*26,92+r*26,76+r*20);}});
T(19,(P,R)=>{for(let x=0;x<16;x++)for(let y=0;y<16;y++){const n=1+(R()-.5)*.14;y%4===3?P(x,y,118*n,92*n,55*n):P(x,y,172*n,138*n,84*n);}
for(let r=0;r<4;r++)P((r*5+r)%16,r*4+1,118,92,55);});
const avg=[];{const id=tg.getImageData(0,0,128,64).data;for(let t=0;t<24;t++){const ox=(t&7)*16,oy=(t>>3)*16;let r=0,g=0,b=0,n=0;
for(let x=0;x<16;x++)for(let y=0;y<16;y++){const k=((oy+y)*128+ox+x)*4;if(id[k+3]>128){r+=id[k];g+=id[k+1];b+=id[k+2];n++;}}
avg[t]=n?[r/n/255,g/n/255,b/n/255]:[1,1,1];}}
const WC=document.createElement('canvas');WC.width=32;WC.height=32;{const c=WC.getContext('2d'),R=mb(WS^991);
for(let x=0;x<32;x++)for(let y=0;y<32;y++){const r=R(),rip=((y+Math.round(2.5*Math.sin(x/4.5)))%8)===0;
c.fillStyle=rip?'rgb(120,170,235)':'rgb('+(42+r*28|0)+','+(96+r*36|0)+','+(186+r*48|0)+')';c.fillRect(x,y,1,1);}}
const CC2=document.createElement('canvas');CC2.width=128;CC2.height=128;{const c=CC2.getContext('2d');
for(let x=0;x<128;x++)for(let y=0;y<128;y++){const a=sst(.56,.72,fbm2(x*.07+513.3,y*.07-77.7,3));
if(a>0){c.fillStyle='rgba(255,255,255,'+(a*.92).toFixed(2)+')';c.fillRect(x,y,1,1);}}}
/* ---------- blocks ---------- */
const BL={1:{t:[0,2,1],ti:1},2:{t:[2,2,2]},3:{t:[3,3,3]},4:{t:[4,4,4]},5:{},6:{t:[7,7,6]},7:{t:[8,8,8],ti:2},
8:{t:[9,2,10]},9:{t:[11,11,11]},10:{t:[12,12,12]},11:{t:[13,13,13]},12:{t:[15,15,14]},13:{cr:16},14:{cr:17,ti:2},
15:{t:[18,18,18]},16:{t:[19,19,19]}};
const SOLID=b=>b>0&&b!==5&&b!==13&&b!==14;
const OPQ=SOLID;
const NAMES={1:'Grass',2:'Dirt',3:'Stone',4:'Sand',6:'Log',16:'Planks',7:'Leaves'};
const HOT=[1,2,3,4,6,16,7];
/* ---------- worldgen ---------- */
const H=64,SEA=26,RD=6;
const CCmap=new Map();
function CI(x,z){const k=x+'_'+z;let c=CCmap.get(k);if(c)return c;
const cont=fbm2(x*.0035,z*.0035,4),t=fbm2(x*.0045+813.7,z*.0045-217.3,3),m=fbm2(x*.004-411.9,z*.004+672.2,3);
const cold=sst(.42,.3,t),wet=sst(.45,.62,m),dry=sst(.55,.7,t)*(1-wet);
const mtn=sst(.55,.85,cont)*(.45+.85*cold);
const amp=(5+8*wet+38*mtn)*(1-.55*dry);
let h=SEA-7+cont*17+(fbm2(x*.013,z*.013,4)-.5)*2*amp+(fbm2(x*.055,z*.055,2)-.5)*4;
const rv=Math.abs(fbm2(x*.0028+3210.5,z*.0028-1234.5,3)-.5);
const rm=sst(.05,.015,rv)*sst(SEA+22,SEA+3,h);
h+=(SEA-2.5-h)*rm;h=Math.max(3,Math.min(H-12,Math.round(h)));
const biome=t<.36?'snowy':(t>.58&&m<.46)?'desert':m>.55?'forest':'plains';
const snow=h>=45||(biome==='snowy'&&h>SEA);
let tp,un;
if(h<=SEA+1){tp=4;un=4;}else if(biome==='desert'){tp=4;un=4;}else if(snow){tp=8;un=2;}else if(h>=42){tp=3;un=3;}else{tp=1;un=2;}
let tr2=.62,tg2=.93,tb2=.40;
tr2+=(.34-tr2)*wet;tg2+=(.74-tg2)*wet;tb2+=(.27-tb2)*wet;
tr2+=(.78-tr2)*dry;tg2+=(.85-tg2)*dry;tb2+=(.45-tb2)*dry;
tr2+=(.66-tr2)*cold;tg2+=(.78-tg2)*cold;tb2+=(.64-tb2)*cold;
const r=h2i(x^0x51ab,z^0x9e3d);
let tree=0,cac=0,fl=0,tf=0;
if(tp===1){if(biome==='forest'&&r%29===0)tree=1;else if(biome==='plains'&&r%241===0)tree=1;
else if(r%53===1&&!snow)fl=1;else if(r%17===2&&!snow)tf=1;}
else if(tp===8&&biome==='snowy'&&r%61===0)tree=2;
else if(biome==='desert'&&tp===4&&h>SEA+2&&r%97<2)cac=1;
c={h,biome,tp,un,ti:[tr2,tg2,tb2],tree,cac,fl,tf,r,snow};
CCmap.set(k,c);if(CCmap.size>4e5)CCmap.clear();return c;}
function cave(x,y,z,h){const d=h-y;
if(d>14&&vn3(x*.027,y*.045,z*.027)>.79)return true;
const t=.052*Math.min(1,.3+d/7);
const a=vn3(x*.052,y*.085,z*.052)-.5;if(Math.abs(a)>t)return false;
const b=vn3(x*.052+91.3,y*.085+47.7,z*.052+131.1)-.5;return Math.abs(b)<t;}
const chunks=new Map();
function tset(d,x,y,z,b,force){if(x<0||x>15||z<0||z>15||y<1||y>=H)return;const i=(x*16+z)*H+y;if(force||d[i]===0||d[i]===7||d[i]===15)d[i]=b;}
function lset(d,x,y,z,b){if(x<0||x>15||z<0||z>15||y<1||y>=H)return;const i=(x*16+z)*H+y;if(d[i]===0)d[i]=b;}
function genChunk(cx,cz){const key=cx+','+cz;let d=chunks.get(key);if(d)return d;
d=new Uint8Array(16*16*H);chunks.set(key,d);
for(let x=0;x<16;x++)for(let z=0;z<16;z++){
const wx=cx*16+x,wz=cz*16+z,ci=CI(wx,wz),h=ci.h,base=(x*16+z)*H;
d[base]=9;
const cOK=h>SEA;
for(let y=1;y<=h;y++){let b;
if(y===h)b=ci.tp;else if(y>h-4)b=ci.un;else b=3;
if(b===3&&y<h-4){const o=h3i(wx,y,wz)%131;if(o<4&&y>8)b=10;else if(o<6&&y<=14)b=11;}
if(cOK&&y>1&&cave(wx,y,wz,h))b=0;
d[base+y]=b;}
if(h<SEA){for(let y=h+1;y<=SEA;y++)d[base+y]=5;}
else if(d[base+h]===ci.tp&&h+1<H-1){
if(ci.cac){const n=2+(ci.r%2);for(let i=1;i<=n&&h+i<H;i++)d[base+h+i]=12;}
else if(ci.fl)d[base+h+1]=13;
else if(ci.tf)d[base+h+1]=14;}}
for(let tx=-3;tx<19;tx++)for(let tz=-3;tz<19;tz++){
const wx=cx*16+tx,wz=cz*16+tz,ci=CI(wx,wz);
if(!ci.tree)continue;
if(cave(wx,ci.h,wz,ci.h))continue;
const y0=ci.h+1,r=ci.r;
if(ci.tree===1){const th=4+(r%2);
for(let dy=th-2;dy<=th;dy++){const rad=dy===th?1:2;
for(let dx=-rad;dx<=rad;dx++)for(let dz=-rad;dz<=rad;dz++){
if(!dx&&!dz&&dy<th)continue;
if(rad===2&&Math.abs(dx)===2&&Math.abs(dz)===2&&((h3i(wx+dx,y0+dy,wz+dz)&3)===0))continue;
lset(d,tx+dx,y0+dy,tz+dz,7);}}
for(let i=0;i<th;i++)tset(d,tx,y0+i,tz,6,1);
lset(d,tx,y0+th+1,tz,7);
}else{const th=6+(r%2);
for(let dy=2;dy<=th;dy++){const rad=dy===th?0:Math.min(2,Math.max(1,(th-dy)>>1));
for(let dx=-rad;dx<=rad;dx++)for(let dz=-rad;dz<=rad;dz++){
if(rad===2&&Math.abs(dx)===2&&Math.abs(dz)===2)continue;
if(!dx&&!dz&&dy<th)continue;
lset(d,tx+dx,y0+dy,tz+dz,15);}}
for(let i=0;i<th;i++)tset(d,tx,y0+i,tz,6,1);
lset(d,tx,y0+th+1,tz,15);}}
return d;}
let lck='',lcd=null;
function getB(x,y,z){if(y<0)return 9;if(y>=H)return 0;
const cx=x>>4,cz=z>>4,k=cx+','+cz;
if(k!==lck){lcd=genChunk(cx,cz);lck=k;}
return lcd[((x&15)*16+(z&15))*H+y];}
function setB(x,y,z,v){if(y<1||y>=H)return;const d=genChunk(x>>4,z>>4);d[((x&15)*16+(z&15))*H+y]=v;lck='';}
/* ---------- three setup ---------- */
const renderer=new THREE.WebGLRenderer({antialias:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);
const canvas=renderer.domElement;
const scene=new THREE.Scene();
scene.background=new THREE.Color(.5,.7,1);
scene.fog=new THREE.Fog(0x88aaff,RD*16*.5,RD*16*.92);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.08,900);
camera.rotation.order='YXZ';
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const atlas=new THREE.CanvasTexture(TC);atlas.magFilter=atlas.minFilter=THREE.NearestFilter;atlas.generateMipmaps=false;
const wtex=new THREE.CanvasTexture(WC);wtex.magFilter=wtex.minFilter=THREE.NearestFilter;wtex.generateMipmaps=false;wtex.wrapS=wtex.wrapT=THREE.RepeatWrapping;
const ctex=new THREE.CanvasTexture(CC2);ctex.wrapS=ctex.wrapT=THREE.RepeatWrapping;ctex.repeat.set(4,4);
const matO=new THREE.MeshBasicMaterial({map:atlas,vertexColors:true,alphaTest:.4});
const matW=new THREE.MeshBasicMaterial({map:wtex,transparent:true,opacity:.62,depthWrite:false,side:THREE.DoubleSide});
const sky=new THREE.Group();scene.add(sky);
const sun=new THREE.Mesh(new THREE.CircleGeometry(26,20),new THREE.MeshBasicMaterial({color:0xffeeaa,fog:false}));sky.add(sun);
const moon=new THREE.Mesh(new THREE.CircleGeometry(15,20),new THREE.MeshBasicMaterial({color:0xd8e2ff,fog:false}));sky.add(moon);
const stG=new THREE.BufferGeometry();{const sp=new Float32Array(500*3),R=mb(WS^7);
for(let i=0;i<500;i++){const a=R()*6.283,b=Math.acos(R()*2-1),r=460;
sp[i*3]=r*Math.sin(b)*Math.cos(a);sp[i*3+1]=r*Math.cos(b);sp[i*3+2]=r*Math.sin(b)*Math.sin(a);}
stG.setAttribute('position',new THREE.BufferAttribute(sp,3));}
const stars=new THREE.Points(stG,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));sky.add(stars);
const clouds=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshBasicMaterial({map:ctex,transparent:true,opacity:.5,depthWrite:false,fog:false,side:THREE.DoubleSide}));
clouds.rotation.x=-Math.PI/2;clouds.position.y=82;scene.add(clouds);
const hl=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002,1.002,1.002)),new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:.7}));scene.add(hl);hl.visible=false;
const ghost=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.15,depthWrite:false}));scene.add(ghost);ghost.visible=false;
const PM=320,pPos=new Float32Array(PM*3),pCol=new Float32Array(PM*3),pGeo=new THREE.BufferGeometry();
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const pMat=new THREE.PointsMaterial({size:.14,vertexColors:true,depthWrite:false});
const pts=new THREE.Points(pGeo,pMat);pts.frustumCulled=false;scene.add(pts);
let parts=[];
function burst(bx,by,bz,tile){const c=avg[tile]||[1,1,1];
for(let i=0;i<14&&parts.length<PM;i++)parts.push({x:bx+Math.random(),y:by+Math.random(),z:bz+Math.random(),
vx:(Math.random()-.5)*3.2,vy:1.5+Math.random()*3,vz:(Math.random()-.5)*3.2,l:.5+Math.random()*.4,c});}
function updParts(dt){let n=0;
for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.l-=dt;
if(p.l<=0){parts.splice(i,1);continue;}
p.vy-=22*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
if(SOLID(getB(Math.floor(p.x),Math.floor(p.y),Math.floor(p.z)))){p.vy=0;p.vx*=.6;p.vz*=.6;}}
for(const p of parts){pPos[n*3]=p.x;pPos[n*3+1]=p.y;pPos[n*3+2]=p.z;
pCol[n*3]=p.c[0];pCol[n*3+1]=p.c[1];pCol[n*3+2]=p.c[2];n++;}
pGeo.setDrawRange(0,n);pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;}
/* ---------- mesher ---------- */
const FACES=[
{n:[1,0,0],v:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],l:.78,u:2,w:1},
{n:[-1,0,0],v:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],l:.62,u:2,w:1},
{n:[0,1,0],v:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]],l:1,u:0,w:2},
{n:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],l:.5,u:0,w:2},
{n:[0,0,1],v:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]],l:.85,u:0,w:1},
{n:[0,0,-1],v:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]],l:.7,u:0,w:1}];
const AOT=[.42,.6,.8,1];
function tuv(t,u,v){return[((t&7)+.02+u*.96)/8,1-((t>>3)+.02+(1-v)*.96)/4];}
const meshes=new Map();
function buildChunk(cx,cz){const key=cx+','+cz,d=genChunk(cx,cz),wx0=cx*16,wz0=cz*16;
const P=[],C=[],U=[],I=[],WP=[],WU=[],WI=[];
const nb=(x,y,z)=>{if(y<0)return 9;if(y>=H)return 0;
if(x>=0&&x<16&&z>=0&&z<16)return d[(x*16+z)*H+y];return getB(wx0+x,y,wz0+z);};
for(let x=0;x<16;x++)for(let z=0;z<16;z++){
const ci=CI(wx0+x,wz0+z),ti=ci.ti,col=(x*16+z)*H;
for(let y=0;y<H;y++){const b=d[col+y];if(!b)continue;
const bl=BL[b];
if(bl.cr){const tint=bl.ti===2?ti:[1,1,1];
const pls=[[[.1,0,.1],[.9,0,.9],[.9,1,.9],[.1,1,.1]],[[.9,0,.1],[.1,0,.9],[.1,1,.9],[.9,1,.1]]];
for(const pl of pls)for(let w2=0;w2<2;w2++){const vs=w2?pl.slice().reverse():pl,base=P.length/3;
for(let i=0;i<4;i++){const v=vs[i];P.push(x+v[0],y+v[1],z+v[2]);C.push(.95*tint[0],.95*tint[1],.95*tint[2]);
const q=tuv(bl.cr,v[0],v[1]);U.push(q[0],q[1]);}
I.push(base,base+1,base+2,base,base+2,base+3);}
continue;}
if(b===5){const ab=nb(x,y+1,z),tH=ab===5?1:.9;
for(let f=0;f<6;f++){const F=FACES[f],nk=nb(x+F.n[0],y+F.n[1],z+F.n[2]);
if(f===2){if(!(ab===0||ab===13||ab===14))continue;}
else if(!(nk===0||nk===13||nk===14))continue;
const base=WP.length/3;
for(let i=0;i<4;i++){const v=F.v[i],vx=x+v[0],vy=y+v[1]*tH,vz=z+v[2];
WP.push(vx,vy,vz);
if(f===2||f===3)WU.push((wx0+vx)*.5,(wz0+vz)*.5);else WU.push((wx0+vx+wz0+vz)*.5,vy*.5);}
WI.push(base,base+1,base+2,base,base+2,base+3);}
continue;}
for(let f=0;f<6;f++){const F=FACES[f],nk=nb(x+F.n[0],y+F.n[1],z+F.n[2]);
if(OPQ(nk))continue;
const tile=bl.t[f===2?0:f===3?1:2];
const tint=(bl.ti===2||(bl.ti===1&&f===2))?ti:null;
const qx=x+F.n[0],qy=y+F.n[1],qz=z+F.n[2];
const ao=[],base=P.length/3;
for(let i=0;i<4;i++){const v=F.v[i],du=v[F.u]?1:-1,dv=v[F.w]?1:-1;
const o1=[qx,qy,qz],o2=[qx,qy,qz],o3=[qx,qy,qz];
o1[F.u]+=du;o2[F.w]+=dv;o3[F.u]+=du;o3[F.w]+=dv;
const s1=OPQ(nb(o1[0],o1[1],o1[2]))?1:0,s2=OPQ(nb(o2[0],o2[1],o2[2]))?1:0,co=OPQ(nb(o3[0],o3[1],o3[2]))?1:0;
const a=(s1&&s2)?0:3-(s1+s2+co);ao.push(a);
const li=F.l*AOT[a];
P.push(x+v[0],y+v[1],z+v[2]);
if(tint)C.push(li*tint[0],li*tint[1],li*tint[2]);else C.push(li,li,li);
const q=tuv(tile,v[F.u],v[F.w]===undefined?0:v[F.w]);U.push(q[0],q[1]);}
if(ao[0]+ao[2]>=ao[1]+ao[3])I.push(base,base+1,base+2,base,base+2,base+3);
else I.push(base+1,base+2,base+3,base+1,base+3,base);}}}
const g=new THREE.BufferGeometry();
g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
g.setIndex(I);
const m=new THREE.Mesh(g,matO);m.position.set(wx0,0,wz0);scene.add(m);
let wm=null;
if(WP.length){const wg=new THREE.BufferGeometry();
wg.setAttribute('position',new THREE.Float32BufferAttribute(WP,3));
wg.setAttribute('uv',new THREE.Float32BufferAttribute(WU,2));
wg.setIndex(WI);
wm=new THREE.Mesh(wg,matW);wm.position.set(wx0,0,wz0);scene.add(wm);}
meshes.set(key,{o:m,w:wm});}
function dropMesh(k){const m=meshes.get(k);if(!m)return;
scene.remove(m.o);m.o.geometry.dispose();
if(m.w){scene.remove(m.w);m.w.geometry.dispose();}
meshes.delete(k);}
function remesh(cx,cz){const k=cx+','+cz;if(meshes.has(k)){dropMesh(k);buildChunk(cx,cz);}}
/* ---------- player ---------- */
let pos={x:8.5,y:40,z:8.5},vel={x:0,y:0,z:0},yaw=0,pitch=-.1,onGround=false,fly=false,sneak=false,sprint=false;
let eyeH=1.62,key={},lastW=0,locked=false,started=false,slot=0,muted=false;
{let best=null;
for(let r=0;r<600&&!best;r+=8)for(let a=0;a<8;a++){
const x=Math.round(Math.cos(a*.785)*r)+8,z=Math.round(Math.sin(a*.785)*r)+8,ci=CI(x,z);
if(ci.h>SEA+1&&(ci.tp===1||ci.tp===4||ci.tp===8)&&!ci.tree&&!ci.cac&&!cave(x,ci.h,z,ci.h)){best=[x,ci.h,z];break;}}
if(best){pos.x=best[0]+.5;pos.y=best[1]+1.02;pos.z=best[2]+.5;}}
function coll(a,amt){const e=.001;
const x0=Math.floor(pos.x-.3),x1=Math.floor(pos.x+.3-1e-9),y0=Math.floor(pos.y),y1=Math.floor(pos.y+1.8-1e-9),z0=Math.floor(pos.z-.3),z1=Math.floor(pos.z+.3-1e-9);
for(let bx=x0;bx<=x1;bx++)for(let by=y0;by<=y1;by++)for(let bz=z0;bz<=z1;bz++){
if(!SOLID(getB(bx,by,bz)))continue;
if(a===0){pos.x=amt>0?bx-.3-e:bx+1.3+e;vel.x=0;}
else if(a===1){if(amt>0)pos.y=by-1.8-e;else{pos.y=by+1+e;onGround=true;}vel.y=0;}
else{pos.z=amt>0?bz-.3-e:bz+1.3+e;vel.z=0;}
return;}}
function sup(){const y=Math.floor(pos.y-.06);
for(const dx of[-.28,.28])for(const dz of[-.28,.28])
if(SOLID(getB(Math.floor(pos.x+dx),y,Math.floor(pos.z+dz))))return true;
return false;}
let stepAcc=0;
function physics(dt){
let f=(key.KeyW?1:0)-(key.KeyS?1:0),s=(key.KeyD?1:0)-(key.KeyA?1:0);
const L=Math.hypot(f,s);if(L>0){f/=L;s/=L;}
sneak=!!key.ShiftLeft&&!fly;
if(key.ControlLeft&&f>0)sprint=true;
if(f<=0||sneak)sprint=false;
const inW=getB(Math.floor(pos.x),Math.floor(pos.y+.4),Math.floor(pos.z))===5||getB(Math.floor(pos.x),Math.floor(pos.y+1.5),Math.floor(pos.z))===5;
let sp=fly?(sprint?17:10.5):sneak?1.7:sprint?7:4.4;
if(inW&&!fly)sp*=.45;
const sn=Math.sin(yaw),cs=Math.cos(yaw);
vel.x=(-sn*f+cs*s)*sp;vel.z=(-cs*f-sn*s)*sp;
if(fly){vel.y=(key.Space?8:0)+(key.ShiftLeft?-8:0);}
else if(inW){vel.y-=9.5*dt;if(key.Space)vel.y+=30*dt;vel.y=Math.max(-2.8,Math.min(3.2,vel.y));}
else{vel.y-=25*dt;if(vel.y<-45)vel.y=-45;
if(key.Space&&onGround)vel.y=8.4;}
const wasG=onGround;onGround=false;
const ox=pos.x,oz=pos.z;
pos.x+=vel.x*dt;coll(0,vel.x*dt);
if(sneak&&wasG&&!sup())pos.x=ox;
pos.z+=vel.z*dt;coll(2,vel.z*dt);
if(sneak&&wasG&&!sup())pos.z=oz;
let dy=vel.y*dt;const st=Math.max(1,Math.ceil(Math.abs(dy)/.9));
for(let i=0;i<st;i++){pos.y+=dy/st;coll(1,dy);}
const hs=Math.hypot(vel.x,vel.z);
if(onGround&&hs>.5){stepAcc+=hs*dt;if(stepAcc>2.3){stepAcc=0;sStep();}}else stepAcc=0;
eyeH+=((sneak?1.3:1.62)-eyeH)*Math.min(1,dt*10);
camera.position.set(pos.x,pos.y+eyeH,pos.z);
camera.rotation.y=yaw;camera.rotation.x=pitch;
const tf=sprint?87:75;camera.fov+=(tf-camera.fov)*Math.min(1,dt*7);camera.updateProjectionMatrix();}
/* ---------- input ---------- */
const ovEl=document.getElementById('ov'),pauseEl=document.getElementById('pause'),playBtn=document.getElementById('play'),progEl=document.getElementById('prog');
document.getElementById('seedline').textContent='seed '+WS+' \u00b7 add ?seed=42 to the URL for a new world';
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;
if(locked){started=true;ovEl.style.display='none';pauseEl.style.display='none';}
else if(started){pauseEl.style.display='flex';key={};mL=false;mR=false;sprint=false;}});
function lock(){audioInit();canvas.requestPointerLock&&canvas.requestPointerLock();}
playBtn.onclick=e=>{playBtn.blur();lock();};
pauseEl.onclick=lock;
canvas.addEventListener('click',()=>{if(started&&!locked)lock();});
document.addEventListener('mousemove',e=>{if(!locked)return;
yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;
pitch=Math.max(-1.55,Math.min(1.55,pitch));});
let mL=false,mR=false,nextMine=0,nextPlace=0;
document.addEventListener('mousedown',e=>{if(!locked)return;
if(e.button===0){mL=true;tryBreak();nextMine=performance.now()+300;}
if(e.button===2){mR=true;tryPlace();nextPlace=performance.now()+260;}});
document.addEventListener('mouseup',e=>{if(e.button===0)mL=false;if(e.button===2)mR=false;});
addEventListener('wheel',e=>{e.preventDefault();if(locked){slot=(slot+(e.deltaY>0?1:-1)+7)%7;updHotbar();}},{passive:false});
document.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Tab')e.preventDefault();
if(e.repeat)return;key[e.code]=true;
if(e.code==='KeyW'){const n=performance.now();if(n-lastW<280)sprint=true;lastW=n;}
if(e.code==='KeyF'&&locked){fly=!fly;vel.y=0;}
if(e.code==='KeyN'&&locked)gt+=150;
if(e.code==='KeyM'){muted=!muted;if(master)master.gain.value=muted?0:.7;}
if(e.code==='KeyH'){ovEl.style.display=ovEl.style.display==='none'?'flex':'none';}
if(e.code.startsWith('Digit')){const n=+e.code[5];if(n>=1&&n<=7){slot=n-1;updHotbar();}}});
document.addEventListener('keyup',e=>{key[e.code]=false;if(e.code==='KeyW')sprint=false;});
/* ---------- interaction ---------- */
const dirV=new THREE.Vector3();
function ray(){camera.getWorldDirection(dirV);
const o=camera.position;let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z);
const dx=dirV.x,dy=dirV.y,dz=dirV.z,sx=dx>0?1:-1,sy=dy>0?1:-1,sz=dz>0?1:-1;
const tdx=Math.abs(1/dx),tdy=Math.abs(1/dy),tdz=Math.abs(1/dz);
let tmx=(sx>0?x+1-o.x:o.x-x)*tdx,tmy=(sy>0?y+1-o.y:o.y-y)*tdy,tmz=(sz>0?z+1-o.z:o.z-z)*tdz,t=0,fa=-1;
for(let i=0;i<60;i++){
if(tmx<tmy&&tmx<tmz){x+=sx;t=tmx;tmx+=tdx;fa=0;}
else if(tmy<tmz){y+=sy;t=tmy;tmy+=tdy;fa=1;}
else{z+=sz;t=tmz;tmz+=tdz;fa=2;}
if(t>5.5)return null;
const b=getB(x,y,z);
if(b&&b!==5){const n=[0,0,0];n[fa]=fa===0?-sx:fa===1?-sy:-sz;return{x,y,z,b,n};}}
return null;}
function touched(x,y,z){const cx=x>>4,cz=z>>4,lx=x&15,lz=z&15;
remesh(cx,cz);
if(lx===0)remesh(cx-1,cz);if(lx===15)remesh(cx+1,cz);
if(lz===0)remesh(cx,cz-1);if(lz===15)remesh(cx,cz+1);}
function tryBreak(){const h=ray();if(!h)return;
if(h.b===9){sfx(180,.08,.15,2);return;}
const bl=BL[h.b],tile=bl.cr?bl.cr:bl.t[2];
setB(h.x,h.y,h.z,0);
let yy=h.y+1,ab=getB(h.x,yy,h.z);
while(ab===12||ab===13||ab===14){setB(h.x,yy,h.z,0);yy++;ab=getB(h.x,yy,h.z);}
burst(h.x,h.y,h.z,tile);touched(h.x,h.y,h.z);sBreak();}
function overlaps(bx,by,bz){return pos.x+.299>bx&&pos.x-.299<bx+1&&pos.y+1.799>by&&pos.y+.001<by+1&&pos.z+.299>bz&&pos.z-.299<bz+1;}
function placeCell(h){return{x:h.x+h.n[0],y:h.y+h.n[1],z:h.z+h.n[2]};}
function tryPlace(){const h=ray();if(!h)return;
const c=placeCell(h),cb=getB(c.x,c.y,c.z);
if(!(cb===0||cb===5||cb===13||cb===14))return;
if(overlaps(c.x,c.y,c.z))return;
if(c.y<1||c.y>=H)return;
setB(c.x,c.y,c.z,HOT[slot]);touched(c.x,c.y,c.z);sPlace();}
function mineTick(now){if(mL&&now>=nextMine){tryBreak();nextMine=now+290;}
if(mR&&now>=nextPlace){tryPlace();nextPlace=now+260;}}
function updHL(){const h=locked?ray():null;
if(h){hl.visible=true;hl.position.set(h.x+.5,h.y+.5,h.z+.5);
const c=placeCell(h),cb=getB(c.x,c.y,c.z);
if((cb===0||cb===5||cb===13||cb===14)&&!overlaps(c.x,c.y,c.z)&&c.y>=1&&c.y<H){
ghost.visible=true;ghost.position.set(c.x+.5,c.y+.5,c.z+.5);}else ghost.visible=false;}
else{hl.visible=false;ghost.visible=false;}}
/* ---------- audio ---------- */
let AC=null,master=null,nbuf=null,nextChirp=8;
function audioInit(){if(AC){AC.resume&&AC.resume();return;}
try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
master=AC.createGain();master.gain.value=muted?0:.7;master.connect(AC.destination);
nbuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);
const ch=nbuf.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1;
const src=AC.createBufferSource();src.buffer=nbuf;src.loop=true;
const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=300;
const g=AC.createGain();g.gain.value=.035;
const lfo=AC.createOscillator();lfo.frequency.value=.09;
const lg=AC.createGain();lg.gain.value=130;lfo.connect(lg);lg.connect(fl.frequency);lfo.start();
src.connect(fl);fl.connect(g);g.connect(master);src.start();}
function sfx(freq,dur,vol,Q){if(!AC)return;const t=AC.currentTime;
const s=AC.createBufferSource();s.buffer=nbuf;s.loop=true;
const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=Q||1.2;
const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
s.connect(f);f.connect(g);g.connect(master);s.start();s.stop(t+dur);}
function thump(f0,f1,dur,vol){if(!AC)return;const t=AC.currentTime;
const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';
o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
o.connect(g);g.connect(master);o.start();o.stop(t+dur);}
function sBreak(){sfx(1500+Math.random()*600,.13,.5);thump(160,60,.1,.35);}
function sPlace(){thump(130,72,.09,.5);sfx(2100,.05,.12);}
function sStep(){sfx(420+Math.random()*260,.07,.16);}
function chirp(){if(!AC)return;const t=AC.currentTime;
for(let i=0;i<3;i++){const o=AC.createOscillator(),g=AC.createGain(),t0=t+i*.22+Math.random()*.05;
o.type='sine';o.frequency.setValueAtTime(2300+Math.random()*700,t0);o.frequency.exponentialRampToValueAtTime(1700,t0+.12);
g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(.04,t0+.02);g.gain.exponentialRampToValueAtTime(.001,t0+.16);
o.connect(g);g.connect(master);o.start(t0);o.stop(t0+.2);}}
function cricket(){if(!AC)return;const t=AC.currentTime;
for(let i=0;i<4;i++){const o=AC.createOscillator(),g=AC.createGain(),t0=t+i*.09;
o.type='square';o.frequency.value=3900;
g.gain.setValueAtTime(.008,t0);g.gain.exponentialRampToValueAtTime(.0005,t0+.06);
o.connect(g);g.connect(master);o.start(t0);o.stop(t0+.07);}}
/* ---------- streaming ---------- */
let pend=[],lastPC='',ready=false,initTotal=1;
function refreshPend(){const pcx=Math.floor(pos.x/16),pcz=Math.floor(pos.z/16);
pend=[];
for(let dx=-RD;dx<=RD;dx++)for(let dz=-RD;dz<=RD;dz++){
const d2=dx*dx+dz*dz;if(d2>RD*RD+2)continue;
if(!meshes.has((pcx+dx)+','+(pcz+dz)))pend.push([pcx+dx,pcz+dz,d2]);}
pend.sort((a,b)=>b[2]-a[2]);
for(const k of[...meshes.keys()]){const p=k.split(','),ddx=+p[0]-pcx,ddz=+p[1]-pcz;
if(ddx*ddx+ddz*ddz>(RD+2)*(RD+2))dropMesh(k);}}
function updChunks(){const pk=Math.floor(pos.x/16)+','+Math.floor(pos.z/16);
if(pk!==lastPC){lastPC=pk;refreshPend();}
const t0=performance.now(),budget=ready?7:40;
while(pend.length&&performance.now()-t0<budget){const c=pend.pop();
if(!meshes.has(c[0]+','+c[1]))buildChunk(c[0],c[1]);}
if(!ready){if(!pend.length){ready=true;progEl.style.display='none';playBtn.style.display='block';}
else progEl.textContent='Generating world... '+Math.round(100*(1-pend.length/initTotal))+'%';}}
refreshPend();initTotal=pend.length||1;
/* ---------- sky / hud ---------- */
let gt=0;
const skyC=new THREE.Color(),tmpC=new THREE.Color();
function updSky(){const dayT=((gt/600)+.22)%1,ang=dayT*Math.PI*2,sy=Math.sin(ang),sx2=Math.cos(ang);
const dl=sst(-.08,.22,sy),hor=Math.exp(-Math.abs(sy)*7)*(sy>-.3?1:0);
skyC.setRGB(lerp(.012,.45,dl),lerp(.02,.68,dl),lerp(.055,.99,dl));
tmpC.setRGB(.95,.46,.24);skyC.lerp(tmpC,hor*.5);
const cw=getB(Math.floor(camera.position.x),Math.floor(camera.position.y),Math.floor(camera.position.z))===5;
if(cw){scene.fog.near=2;scene.fog.far=22;skyC.setRGB(.04*(1+dl),.13*(1+dl),.32*(1+dl));uwEl.style.display='block';}
else{scene.fog.near=RD*16*.5;scene.fog.far=RD*16*.92;uwEl.style.display='none';}
scene.fog.color.copy(skyC);scene.background.copy(skyC);
const L=.22+.78*dl,lr=Math.min(1,L*(1+.25*hor)),lg2=L*(1-.05*hor),lb=L*(1-.2*hor);
matO.color.setRGB(lr,lg2,lb);matW.color.setRGB(lr,lg2,Math.min(1,lb*1.1));pMat.color.setRGB(lr,lg2,lb);
sky.position.copy(camera.position);
sun.position.set(sx2*430,sy*430,90);sun.lookAt(camera.position);sun.visible=sy>-.18;
sun.material.color.setRGB(1,lerp(.55,.95,dl),lerp(.3,.7,dl));
moon.position.set(-sx2*430,-sy*430,-90);moon.lookAt(camera.position);moon.visible=-sy>-.18;
stars.material.opacity=Math.max(0,1-dl*1.4);
clouds.position.x=camera.position.x;clouds.position.z=camera.position.z;
clouds.material.opacity=.14+.36*dl;
ctex.offset.set(camera.position.x/350-gt*.004,-camera.position.z/350);
wtex.offset.set(gt*.05,gt*.032);
if(AC&&gt>nextChirp){nextChirp=gt+5+Math.random()*12;dl>.6?chirp():cricket();}
return dayT;}
const hudEl=document.getElementById('hud'),uwEl=document.getElementById('uw');
let fpsT=0,fpsN=0,fps=60,hudT=0;
function updHUD(dayT){
const hrs=(6+dayT*24)%24,hh=hrs|0,mm=(hrs%1)*60|0;
hudEl.textContent='FPS '+Math.round(fps)+'  |  XYZ '+Math.floor(pos.x)+' '+Math.floor(pos.y)+' '+Math.floor(pos.z)
+'  |  '+CI(Math.floor(pos.x),Math.floor(pos.z)).biome
+'  |  '+(hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm
+'  |  seed '+WS+(fly?'  |  FLY':'')+(muted?'  |  muted':'');}
/* ---------- hotbar ---------- */
const hbEl=document.getElementById('hotbar');
function buildHotbar(){hbEl.innerHTML='';
HOT.forEach((b,i)=>{const s=document.createElement('div');s.className='slot'+(i===slot?' sel':'');
const cv=document.createElement('canvas');cv.width=16;cv.height=16;
const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
const t=BL[b].t[b===1||b===7?0:2],ox=(t&7)*16,oy=(t>>3)*16;
c.drawImage(TC,ox,oy,16,16,0,0,16,16);
if(BL[b].ti){c.globalCompositeOperation='multiply';c.fillStyle=b===7?'#4a8c38':'#7ec850';c.fillRect(0,0,16,16);
c.globalCompositeOperation='destination-in';c.drawImage(TC,ox,oy,16,16,0,0,16,16);}
const sp=document.createElement('span');sp.textContent=i+1;
const nm=document.createElement('i');nm.textContent=NAMES[b];
s.appendChild(cv);s.appendChild(sp);s.appendChild(nm);hbEl.appendChild(s);});}
function updHotbar(){[...hbEl.children].forEach((s,i)=>s.className='slot'+(i===slot?' sel':''));}
buildHotbar();
/* ---------- main loop ---------- */
camera.position.set(pos.x,pos.y+eyeH,pos.z);
let last=performance.now();
function loop(){requestAnimationFrame(loop);
const now=performance.now();let dt=(now-last)/1000;last=now;
fpsT+=dt;fpsN++;if(fpsT>.5){fps=fpsN/fpsT;fpsT=0;fpsN=0;}
dt=Math.min(dt,.05);
const active=locked&&started;
if(active){gt+=dt;physics(dt);updParts(dt);mineTick(now);}
else{camera.rotation.y=yaw;camera.rotation.x=pitch;}
updChunks();
const dayT=updSky();
updHL();
hudT+=dt;if(hudT>.25||!active){hudT=0;updHUD(dayT);}
renderer.render(scene,camera);}
loop();
</script>
</body>
</html>