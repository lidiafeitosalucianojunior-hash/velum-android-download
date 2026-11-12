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
 const style=document.createElement('style');style.textContent=".lumen-v6-ref{position:absolute!important;pointer-events:none!important;display:block!important;z-index:3!important;color:#7e6c5b!important;background:transparent!important;font:500 10px/1.1 Arial,sans-serif!important;white-space:nowrap!important;letter-spacing:.015em!important;padding:0!important;margin:0!important;border:0!important;box-shadow:none!important;transform:none!important}.lumen-v6-notice{position:fixed;bottom:112px;left:14px;right:14px;z-index:2147483200;border-radius:12px;background:#443423;color:#fff;padding:12px;text-align:center;font:12px/1.35 Arial,sans-serif;box-shadow:0 4px 14px #0004;pointer-events:none}.lumen-v6-bulk{position:absolute;top:0;left:0;right:auto;bottom:auto;transform:none;z-index:40;max-width:calc(100vw - 28px);width:max-content;min-height:0;border-radius:13px;background:#fffdf9;color:#79644d;border:1px solid #dfd3c5;box-shadow:none;padding:4px 10px;font:500 10px/1.3 Arial,sans-serif;white-space:nowrap;text-align:center;touch-action:manipulation}.lumen-v6-bulk:disabled{opacity:.76}.lumen-v6-bulk[hidden]{display:none!important}";document.head.appendChild(style);
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
  // Texto em área segura do Story, levemente mais baixo e sem molduras.
  // Contorno marrom fino preserva a leitura sobre fundo claro.
  ctx.fillStyle='#ffffff';ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.shadowColor='rgba(89,54,31,.42)';ctx.shadowBlur=6;
  ctx.shadowOffsetX=1;ctx.shadowOffsetY=2;
  ctx.strokeStyle='rgba(91,53,31,.80)';ctx.lineWidth=2;
  ctx.lineJoin='round';
  const refText=sku(p);
  ctx.font='600 35px Arial,sans-serif';
  ctx.strokeText(refText,48,2190);ctx.fillText(refText,48,2190);
  if(sizes.length){
   const sizeText='NUMERAÇÕES  '+sizes.join('  •  ');
   ctx.font='500 31px Arial,sans-serif';
   ctx.strokeText(sizeText,48,2247);ctx.fillText(sizeText,48,2247);
  }
  ctx.shadowColor='transparent';ctx.shadowBlur=0;
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.97));
  canvas.width=canvas.height=0;
  if(!blob||blob.size<8000)throw new Error('Não foi possível gerar a foto em alta qualidade');
  return blob;
 }

 const readyFiles=new Map(),filePromises=new Map(),badFiles=new Set();
 const fileQueue=[];let fileWorkers=0;
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
 function pumpPhotos(){
  while(fileWorkers<2&&fileQueue.length){
   const task=fileQueue.shift();fileWorkers++;
   cachedPhoto(task.p).then(blob=>{
    const file=new File([blob],filename(task.p),{type:'image/jpeg'});
    readyFiles.set(task.key,file);capCache(readyFiles,18);
    task.resolve(file);
   }).catch(e=>{badFiles.add(task.key);task.reject(e)})
    .finally(()=>{filePromises.delete(task.key);fileWorkers--;pumpPhotos();});
  }
 }
 function warmFile(p){
  const key=String(p[2]);
  if(readyFiles.has(key))return Promise.resolve(readyFiles.get(key));
  if(filePromises.has(key))return filePromises.get(key);
  if(badFiles.has(key))return Promise.reject(new Error('FOTO_INDISPONIVEL'));
  const task=new Promise((resolve,reject)=>{
   fileQueue.push({key,p,resolve,reject});
  });
  filePromises.set(key,task);
  pumpPhotos();
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
 const BULK_SIZE=10;
 let activeFilter=false,selectedSize='',selectedCategory='',bulkOffset=0,lastSet='',bulkBar=null,bulkButton=null,preparingKey='';
 let filteredCacheKey='',filteredCache=null;
 function categoryKey(value){
  const key=nameKey(value);
  if(key.startsWith('chinelo'))return 'chinelo';
  if(key.startsWith('tenis'))return 'tenis';
  if(key.startsWith('bota'))return 'bota';
  if(key.startsWith('bolsa'))return 'bolsas';
  if(key.startsWith('acessorio'))return 'acessorios';
  return key;
 }
 function getFilteredResults(){
  if(!activeFilter)return [];
  const category=categoryKey(selectedCategory);
  const key=category+'|'+selectedSize;
  // Uma busca tem sequência estável: o scroll não altera a lista, nem
  // devolve o compartilhamento ao primeiro lote.
  if(filteredCache&&filteredCacheKey===key)return filteredCache;
  // Catálogo completo do Wix Stores, incluindo itens ainda não renderizados.
  // A última coluna indica estoque; a penúltima, as coleções reais do Wix.
  const all=catalogItems.filter(p=>p[5]===true&&Boolean(p[1]&&p[2])&&
   (!category||(Array.isArray(p[4])&&p[4].includes(category)))&&
   (!selectedSize||(Array.isArray(p[3])&&p[3].map(String).includes(selectedSize))));
  const allowed=new Map(all.map(p=>[String(p[2]),p]));
  const seen=new Set(),result=[];
  // Preservar no início a ordem dos produtos que a vitrine já mostrou.
  for(const [img,entry] of badges){
   if(!img.isConnected||!entry.card?.isConnected||!entry.card.getClientRects().length)continue;
   const p=allowed.get(String(entry.p[2]));
   if(!p||seen.has(p[2]))continue;
   seen.add(p[2]);result.push(p);
  }
  // Acrescentar TODOS os produtos restantes, mesmo sem carregar os cards.
  for(const p of all){if(!seen.has(p[2])){seen.add(p[2]);result.push(p);}}
  filteredCacheKey=key;
  filteredCache=result;
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
   bulkBar.style.position='static';
  }
  refreshBulk();
 }
 // O botão fica no fluxo visual ENTRE os filtros e o título,
 // sem se sobrepor aos produtos e sem acompanhar o scroll como elemento fixo.
 function positionBulk(){
  if(!bulkButton||bulkButton.hidden)return;
  const rects=[];
  for(const [img,entry] of badges){
   if(!img.isConnected||!entry.card?.isConnected)continue;
   const r=img.getBoundingClientRect();
   if(r.width>=60&&r.height>=80)rects.push(r.top+scrollY);
  }
  if(!rects.length)return;
  const firstTop=Math.min(...rects);
  const heads=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"],[data-testid="richTextElement"]')];
  const valid=heads.filter(el=>{
   const r=el.getBoundingClientRect(),txt=String(el.innerText||el.textContent||'').trim();
   const bottom=r.bottom+scrollY;
   return r.width>60&&r.height>12&&r.height<100&&txt.length>2&&txt.length<70&&
    bottom<=firstTop-8&&firstTop-bottom<240;
  });
  valid.sort((a,b)=>(b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom));
  const heading=valid[0];
  if(!heading)return;
  const height=bulkButton.offsetHeight||24;
  // No Wix, o dropdown é a linha 3 e o título a linha 4 do mesmo grid.
  // Em alguns filtros há somente 9px entre eles. Ampliar APENAS essa margem,
  // deslocando título e produtos juntos, para não cobrir nenhum componente.
  const dropdown=document.querySelector('select.wixui-dropdown__input')?.closest('.wixui-dropdown');
  if(dropdown){
   const dr=dropdown.getBoundingClientRect();
   const before=heading.getBoundingClientRect();
   const gap=before.top-dr.bottom;
   const needed=Math.max(33,height+10);
   if(gap<needed&&dropdown.dataset.lumenBulkGap!=='expanded'){
    const current=parseFloat(getComputedStyle(dropdown).marginBottom)||0;
    dropdown.style.marginBottom=Math.ceil(current+needed-gap)+'px';
    dropdown.dataset.lumenBulkGap='expanded';
   }
  }
  const hr=heading.getBoundingClientRect();
  const centerX=hr.left+hr.width/2;
  const left=Math.round(Math.max(6,Math.min(innerWidth-bulkButton.offsetWidth-6,centerX-bulkButton.offsetWidth/2)));
  // A distância visual até o título é pequena: botão fino, margem 5px.
  const top=Math.round(hr.top+scrollY-height-6);
  const xpos=left+'px',ypos=Math.max(0,top)+'px';
  if(bulkButton.style.left!==xpos)bulkButton.style.left=xpos;
  if(bulkButton.style.top!==ypos)bulkButton.style.top=ypos;
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
  positionBulk();
  if(bulkOffset>=products.length)bulkOffset=0;
  const batch=products.slice(bulkOffset,bulkOffset+BULK_SIZE);
  const allReady=batch.every(p=>readyFiles.has(String(p[2])));
  const failures=batch.filter(p=>badFiles.has(String(p[2])));
  const start=bulkOffset+1,end=bulkOffset+batch.length;
  const label=failures.length?
   '↻ Preparar novamente '+failures.length+' foto(s)':
   allReady?'↗ Compartilhar '+batch.length+' fotos · '+start+'–'+end+'/'+products.length:
   'Preparando '+batch.length+' fotos...';
  if(bulkButton.textContent!==label)bulkButton.textContent=label;
  positionBulk();
  bulkButton.disabled=!allReady&&!failures.length;
  const key=batch.map(p=>p[2]).join('|');
  if(!allReady&&!failures.length&&preparingKey!==key){
   preparingKey=key;
   Promise.allSettled(batch.map(warmFile)).then(()=>{
    preparingKey='';
    refreshBulk();
   });
  }
 }
 function shareBatch(){
  const products=getFilteredResults();
  const batch=products.slice(bulkOffset,bulkOffset+BULK_SIZE);
  if(!batch.length)return;
  const failed=batch.filter(p=>badFiles.has(String(p[2])));
  if(failed.length){
   for(const p of failed)badFiles.delete(String(p[2]));
   preparingKey='';refreshBulk();return;
  }
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
  const value=String(event.type==='change'?(target.value||el.textContent):(el.textContent||'')).trim();
  const heading=[...document.querySelectorAll('h1,h2,h3,h4')].find(x=>
    /confira as novidades/i.test(x.textContent||''));
  const top=heading?.getBoundingClientRect().top??innerHeight;
  const r=el.getBoundingClientRect();
  if(r.top>top+30||value.length>75)return;
  if(/^(?:3[4-9]|4[0-5])$/.test(value)){
   selectedSize=selectedSize===value?'':value;
  }else if(/^(?:rasteira|tênis|tenis|papete|salto|chinelo(?: f\.)?|bota|botas|nuvem|crocs|bolsas|acessórios)$/i.test(value)){
   selectedCategory=value;
  }else if(/^(?:escolha uma categoria|todas as categorias)$/i.test(value)){
   selectedCategory='';
  }else return;
  activeFilter=Boolean(selectedSize||selectedCategory);
  filteredCache=null;filteredCacheKey='';
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
  requestAnimationFrame(()=>{drawQueued=false;draw();warmVisible();positionBulk();});
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