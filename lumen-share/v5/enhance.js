(function(){
 'use strict';
 const ROOT=window;
 if(ROOT.__lumenShareV5&&ROOT.__lumenShareV5.ready)return;
 const old=ROOT.__lumenShareV2Teardown;
 if(typeof old==='function')try{old()}catch(_){}
 const catalogItems=[]; /*LUMEN_INLINE_CATALOG*/
 const media=new Map(), names=new Map(), linked=new WeakSet(), badges=new Map(), pendingSaves=new Set(), imageCache=new Map();
 const nameKey=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
 for(const item of catalogItems){
  if(!Array.isArray(item)||item.length<4||!item[1]||!item[2])continue;
  media.set(String(item[2]),item);
  const key=nameKey(item[0]);if(!names.has(key))names.set(key,item);
 }
 const state={ready:true,matched:0,controls:0,lastError:null};
 ROOT.__lumenShareV5=state;
 if(!media.size){state.lastError='catalogo_embutido_vazio';return;}
 const style=document.createElement('style');
 style.textContent=".lumen-v5-ref{display:inline-block!important;position:static!important;float:none!important;z-index:auto!important;vertical-align:middle;pointer-events:none;flex:0 0 auto!important;margin-right:8px!important;padding:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;color:#7d674f!important;font:500 10px/1.2 Arial,sans-serif!important;letter-spacing:.01em!important;white-space:nowrap!important}.lumen-v5-share-sku-row{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;width:100%!important;margin:5px auto 0!important;padding:0!important;background:transparent!important}.lumen-v5-error{position:fixed;left:12px;right:12px;bottom:32px;z-index:2147483644;padding:11px 14px;background:#403125;color:white;border-radius:8px;text-align:center;font:13px Arial,sans-serif;box-shadow:0 3px 12px #0003;pointer-events:none}";
 document.head.appendChild(style);
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
 function cachedPhoto(p){
  const key=String(p[2]);
  if(!imageCache.has(key)){
   const promise=renderedPhoto(p).catch(e=>{imageCache.delete(key);throw e;});
   imageCache.set(key,promise);
  }
  return imageCache.get(key);
 }
 function notifyFailure(msg){
  state.lastError=String(msg||'Não foi possível salvar a imagem').slice(0,170);
  const old=document.querySelector('.lumen-v5-error');if(old)old.remove();
  const toast=one('div','lumen-v5-error','Não foi possível baixar a foto. Tente novamente.');
  document.body.appendChild(toast);setTimeout(()=>toast.remove(),3500);
 }
 async function saveDirect(p){
  const key=String(p[2]);
  if(pendingSaves.has(key))return;
  pendingSaves.add(key);state.lastError=null;
  try{
   const blob=await cachedPhoto(p);
   dl(blob,p);
   state.lastDownload={sku:String(p[1]),size:blob.size,at:Date.now()};
  }catch(e){notifyFailure(e?.message||e);}
  finally{pendingSaves.delete(key);}
 }
 function dl(blob,p){
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=filename(p);a.style.display='none';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),45000);
 }
 async function nativeShare(blob,p){
  if(!navigator.share||typeof File==='undefined')return false;
  const file=new File([blob],filename(p),{type:'image/jpeg'});
  try{
   if(navigator.canShare&&!navigator.canShare({files:[file]}))return false;
   await navigator.share({files:[file],title:String(p[0]),text:String(p[0])+' • '+sku(p)});return true;
  }
  catch(e){return e?.name==='AbortError';}
 }
 // Gesto de toque longo = download imediato. Nenhuma segunda janela.
 function bind(img,p){
  if(linked.has(img))return;
  linked.add(img);state.matched++;
  img.style.webkitTouchCallout='none';img.style.webkitUserSelect='none';
  let timer=0;
  const clear=()=>{if(timer){clearTimeout(timer);timer=0;}};
  img.addEventListener('pointerdown',e=>{
   if(e.pointerType!=='mouse'||e.button!==0)return;
   clear();cachedPhoto(p).catch(()=>{});
   timer=setTimeout(()=>{timer=0;saveDirect(p);},640);
  },{passive:true});
  ['pointerup','pointercancel','pointerleave','dragstart'].forEach(n=>
   img.addEventListener(n,clear,{passive:true}));
  img.addEventListener('contextmenu',e=>{
   e.preventDefault();clear();saveDirect(p);
  });
 }
 function candidateCard(img,p){
  return getContainer(img,p)||img.parentElement?.parentElement||null;
 }
 function isShareIcon(el){
  if(!el)return false;
  const probe=[el.getAttribute?.('aria-label'),el.getAttribute?.('title'),
   el.getAttribute?.('data-testid'),el.getAttribute?.('data-hook')].join(' ').toLowerCase();
  if(/compartilh|share/.test(probe))return true;
  const svg=el.tagName?.toLowerCase()==='svg'?el:el.querySelector?.('svg');
  if(!svg)return false;
  const circles=svg.querySelectorAll?.('circle').length||0;
  return circles>=2&&(svg.querySelector('line,path,polyline')!==null);
 }
 function findShareNearCard(card,img){
  if(!card)return null;
  const photo=img.getBoundingClientRect();
  const mid=(photo.left+photo.right)/2;
  const selectors='svg,[aria-label],[title],[data-testid],[data-hook],button,[role="button"]';
  const nodes=Array.from(card.querySelectorAll(selectors)).filter(isShareIcon);
  // O Wix pode desenhar Compartilhar como SVG sem nome acessível ou círculos.
  // Nesse caso, localizá-lo geometricamente ABAIXO do botão WhatsApp.
  const whats=findWhatsapp(card);
  if(!nodes.length&&whats){
   const box=whats.getBoundingClientRect();
   for(const svg of card.querySelectorAll('svg')){
    const b=svg.getBoundingClientRect();
    const cx=(b.left+b.right)/2;
    if(b.width>=10&&b.width<=70&&b.height>=10&&b.height<=70&&
     b.top>=box.bottom+6&&b.top<=box.bottom+170&&
     Math.abs(cx-mid)<=photo.width*.43)nodes.push(svg);
   }
  }
  let selected=null,best=Infinity;
  for(const el of nodes){
   if(el.contains(img))continue;
   const rect=el.getBoundingClientRect();
   if(rect.width<9||rect.height<9||rect.width>110||rect.height>90)continue;
   if(rect.top<=photo.bottom+20||rect.top>=photo.bottom+800)continue;
   const dx=Math.abs((rect.left+rect.right)/2-mid);
   if(dx>photo.width*.55)continue;
   const score=dx*.4+Math.abs(rect.top-photo.bottom-300)*.12;
   if(score<best){best=score;selected=el;}
  }
  if(!selected)return null;
  const clickable=selected.closest('button,a,[role="button"]');
  if(clickable&&card.contains(clickable)&&clickable!==card)return clickable;
  return selected.tagName?.toLowerCase()==='svg'?selected.parentElement:selected;
 }
 function findWhatsapp(card){
  if(!card)return null;
  const nodes=Array.from(card.querySelectorAll('button,a,[role="button"],div,span'))
   .filter(el=>/comprar no whatsapp/i.test(String(el.textContent||'').trim())&&
      String(el.textContent||'').trim().length<100);
  nodes.sort((a,b)=>String(a.textContent).length-String(b.textContent).length);
  return nodes[0]?.closest?.('button,a,[role="button"]')||nodes[0]||null;
 }
 function addBadge(img,p){
  const previous=badges.get(img);
  if(previous?.ref?.isConnected)return;
  if(previous){previous.ref?.remove();badges.delete(img);}
  const card=candidateCard(img,p);
  if(!card)return;
  const ref=one('span','lumen-v5-ref',sku(p));
  ref.dataset.lumenSku=String(p[1]);
  const share=findShareNearCard(card,img);
  const whatsapp=findWhatsapp(card);
  if(share?.parentNode&&share!==card&&card.contains(share)){
   // Mesmo container do ícone Compartilhar, à sua esquerda.
   const parent=share.parentNode;
   if(parent!==card){
    const style=getComputedStyle(parent);
    if(style.display==='block'||style.display==='inline-block'){
     parent.style.display='flex';parent.style.alignItems='center';
     parent.style.justifyContent='center';parent.style.gap='7px';
    }
   }
   parent.insertBefore(ref,share);
  }else if(whatsapp?.parentNode&&card.contains(whatsapp)){
   // Se o Wix esconder o SVG, inserir uma pequena linha sob WhatsApp.
   // Nunca sobrepor a fotografia nem o valor.
   const row=one('div','lumen-v5-share-sku-row');
   row.appendChild(ref);whatsapp.insertAdjacentElement('afterend',row);
  }else{
   // Fallback de texto normal ao final do card (nunca na imagem).
   const row=one('div','lumen-v5-share-sku-row');
   row.appendChild(ref);card.appendChild(row);
  }
  badges.set(img,{ref,p});state.controls=badges.size;
 }
 function draw(){
  for(const [img,entry] of badges){
   if(!img.isConnected||!entry.ref.isConnected){
    entry.ref.remove();badges.delete(img);
   }
  }
  state.controls=badges.size;
 }
 // No iPhone a foto do Wix pode estar coberta por uma camada transparente.
 // Um único listener delegado cuida do toque longo e não duplica downloads.
 let longTimer=0,touchX=0,touchY=0;
 const clearLong=()=>{if(longTimer){clearTimeout(longTimer);longTimer=0;}};
 const eventPhoto=event=>{
  const target=event.target;
  if(!target||!target.closest)return null;
  const direct=target.closest('img');
  if(direct){const p=getProduct(direct);if(p)return {img:direct,p};}
  const wrapper=target.closest('wix-image,[data-testid*="image"],[class*="image"]');
  if(!wrapper)return null;
  const img=wrapper.querySelector('img');
  if(!img)return null;
  const p=getProduct(img);return p?{img,p}:null;
 };
 document.addEventListener('touchstart',e=>{
  if(e.touches.length!==1)return;
  const photo=eventPhoto(e);if(!photo)return;
  clearLong();
  touchX=e.touches[0].clientX;touchY=e.touches[0].clientY;
  cachedPhoto(photo.p).catch(()=>{});
  longTimer=setTimeout(()=>{longTimer=0;saveDirect(photo.p);},650);
 },{capture:true,passive:true});
 document.addEventListener('touchmove',e=>{
  const t=e.touches?.[0];
  if(!t||Math.abs(t.clientX-touchX)>13||Math.abs(t.clientY-touchY)>13)
   clearLong();
 },{capture:true,passive:true});
 for(const event of ['touchend','touchcancel','scroll']){
  document.addEventListener(event,clearLong,{capture:true,passive:true});
 }
 let scheduled=false;
 function scan(){
  scheduled=false;
  for(const img of document.querySelectorAll('img')){
   if(linked.has(img)){if(!badges.get(img)?.ref?.isConnected){const p=getProduct(img);if(p)addBadge(img,p);}continue;}
   const r=img.getBoundingClientRect();
   if(r.width<90||r.height<110)continue;
   const p=getProduct(img);if(!p)continue;
   bind(img,p);addBadge(img,p);
  }
  draw();
 }
 function schedule(){if(scheduled)return;scheduled=true;setTimeout(scan,220);}
 const observer=new MutationObserver(schedule);
 observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset','style']});
 let drawQueued=false;
 const scheduleDraw=()=>{
  if(drawQueued)return;drawQueued=true;
  requestAnimationFrame(()=>{drawQueued=false;draw();});
 };
 document.addEventListener('scroll',scheduleDraw,{passive:true,capture:true});
 window.addEventListener('resize',scheduleDraw,{passive:true});
 document.addEventListener('load',schedule,true);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 const tryInit=()=>schedule();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryInit,{once:true});
 else tryInit();
 // Public diagnostic only: no personal data.
 state.refresh=tryInit;
})();