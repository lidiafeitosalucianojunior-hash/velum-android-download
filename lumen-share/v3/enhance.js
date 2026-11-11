(function(){
 'use strict';
 const ROOT=window;
 if(ROOT.__lumenShareV3&&ROOT.__lumenShareV3.ready)return;
 const old=ROOT.__lumenShareV2Teardown;
 if(typeof old==='function')try{old()}catch(_){}
 const catalogItems=[]; /*LUMEN_INLINE_CATALOG*/
 const media=new Map(), names=new Map(), linked=new WeakSet(), controls=new Map();
 const nameKey=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
 for(const item of catalogItems){
  if(!Array.isArray(item)||item.length<4||!item[1]||!item[2])continue;
  media.set(String(item[2]),item);
  const key=nameKey(item[0]);if(!names.has(key))names.set(key,item);
 }
 const state={ready:true,matched:0,controls:0,lastError:null};
 ROOT.__lumenShareV3=state;
 if(!media.size){state.lastError='catalogo_embutido_vazio';return;}
 const style=document.createElement('style');
 style.textContent='.lumen-v3-btn{position:fixed;z-index:2147482000;pointer-events:auto;white-space:nowrap;border:1px solid rgba(110,85,55,.4);background:rgba(255,251,245,.95);color:#654c37;border-radius:8px;padding:6px 8px;font:600 11px Arial,sans-serif;box-shadow:0 1px 5px #0002;touch-action:manipulation}.lumen-v3-ref{position:fixed;z-index:2147481500;pointer-events:none;border-radius:4px;padding:3px 6px;background:#fffaf2e8;color:#66533d;font:600 11px Arial,sans-serif;letter-spacing:.025em;white-space:nowrap}.lumen-v3-mask{position:fixed;inset:0;z-index:2147483640;background:#000b;display:flex;align-items:center;justify-content:center;padding:12px}.lumen-v3-dialog{position:relative;width:min(430px,96vw);max-height:95dvh;overflow:auto;padding:15px;background:#fffaf5;border-radius:14px;box-shadow:0 16px 45px #0005;color:#5e4936;font:14px Arial,sans-serif}.lumen-v3-dialog img{display:block;max-width:100%;max-height:63dvh;object-fit:contain;margin:10px auto}.lumen-v3-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:12px 0 4px}.lumen-v3-actions button{padding:12px 14px;border:1px solid #a98a69;border-radius:8px;background:#59412a;color:white;font:600 13px Arial,sans-serif}.lumen-v3-actions button:last-child{background:white;color:#59412a}.lumen-v3-loading{min-height:180px;display:grid;place-items:center;text-align:center}';
 document.head.appendChild(style);
 const one=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
 const photoUrl=(p,edge=2400)=>'https://static.wixstatic.com/media/'+encodeURIComponent(p[2])+'/v1/fit/w_'+edge+',h_'+edge+',q_100/file.jpg';
 const sku=p=>'REF '+String(p[1]||'').slice(0,32);
 const filename=p=>'LUMEN-REF-'+String(p[1]).replace(/[^a-z0-9_-]/gi,'')+'-9x16.jpg';
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
  for(const size of [2400,1800,1200]){
   try{original=await loadPhoto(photoUrl(p,size));break;}catch(e){lastError=e;}
  }
  if(!original){
   try{original=await loadPhoto('https://static.wixstatic.com/media/'+encodeURIComponent(p[2]));}
   catch(e){lastError=e;}
  }
  if(!original)throw lastError||new Error('Foto indisponivel');
  const width=1440,height=2560,scale=width/1440;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Aparelho nao suportou gerar a imagem');
  ctx.fillStyle='#faf7f2';ctx.fillRect(0,0,width,height);
  const regionW=1300*scale,regionH=2180*scale;
  const ratio=Math.min(regionW/original.naturalWidth,regionH/original.naturalHeight);
  const w=original.naturalWidth*ratio,h=original.naturalHeight*ratio;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(original,(width-w)/2,55*scale+(regionH-h)/2,w,h);
  ctx.strokeStyle='#dbd1c5';ctx.lineWidth=2*scale;
  ctx.beginPath();ctx.moveTo(70*scale,2300*scale);ctx.lineTo(1370*scale,2300*scale);ctx.stroke();
  ctx.fillStyle='#69543d';ctx.textAlign='left';ctx.font=(39*scale)+'px Georgia,serif';
  ctx.fillText('LÚMEN LUXOS',70*scale,2381*scale);
  ctx.textAlign='right';ctx.font='bold '+(39*scale)+'px Arial,sans-serif';
  ctx.fillText(sku(p),1370*scale,2381*scale);
  const sizes=Array.isArray(p[3])?p[3].filter(x=>/^(3[3-9]|4[0-5])$/.test(String(x))).slice(0,13):[];
  if(sizes.length){
   ctx.textAlign='left';ctx.fillStyle='#877762';ctx.font=(25*scale)+'px Arial,sans-serif';
   ctx.fillText('NUMERAÇÕES  '+sizes.join('  •  '),70*scale,2452*scale);
  }
  const blob=await new Promise(ok=>canvas.toBlob(ok,'image/jpeg',0.96));
  canvas.width=canvas.height=0;
  if(!blob||blob.size<8000)throw new Error('O Safari bloqueou a geracao da foto. Tente novamente.');
  return blob;
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
 function openDialog(p){
  if(document.querySelector('.lumen-v3-mask'))return;
  const mask=one('div','lumen-v3-mask');mask.setAttribute('role','dialog');
  mask.setAttribute('aria-label','Salvar foto 9:16 com SKU');
  const dialog=one('div','lumen-v3-dialog');const title=one('strong','',String(p[0])+' • '+sku(p));
  const holder=one('div','lumen-v3-loading','Preparando foto 9:16 em alta qualidade...');
  const footer=one('div','lumen-v3-actions');
  const hint=one('div','');
  let previewUrl='',closed=false;
  const close=()=>{closed=true;mask.remove();if(previewUrl)URL.revokeObjectURL(previewUrl);};
  const button=(label,fn)=>{const b=one('button','',label);b.type='button';b.onclick=fn;footer.appendChild(b);return b;};
  button('Fechar',close);
  dialog.append(title,holder,hint,footer);mask.appendChild(dialog);document.body.appendChild(mask);
  mask.addEventListener('click',e=>{if(e.target===mask)close();});
  renderedPhoto(p).then(blob=>{
   if(closed)return;
   previewUrl=URL.createObjectURL(blob);
   const image=one('img','');image.src=previewUrl;image.alt=String(p[0])+' com '+sku(p);
   holder.replaceWith(image);footer.replaceChildren();
   button('Salvar foto',()=>dl(blob,p));
   button('Compartilhar / Salvar no iPhone',async()=>{if(!await nativeShare(blob,p))dl(blob,p);});
   button('Fechar',close);
   hint.textContent='Formato 9:16 • 1440 × 2560 px • SKU gravado na própria foto.';
  }).catch(err=>{
   if(closed)return;
   state.lastError=String(err?.message||err);
   holder.textContent='Não foi possível preparar a imagem neste momento.';
   hint.textContent='Verifique sua conexão e tente novamente.';
   footer.replaceChildren();button('Tentar novamente',()=>{close();openDialog(p);});button('Fechar',close);
  });
 }
 function bind(img,p){
  if(linked.has(img))return;
  linked.add(img);state.matched++;
  img.style.webkitTouchCallout='none';img.style.webkitUserSelect='none';
  let timer=0,x=0,y=0,start=0;
  const clear=()=>{if(timer){clearTimeout(timer);timer=0;}};
  const begin=(cx,cy)=>{
   if(!img.isConnected)return;
   clear();x=cx;y=cy;start=Date.now();
   timer=setTimeout(()=>{timer=0;openDialog(p);},620);
  };
  img.addEventListener('touchstart',e=>{if(e.touches.length===1)begin(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
  img.addEventListener('touchmove',e=>{
   const t=e.touches?.[0];if(!t||Math.abs(t.clientX-x)>14||Math.abs(t.clientY-y)>14)clear();
  },{passive:true});
  ['touchend','touchcancel','dragstart','pointerup','pointerleave','pointercancel'].forEach(n=>img.addEventListener(n,clear,{passive:true}));
  img.addEventListener('pointerdown',e=>{
   if(e.pointerType!=='mouse')return;
   if(e.button!==0)return;
   begin(e.clientX,e.clientY);
  },{passive:true});
  img.addEventListener('contextmenu',e=>{e.preventDefault();clear();openDialog(p);});
 }
 function addControls(img,p){
  if(controls.has(img))return;
  const save=one('button','lumen-v3-btn','↓ Salvar 9:16');
  save.type='button';save.setAttribute('aria-label','Salvar foto 9:16 com '+sku(p));
  save.onclick=e=>{e.preventDefault();e.stopPropagation();openDialog(p);};
  const ref=one('span','lumen-v3-ref',sku(p));
  document.body.append(save,ref);
  controls.set(img,{p,save,ref});
  state.controls++;
 }
 function draw(){
  for(const [img,c] of controls){
   if(!img.isConnected){c.save.remove();c.ref.remove();controls.delete(img);continue;}
   const r=img.getBoundingClientRect();
   const visible=r.width>80&&r.height>110&&r.bottom>0&&r.top<innerHeight;
   c.save.style.display=visible?'block':'none';
   c.ref.style.display=visible?'block':'none';
   if(!visible)continue;
   c.save.style.left=Math.max(4,Math.min(innerWidth-105,r.right-106))+'px';
   c.save.style.top=Math.max(5,Math.min(innerHeight-28,r.bottom-37))+'px';
   const now=Date.now();
   if(!c.share||!c.share.isConnected){
    if(!c.lastShareTry||now-c.lastShareTry>3500){
     c.lastShareTry=now;
     c.share=findShare(getContainer(img,c.p),img);
    }
   }
   const s=c.share?.getBoundingClientRect();
   const at=s&&s.top>r.bottom-8&&s.top<r.bottom+650&&s.height<80?
    {x:s.left-79,y:s.top+s.height/2-10}:{x:r.left+2,y:r.bottom+5};
   c.ref.style.left=Math.max(3,Math.min(innerWidth-84,at.x))+'px';
   c.ref.style.top=Math.max(0,Math.min(innerHeight-23,at.y))+'px';
  }
 }
 // Delegado para Safari: Wix pode envolver a imagem em uma camada
 // transparente que intercepta o toque antes do elemento <img>.
 let delegatedTimer=0,delegatedX=0,delegatedY=0;
 const clearDelegated=()=>{
  if(delegatedTimer){clearTimeout(delegatedTimer);delegatedTimer=0;}
 };
 const eventPhoto=event=>{
  const target=event.target;
  if(!target||!target.closest)return null;
  const direct=target.closest('img');
  if(direct&&getProduct(direct))return {img:direct,p:getProduct(direct)};
  const wrapper=target.closest('wix-image,[data-testid*="image"],[class*="image"]');
  if(!wrapper)return null;
  const im=wrapper.querySelector('img');
  if(im&&getProduct(im))return {img:im,p:getProduct(im)};
  return null;
 };
 document.addEventListener('touchstart',e=>{
  if(e.touches.length!==1||e.target?.closest?.('button,[role="button"]'))return;
  const photo=eventPhoto(e);if(!photo)return;
  clearDelegated();
  delegatedX=e.touches[0].clientX;delegatedY=e.touches[0].clientY;
  delegatedTimer=setTimeout(()=>{delegatedTimer=0;openDialog(photo.p);},640);
 },{capture:true,passive:true});
 document.addEventListener('touchmove',e=>{
  const t=e.touches[0];if(!t||Math.abs(t.clientX-delegatedX)>14||
   Math.abs(t.clientY-delegatedY)>14)clearDelegated();
 },{capture:true,passive:true});
 document.addEventListener('touchend',clearDelegated,{capture:true,passive:true});
 document.addEventListener('touchcancel',clearDelegated,{capture:true,passive:true});
 let scheduled=false;
 function scan(){
  scheduled=false;
  for(const img of document.querySelectorAll('img')){
   if(linked.has(img))continue;
   const r=img.getBoundingClientRect();
   if(r.width<90||r.height<110)continue;
   const p=getProduct(img);if(!p)continue;
   bind(img,p);addControls(img,p);
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