(function () {
 'use strict';
 if (window.__LUMEN_SKU_SHARE_V2 || !/(\.|^)lumenluxos\.com$/i.test(location.hostname)) return;
 window.__LUMEN_SKU_SHARE_V2 = true;
 const manifestUrl = 'https://raw.githubusercontent.com/lidiafeitosalucianojunior-hash/velum-android-download/main/lumen-share/v2/catalog.json';
 const media = new Map(), attached = new WeakSet(), pairs = [];
 const css = document.createElement('style');
 css.textContent = '.lumen-sku-tag{position:fixed;z-index:2147480000;pointer-events:none;color:#69523b;font:600 11px Arial,sans-serif;letter-spacing:.04em;background:#fffdf9e6;border:1px solid #c5b69e;border-radius:5px;padding:3px 6px;white-space:nowrap}.lumen-save-mask{position:fixed;inset:0;z-index:2147483000;background:#000b;display:grid;place-items:center;padding:20px}.lumen-save-panel{width:min(420px,95vw);max-height:94dvh;overflow:auto;background:#fffaf5;border-radius:14px;padding:14px;color:#58432f;font:14px Arial,sans-serif;box-shadow:0 20px 60px #0005}.lumen-save-panel img{display:block;max-width:100%;max-height:62dvh;margin:6px auto;object-fit:contain}.lumen-save-actions{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px}.lumen-save-actions button{padding:10px 14px;border:1px solid #a48b68;border-radius:8px;background:#553f28;color:white;font:600 13px Arial,sans-serif}.lumen-save-actions button:last-child{background:white;color:#553f28}';
 document.head.appendChild(css);
 function skuText(p){return 'REF '+String(p[1]||'').slice(0,30);}
 function srcFor(p){return 'https://static.wixstatic.com/media/'+encodeURI(p[2])+'/v1/fit/w_1800,h_1800,q_95/file.jpg';}
 function fileName(p){return 'LUMEN-REF-'+String(p[1]).replace(/[^a-z0-9_-]/gi,'')+'-9x16.jpg';}
 function loadImage(url){return new Promise(function(resolve,reject){
  const im=new Image();im.crossOrigin='anonymous';im.onload=function(){resolve(im);};
  im.onerror=function(){reject(Error('FOTO_INDISPONIVEL'));};im.src=url;
 });}
 async function createBlob(p){
  const img=await loadImage(srcFor(p));
  const c=document.createElement('canvas');c.width=1080;c.height=1920;
  const g=c.getContext('2d');if(!g)throw Error('CANVAS');
  g.fillStyle='#f8f5f0';g.fillRect(0,0,1080,1920);
  const fit=Math.min(990/img.naturalWidth,1650/img.naturalHeight);
  const w=img.naturalWidth*fit,h=img.naturalHeight*fit;
  g.drawImage(img,(1080-w)/2,80+(1650-h)/2,w,h);
  g.strokeStyle='#dfd5c7';g.lineWidth=2;g.beginPath();g.moveTo(50,1783);g.lineTo(1030,1783);g.stroke();
  g.fillStyle='#665034';g.font='36px Georgia,serif';g.fillText('LÚMEN LUXOS',50,1840);
  g.textAlign='right';g.font='bold 37px Arial,sans-serif';g.fillText(skuText(p),1030,1840);
  const sizes=Array.isArray(p[3])?p[3].filter(x=>/^(3[3-9]|4[0-5])$/.test(String(x))).slice(0,13):[];
  if(sizes.length){g.textAlign='left';g.font='25px Arial,sans-serif';g.fillStyle='#87735f';g.fillText('NUMERAÇÕES  '+sizes.join('  •  '),50,1892);}
  const blob=await new Promise(ok=>c.toBlob(ok,'image/jpeg',.94));
  if(!blob||blob.size<3000)throw Error('IMG_GERACAO');
  return blob;
 }
 function save(blob,p){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.download=fileName(p);a.href=url;document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},60000);
 }
 async function share(blob,p){
  if(typeof navigator.share!=='function'||typeof File==='undefined')return false;
  const f=new File([blob],fileName(p),{type:'image/jpeg'});
  try{
   if(typeof navigator.canShare==='function'&&!navigator.canShare({files:[f]}))return false;
   await navigator.share({title:String(p[0]),text:String(p[0])+' • '+skuText(p)+' • www.lumenluxos.com',files:[f]});
   return true;
  }catch(e){return e&&e.name==='AbortError';}
 }
 function preview(blob,p){
  const mask=document.createElement('div');mask.className='lumen-save-mask';mask.setAttribute('role','dialog');
  mask.setAttribute('aria-label','Salvar imagem do produto em 9 por 16');
  const panel=document.createElement('div');panel.className='lumen-save-panel';
  const headline=document.createElement('div');headline.textContent='Foto 9:16 • '+skuText(p);
  headline.style.fontWeight='bold';
  const img=document.createElement('img');const url=URL.createObjectURL(blob);img.src=url;img.alt=String(p[0]);
  const hint=document.createElement('div');hint.textContent='Salve a imagem ou compartilhe com a referência gravada discretamente.';
  const actions=document.createElement('div');actions.className='lumen-save-actions';
  function make(label,func){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',func);actions.appendChild(b);}
  function close(){mask.remove();URL.revokeObjectURL(url);}
  make('Salvar foto',function(){save(blob,p);});
  make('Compartilhar',async function(){if(!await share(blob,p))save(blob,p);});
  make('Fechar',close);
  panel.append(headline,img,hint,actions);mask.appendChild(panel);
  mask.addEventListener('click',function(e){if(e.target===mask)close();});
  document.body.appendChild(mask);
 }
 function mediaKey(s){
  const m=String(s||'').match(/\/media\/([^/?#]+)/);return m?decodeURIComponent(m[1]):'';
 }
 function shareCandidates(){return Array.from(document.querySelectorAll('button,[role="button"],svg,[data-testid],[data-hook],[aria-label]')).filter(function(el){
  const s=['aria-label','data-testid','data-hook','title'].map(a=>el.getAttribute(a)||'').join(' ').toLowerCase();
  return /compartilh|share/.test(s);
 }).slice(0,240);}
 function findShare(img,candidates){
  const a=img.getBoundingClientRect();if(!a.width||!a.height)return null;
  let chosen=null,score=1e9;
  for(const btn of candidates){
   const b=btn.getBoundingClientRect();if(!b.width||!b.height||b.height>100||b.width>180)continue;
   const dx=Math.abs((a.left+a.right)/2-(b.left+b.right)/2);
   const dy=b.top-a.bottom;
   if(dx>a.width*.47||dy<10||dy>440)continue;
   const value=dy+dx*.7;if(value<score){chosen=btn;score=value;}
  }
  return chosen;
 }
 function install(img,p,btn){
  if(attached.has(img))return;attached.add(img);
  img.style.webkitTouchCallout='none';
  let timer=null;
  function clear(){if(timer!==null){clearTimeout(timer);timer=null;}}
  img.addEventListener('pointerdown',function(e){
   if(e.pointerType==='mouse'&&e.button!==0)return;
   clear();timer=setTimeout(async function(){
    clear();try{preview(await createBlob(p),p);}catch(_){}
   },650);
  },{passive:true});
  ['pointerup','pointercancel','pointerleave','dragstart'].forEach(x=>img.addEventListener(x,clear,{passive:true}));
  img.addEventListener('contextmenu',function(e){e.preventDefault();});
  if(!btn)return;
  const badge=document.createElement('span');badge.className='lumen-sku-tag';badge.textContent=skuText(p);
  document.body.appendChild(badge);pairs.push({img,btn,badge});
  if(btn.dataset.lumenShareEnhanced==='v2')return;
  btn.dataset.lumenShareEnhanced='v2';
  let bypass=false;
  btn.addEventListener('click',async function(e){
   if(bypass)return;
   e.preventDefault();e.stopImmediatePropagation();
   try{
    const blob=await createBlob(p);
    if(!await share(blob,p))preview(blob,p);
   }catch(_){
    bypass=true;
    try{btn.click();}finally{bypass=false;}
   }
  },true);
 }
 function layout(){
  for(let k=pairs.length-1;k>=0;k--){
   const o=pairs[k];
   if(!document.contains(o.img)||!document.contains(o.btn)){
    o.badge.remove();pairs.splice(k,1);continue;
   }
   const b=o.btn.getBoundingClientRect();
   o.badge.style.display=b.height&&b.bottom>=0&&b.top<innerHeight?'block':'none';
   o.badge.style.left=Math.max(3,b.left-90)+'px';
   o.badge.style.top=Math.max(2,b.top+b.height/2-12)+'px';
  }
 }
 let pending=false;
 function scan(){
  pending=false;
  if(!media.size)return;
  const candidates=shareCandidates();
  for(const img of document.querySelectorAll('img')){
   if(attached.has(img))continue;
   const id=mediaKey(img.currentSrc||img.src||img.getAttribute('data-src')||'');
   const p=media.get(id);
   if(!p)continue;
   install(img,p,findShare(img,candidates));
  }
  layout();
 }
 function schedule(){if(pending)return;pending=true;setTimeout(scan,280);}
 fetch(manifestUrl,{mode:'cors',cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('CATALOGO');return r.json();})
  .then(j=>{
   if(j.version!==2||!Array.isArray(j.items))return;
   for(const p of j.items){if(Array.isArray(p)&&p.length>=4&&p[1]&&p[2])media.set(p[2],p);}
   schedule();
   new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
   addEventListener('scroll',layout,{passive:true});
   addEventListener('resize',layout,{passive:true});
  }).catch(function(){});
})();