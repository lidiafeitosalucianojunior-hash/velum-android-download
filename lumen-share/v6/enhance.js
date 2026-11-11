(function(){
 'use strict';
 const ROOT=window;
 if(ROOT.__lumenShareV6&&ROOT.__lumenShareV6.ready)return;
 const old=ROOT.__lumenShareV2Teardown;
 if(typeof old==='function')try{old()}catch(_){}
 const catalogItems=[]; /*LUMEN_INLINE_CATALOG*/
 const media=new Map(), names=new Map(), linked=new WeakSet(), badges=new Map(), imageCache=new Map();
 const nameKey=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
 for(const item of catalogItems){
  if(!Array.isArray(item)||item.length<4||!item[1]||!item[2])continue;
  media.set(String(item[2]),item);
  const key=nameKey(item[0]);if(!names.has(key))names.set(key,item);
 }
 const state={ready:true,matched:0,controls:0,lastError:null};
 ROOT.__lumenShareV6=state;
 if(!media.size){state.lastError='catalogo_embutido_vazio';return;}
 const style=document.createElement('style');style.textContent=".lumen-v6-ref{position:absolute!important;pointer-events:none!important;display:block!important;z-index:3!important;color:#7e6c5b!important;background:transparent!important;font:500 10px/1.1 Arial,sans-serif!important;white-space:nowrap!important;letter-spacing:.015em!important;padding:0!important;margin:0!important;border:0!important;box-shadow:none!important;transform:none!important}.lumen-v6-notice{position:fixed;bottom:112px;left:14px;right:14px;z-index:2147483200;border-radius:12px;background:#443423;color:#fff;padding:12px;text-align:center;font:12px/1.35 Arial,sans-serif;box-shadow:0 4px 14px #0004;pointer-events:none}.lumen-v6-bulk{position:fixed;bottom:91px;left:50%;transform:translateX(-50%);z-index:2147482000;max-width:calc(100vw - 28px);width:max-content;min-height:43px;border-radius:24px;background:#fffaf4;color:#57432e;border:1px solid #b5a28b;box-shadow:0 3px 12px #0003;padding:9px 17px;font:600 12px/1.3 Arial,sans-serif;white-space:normal;text-align:center;touch-action:manipulation}.lumen-v6-bulk:disabled{opacity:.76}.lumen-v6-bulk[hidden]{display:none!important}";document.head.appendChild(style);
 const one=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
 const photoUrl=(p,edge=2400)=>'https://static.wixstatic.com/media/'+encodeURIComponent(p[2])+'/v1/fit/w_'+edge+',h_'+edge+',q_100/file.jpg';
 const sku=p=>'REF '+String(p[1]||'').slice(0,32);
 const filename=p=>'REF-'+String(p[1]).replace(/[^a-z0-9_-]/gi,'')+'-9x16.jpg';
 const keysOf=s=>{
  const v=String(s||'');
  const out=[];
  const re=/\/media\/([^/?#"' ]+)/g;
  let m;while((m=re.exec(v)))out.push(decodeURIComponent(m[1]));
  return out;
 };
 function getProduct(img){
  for(const s of [img.currentSrc,img.src,img.getAttribute('data-src'),img.getAttribute('srcset'),
   img.getAttribute('data-image-src'),img.alt]){
   for(const k of keysOf(s))if(media.has(k))return media.get(k);
  }
  const alt=nameKey(img.alt);
  if(alt&&names.has(alt))return names.get(alt);
  const rect=img.getBoundingClientRect();
  if(rect.width<90||rect.height<100)return null;
  let parent=img.parentElement;
  for(let n=0;n<7&&parent;n++,parent=parent.parentElement){
   const t=nameKey(String(parent.innerText||'').slice(0,600));
   if(t.length>15&&t.length<500&&/(varejo|atacado|adicionar ao carrinho)/.test(t)){
    const match=[...names.entries()].find(([name])=>t.includes(name)&&name.length>8);
    if(match)return match[1];
   }
  }
  return null;
 }
 function getContainer(img,p){
  let root=img.parentElement,chosen=null;
  const key=nameKey(p[0]);
  for(let i=0;root&&i<8;i++,root=root.parentElement){
   const txt=nameKey(String(root.innerText||'').slice(0,900));
   if(txt.includes(key)&&(txt.includes('varejo')||txt.includes('adicionar ao carrinho'))){
    chosen=root;
    if(txt.length<380)break;
   }
  }
  return chosen;
 }
 function findShare(root,img){
  const ir=img.getBoundingClientRect();
  const middle=(ir.left+ir.right)/2;
  const elements=Array.from((root||img.parentElement||document).querySelectorAll('button,a,svg,[role="button"],[aria-label],[title]')).slice(0,240);
  const tagged=elements.filter(el=>/compartilh|share/i.test([el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('data-testid'),el.textContent?.slice(0,35)].join(' ')));
  const btns=tagged.length?tagged:elements.filter(el=>{
   if(el.tagName.toLowerCase()!=='svg')return false;
   const r=el.getBoundingClientRect();
   return r.width>10&&r.width<40&&r.height>10&&r.height<40&&
    Math.abs((r.left+r.right)/2-middle)<ir.width*.35&&
    r.top>ir.bottom+45&&r.top<ir.bottom+650;
  });
  const filtered=btns.map(el=>el.closest('button,a,[role="button"]')||el)
   .filter(el=>{const r=el.getBoundingClientRect();return r.width>10&&r.height>8&&r.height<80;});
  filtered.sort((a,b)=>Math.abs(a.getBoundingClientRect().left-middle)-Math.abs(b.getBoundingClientRect().left-middle));
  return filtered[0]||null;
 }
 async function loadPhoto(url){
  return new Promise((resolve,reject)=>{
   const img=new Image();img.crossOrigin='anonymous';
   img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Nao foi possivel baixar a imagem de origem'));
   img.src=url;
  });
 }
 async function renderedPhoto(p){
  let original=null,lastError=null;
  for(const size of [3000,2400,1800,1200]){
   try{original=await loadPhoto(photoUrl(p,size));break;}catch(e){lastError=e;}
  }
  if(!original){
   try{original=await loadPhoto('https://static.wixstatic.com/media/'+encodeURIComponent(p[2]));}
   catch(e){lastError=e;}
  }
  if(!original)throw lastError||new Error('Não foi possível carregar a fotografia');
  const width=1440,height=2560;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('O navegador não conseguiu gerar a imagem');
  // Enquadramento COVER: fotografia preenchendo 100% do formato 9:16.
  // Não adicionar fundo branco, moldura, margens nem logotipo.
  const scale=Math.max(width/original.naturalWidth,height/original.naturalHeight);
  const dw=original.naturalWidth*scale,dh=original.naturalHeight*scale;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(original,(width-dw)/2,(height-dh)/2,dw,dh);
  const sizes=Array.isArray(p[3])?[...new Set(p[3].map(String)
   .filter(x=>/^(3[3-9]|4[0-5])$/.test(x)))].sort((a,b)=>Number(a)-Number(b)).slice(0,13):[];
  // Tipografia pequena diretamente sobre a foto, protegida por sombra.
  ctx.fillStyle='#ffffff';ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=10;
  ctx.shadowOffsetX=1;ctx.shadowOffsetY=2;
  ctx.font='600 34px Arial,sans-serif';ctx.fillText(sku(p),48,2452);
  if(sizes.length){
   ctx.font='26px Arial,sans-serif';
   ctx.fillText('NUMERAÇÕES  '+sizes.join('  •  '),48,2503);
  }
  ctx.shadowColor='transparent';ctx.shadowBlur=0;
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.97));
  canvas.width=canvas.height=0;
  if(!blob||blob.size<8000)throw new Error('Não foi possível gerar a foto em alta qualidade');
  return blob;
 }

 const readyFiles=new Map(),filePromises=new Map(),badFiles=new Set();
 let shareInProgress=false,lastShareAt=0,visibleTimer=0;
 function capCache(map,limit){
  while(map.size>limit)map.delete(map.keys().next().value);
 }
 function cachedPhoto(p){
  const key=String(p[2]);
  if(!imageCache.has(key)){
   const task=renderedPhoto(p).catch(e=>{imageCache.delete(key);throw e});
   imageCache.set(key,task);capCache(imageCache,20);
  }
  return imageCache.get(key);
 }
 function warmFile(p){
  const key=String(p[2]);
  if(readyFiles.has(key))return Promise.resolve(readyFiles.get(key));
  if(filePromises.has(key))return filePromises.get(key);
  if(badFiles.has(key))return Promise.reject(new Error('FOTO_INDISPONIVEL'));
  const task=cachedPhoto(p).then(blob=>{
   const file=new File([blob],filename(p),{type:'image/jpeg'});
   readyFiles.set(key,file);capCache(readyFiles,18);
   filePromises.delete(key);
   return file;
  }).catch(e=>{filePromises.delete(key);badFiles.add(key);throw e});
  filePromises.set(key,task);
  return task;
 }
 function notice(msg){
  state.lastError=String(msg||'');
  const old=document.querySelector('.lumen-v6-notice');if(old)old.remove();
  const el=one('div','lumen-v6-notice',String(msg||'').slice(0,220));
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),3300);
 }
 function shareFiles(files,after){
  if(shareInProgress||!files?.length||Date.now()-lastShareAt<800)return false;
  if(typeof navigator.share!=='function'||typeof File==='undefined'){
   notice('Este navegador não oferece compartilhamento nativo de fotos.');
   return false;
  }
  if(navigator.canShare&&!navigator.canShare({files})){
   notice('O aparelho não permite compartilhar essas fotos juntas.');
   return false;
  }
  shareInProgress=true;lastShareAt=Date.now();
  // Invocado diretamente do evento de toque ou clique: preserva ativação
  // de usuário exigida pelo Web Share API no Safari do iPhone.
  try{
   Promise.resolve(navigator.share({files})).then(()=>{
    state.lastShared={count:files.length,names:files.map(x=>x.name),at:Date.now()};
    if(typeof after==='function')after();
   }).catch(error=>{
    if(error?.name!=='AbortError')notice('Não foi possível abrir o compartilhamento. Tente novamente.');
   }).finally(()=>{shareInProgress=false;});
  }catch(e){
   shareInProgress=false;
   if(e?.name!=='AbortError')notice('Não foi possível abrir o compartilhamento. Tente novamente.');
   return false;
  }
  return true;
 }
 function shareSingle(p){
  const file=readyFiles.get(String(p[2]));
  if(file)return shareFiles([file]);
  warmFile(p).then(()=>notice('Foto preparada! Segure novamente para compartilhar.'))
   .catch(()=>notice('Não consegui preparar esta imagem. Tente novamente.'));
  return false;
 }
 function repeaterItem(img){
  return img.closest('[class*="wixui-repeater__i"]')||
   getContainer(img,getProduct(img))?.parentElement||img.parentElement;
 }
 function addBadge(img,p){
  const existing=badges.get(img);
  if(existing?.ref?.isConnected)return;
  if(existing){existing.ref?.remove();badges.delete(img);}
  const card=repeaterItem(img);
  if(!card)return;
  const ref=one('span','lumen-v6-ref',sku(p));
  ref.dataset.lumenSku=String(p[1]);
  // Inserção no elemento do repeater que é position:relative.
  // A referência nunca altera o fluxo vertical nem invade o SVG.
  if(getComputedStyle(card).position==='static')card.style.position='relative';
  card.appendChild(ref);
  badges.set(img,{ref,p,card});
  state.controls=badges.size;
  placeBadge(img,badges.get(img));
 }
 function placeBadge(img,entry){
  if(!entry?.card?.isConnected||!entry.ref.isConnected)return;
  const card=entry.card,ref=entry.ref;
  const share=card.querySelector('compartilhar-produto');
  const cr=card.getBoundingClientRect();
  const sr=share?.getBoundingClientRect();
  const wa=card.querySelector('[aria-label*="WhatsApp" i]');
  const wr=wa?.getBoundingClientRect();
  const refW=ref.offsetWidth||47,refH=ref.offsetHeight||12;
  let left,top;
  if(sr&&sr.width>5&&sr.height>8){
   left=sr.left-cr.left-refW-10;
   top=sr.top-cr.top+(sr.height-refH)/2;
  }else if(wr){
   left=10;
   top=wr.bottom-cr.top+12;
  }else{
   left=12;
   top=cr.height-refH-11;
  }
  left=Math.max(2,Math.min(cr.width-refW-2,left));
  top=Math.max(0,Math.min(cr.height-refH,top));
  const x=Math.round(left)+'px',y=Math.round(top)+'px';
  if(ref.style.left!==x)ref.style.left=x;
  if(ref.style.top!==y)ref.style.top=y;
 }
 function draw(){
  for(const [img,entry] of badges){
   if(!img.isConnected||!entry.ref.isConnected){entry.ref.remove();badges.delete(img);continue}
   placeBadge(img,entry);
  }
  state.controls=badges.size;
 }
 function eventPhoto(event){
  const target=event.target;
  if(!target||!target.closest)return null;
  const direct=target.closest('img');
  if(direct){const p=getProduct(direct);if(p)return p;}
  const wrapper=target.closest('wix-image,wow-image,[data-testid*="image"],[class*="wixui-image"]');
  const img=wrapper?.querySelector?.('img');
  return img?getProduct(img):null;
 }
 // Safari exige que navigator.share seja chamado com um gesto do usuário.
 // Um toque longo arma a ação; o toqueend abre a folha nativa.
 let holding=null;
 const clearHold=()=>{if(holding?.timer)clearTimeout(holding.timer);holding=null};
 document.addEventListener('touchstart',e=>{
  if(e.touches.length!==1||e.target?.closest?.('button,a,[role="button"]'))return;
  const p=eventPhoto(e);if(!p)return;
  clearHold();
  const t=e.touches[0];
  holding={p,x:t.clientX,y:t.clientY,start:Date.now(),armed:false,timer:0};
  holding.timer=setTimeout(()=>{if(holding)holding.armed=true;},620);
  warmFile(p).catch(()=>{});
 },{capture:true,passive:true});
 document.addEventListener('touchmove',e=>{
  const t=e.touches[0],h=holding;
  if(!t||!h||Math.abs(t.clientX-h.x)>13||Math.abs(t.clientY-h.y)>13)clearHold();
 },{capture:true,passive:true});
 document.addEventListener('touchend',e=>{
  const h=holding;
  if(!h)return;
  const holdTime=Date.now()-h.start;
  const valid=h.armed||holdTime>=620;
  clearHold();
  if(!valid)return;
  // Evita abrir página do produto ou o menu de download do Safari.
  e.preventDefault();
  shareSingle(h.p);
 },{capture:true,passive:false});
 for(const evt of ['touchcancel','scroll'])document.addEventListener(evt,clearHold,{capture:true,passive:true});
 document.addEventListener('contextmenu',e=>{
  const p=eventPhoto(e);
  if(!p)return;
  e.preventDefault();
  clearHold();
  shareSingle(p);
 },{capture:true});
 function bind(img,p){
  if(linked.has(img))return;
  linked.add(img);state.matched++;
  img.style.webkitTouchCallout='none';
  img.style.webkitUserSelect='none';
  img.style.userSelect='none';
  img.addEventListener('dragstart',e=>e.preventDefault());
  img.addEventListener('pointerenter',()=>{if(!('ontouchstart' in window))warmFile(p).catch(()=>{});},{passive:true});
 }
 function warmVisible(){
  let added=0;
  for(const [img,{p}] of badges){
   if(added>=6)break;
   const r=img.getBoundingClientRect();
   if(r.height>80&&r.width>80&&r.top<innerHeight+380&&r.bottom>-100){
    warmFile(p).catch(()=>{});
    added++;
   }
  }
 }
 const BULK_SIZE=6;
 let activeFilter=false,selectedSize='',selectedCategory='',bulkOffset=0,lastSet='',bulkBar=null,bulkButton=null,preparingKey='';
 function getFilteredResults(){
  const result=[],seen=new Set();
  for(const [img,x] of badges){
   if(!img.isConnected||!x.card?.isConnected||!x.card.getClientRects().length)continue;
   const r=img.getBoundingClientRect();
   if(r.width<60||r.height<80)continue;
   if(selectedSize&&!(Array.isArray(x.p[3])&&x.p[3].map(String).includes(selectedSize)))continue;
   const key=String(x.p[1]);
   if(seen.has(key))continue;
   seen.add(key);
   result.push(x.p);
  }
  return result;
 }
 function showBulk(){
  if(!bulkButton){
   bulkBar=one('div','');
   bulkButton=one('button','lumen-v6-bulk','Compartilhar fotos');
   bulkButton.type='button';
   bulkButton.setAttribute('aria-label','Compartilhar fotos dos produtos filtrados');
   bulkBar.appendChild(bulkButton);
   document.body.appendChild(bulkBar);
   bulkButton.addEventListener('click',shareBatch);
  }
  refreshBulk();
 }
 function refreshBulk(){
  if(!bulkButton)return;
  const products=activeFilter?getFilteredResults():[];
  const signature=products.map(p=>String(p[1])).join('|');
  if(signature!==lastSet){
   lastSet=signature;bulkOffset=0;preparingKey='';
  }
  bulkButton.hidden=products.length<2;
  if(products.length<2)return;
  if(bulkOffset>=products.length)bulkOffset=0;
  const batch=products.slice(bulkOffset,bulkOffset+BULK_SIZE);
  const allReady=batch.every(p=>readyFiles.has(String(p[2])));
  const start=bulkOffset+1,end=bulkOffset+batch.length;
  const label=allReady?
   '↗ Compartilhar '+batch.length+' fotos ('+start+'–'+end+' de '+products.length+')':
   'Preparando '+batch.length+' fotos do filtro...';
  if(bulkButton.textContent!==label)bulkButton.textContent=label;
  bulkButton.disabled=!allReady;
  const key=batch.map(p=>p[2]).join('|');
  if(!allReady&&preparingKey!==key){
   preparingKey=key;
   Promise.allSettled(batch.map(warmFile)).then(()=>{
    preparingKey='';
    // Se alguma foto falhar, habilita a tentativa, sem enviar item errado.
    const unavailable=batch.filter(p=>badFiles.has(String(p[2])));
    if(unavailable.length){
      for(const p of unavailable)badFiles.delete(String(p[2]));
      notice('Algumas fotos não puderam ser preparadas. Tente aplicar o filtro novamente.');
    }
    refreshBulk();
   });
  }
 }
 function shareBatch(){
  const products=getFilteredResults();
  const batch=products.slice(bulkOffset,bulkOffset+BULK_SIZE);
  if(!batch.length)return;
  const files=batch.map(p=>readyFiles.get(String(p[2])));
  if(files.some(x=>!x)){refreshBulk();return;}
  // Alguns aparelhos limitam quantos arquivos podem ser compartilhados.
  // Reduzir o lote sem modificar a foto ou o SKU.
  let selected=files;
  if(navigator.canShare){
   while(selected.length>1&&!navigator.canShare({files:selected})){
    selected=selected.slice(0,Math.ceil(selected.length/2));
   }
  }
  const sent=selected.length;
  shareFiles(selected,()=>{
   bulkOffset+=sent;
   if(bulkOffset>=products.length){
    bulkOffset=0;
    notice('Fotos compartilhadas. Você pode iniciar outro envio.');
   }
   preparingKey='';
   refreshBulk();
  });
 }
 function scheduleBulk(){
  if(!activeFilter)return;
  if(!bulkBar)showBulk();
  else refreshBulk();
 }
 function markFilter(event){
  const target=event.target;
  if(!target||!target.closest)return;
  const el=target.closest('button,[role="button"],a,option,div,span,label')||target;
  const value=String(el.textContent||'').trim();
  const heading=[...document.querySelectorAll('h1,h2,h3,h4')].find(x=>
    /confira as novidades/i.test(x.textContent||''));
  const top=heading?.getBoundingClientRect().top??innerHeight;
  const r=el.getBoundingClientRect();
  if(r.top>top+30||value.length>75)return;
  if(/^(?:3[4-9]|4[0-5])$/.test(value)){selectedSize=value;activeFilter=true;}
  else if(/^(?:rasteira|tênis|tenis|sandália|sandalia|papete|salto|chinelo|bota|sapatilha|bolsas|acessórios)$/i.test(value)){
   selectedCategory=value;activeFilter=true;
  }else return;
  bulkOffset=0;lastSet='';preparingKey='';
  setTimeout(()=>{scan();scheduleBulk();},700);
 }
 document.addEventListener('click',markFilter,{capture:true,passive:true});
 document.addEventListener('change',markFilter,{capture:true,passive:true});
 let scheduled=false;
 function scan(){
  scheduled=false;
  for(const img of document.querySelectorAll('img')){
   const r=img.getBoundingClientRect();
   if(r.width<90||r.height<110)continue;
   const p=getProduct(img);if(!p)continue;
   bind(img,p);
   if(!badges.get(img)?.ref?.isConnected)addBadge(img,p);
  }
  draw();
  if(!visibleTimer){
   visibleTimer=setTimeout(()=>{visibleTimer=0;warmVisible();},250);
  }
  scheduleBulk();
 }
 function schedule(){if(scheduled)return;scheduled=true;setTimeout(scan,240);}
 const observer=new MutationObserver(schedule);
 observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset','style']});
 let drawQueued=false;
 function scheduleDraw(){
  if(drawQueued)return;drawQueued=true;
  requestAnimationFrame(()=>{drawQueued=false;draw();warmVisible();});
 }
 document.addEventListener('scroll',scheduleDraw,{capture:true,passive:true});
 window.addEventListener('resize',scheduleDraw,{passive:true});
 document.addEventListener('load',schedule,true);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
 else schedule();
 state.refresh=schedule;
 state.bulkResults=()=>getFilteredResults().length;
})();