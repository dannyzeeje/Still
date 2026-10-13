'use strict';
/* Hold first to lift; a swipe before the hold remains a normal scroll gesture. */
window.StillReorder=(()=>{
 let pending=null,active=null,hold=0,raf=0,blockedUntil=0;
 const columns=()=>[...document.querySelectorAll(state.boardZoom?'.board-overview > [data-list]':'.screen section.column[data-list]')];
 const cards=c=>[...c.children].filter(x=>x.matches('[data-task]'));
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function candidate(target){
  if(!state.board||sheets.length||target.closest('.check,.task-edit,.task-expansion,.list-options,.inline-add,input,textarea'))return null;
  let overview=target.closest('.overview-list[data-list]');if(state.boardZoom&&overview?.dataset.list)return {node:overview,kind:'list',grid:true};
  let task=target.closest('section.column [data-task]');if(task)return {node:task,kind:'task'};
  let h=target.closest('[data-list-handle]');if(h&&h.dataset.listHandle)return {node:h.closest('section.column'),kind:'list'};
  return null;
 }
 function begin(target,x,y){let item=candidate(target);if(!item||active||pending)return;pending={...item,x,y};hold=setTimeout(lift,380)}
 function lift(){
  if(!pending?.node.isConnected){resetPending();return}
  stopBoardZoomMotion();active=pending;pending=null;let a=active,r=a.node.getBoundingClientRect();a.offsetX=a.x-r.left;a.offsetY=a.y-r.top;a.originalParent=a.node.parentNode;a.originalNext=a.node.nextSibling;if(a.grid){a.gridScrollY=window.scrollY;a.gridSlots=columns().map(n=>n.getBoundingClientRect());}
  a.ghost=a.node.cloneNode(true);a.ghost.classList.add('reorder-ghost');a.ghost.setAttribute('aria-hidden','true');a.ghost.inert=true;a.ghost.removeAttribute('id');a.ghost.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));a.ghost.style.width=r.width+'px';a.ghost.style.height=r.height+'px';document.body.append(a.ghost);a.node.classList.add('reorder-placeholder');document.body.classList.add('reorder-active');
  a.status=document.createElement('div');a.status.className='reorder-status';a.status.setAttribute('role','status');a.status.textContent=a.kind==='list'?'Move list':'Move task';document.body.append(a.status);haptic();placeGhost();raf=requestAnimationFrame(frame);
 }
 function resetPending(){clearTimeout(hold);pending=null}
 function placeGhost(){if(active){active.ghost.style.left=active.x-active.offsetX+'px';active.ghost.style.top=active.y-active.offsetY+'px'}}
 function move(x,y){if(pending&&Math.hypot(x-pending.x,y-pending.y)>10)resetPending();if(active){active.x=x;active.y=y;placeGhost()}}
 function animateMove(fn){
  let ns=active.kind==='list'?columns():columns().flatMap(cards),before=new Map(ns.map(n=>[n,n.getBoundingClientRect()]));fn();
  if(reduced())return;
  for(let n of ns){if(n===active.node)continue;let b=before.get(n),r=n.getBoundingClientRect(),dx=b.left-r.left,dy=b.top-r.top;if(Math.abs(dx)+Math.abs(dy)>1&&n.animate){n.getAnimations().forEach(a=>a.cancel());n.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:180,easing:'cubic-bezier(.2,.7,.2,1)'})}}
 }
 function reorder(){
  let a=active;if(!a)return;let hit=document.elementFromPoint(a.x,a.y);let col=hit?.closest('.screen section.column[data-list]');
  if(a.kind==='list'&&a.grid){
   let parent=a.node.parentElement,siblings=columns(),y=a.y+window.scrollY-a.gridScrollY,to=a.gridSlots.findIndex(r=>a.x>=r.left+12&&a.x<=r.right-12&&y>=r.top+12&&y<=r.bottom-12),target=siblings[to];
   if(target&&target!==a.node&&target.dataset.list){let from=siblings.indexOf(a.node);animateMove(()=>parent.insertBefore(a.node,from<to?target.nextElementSibling:target))}
  }else if(a.kind==='list'){
   let parent=a.node.parentElement,horizontal=parent.classList.contains('kanban');let rect=parent.getBoundingClientRect();if(a.x<rect.left-30||a.x>rect.right+30||a.y<rect.top-50||a.y>rect.bottom+50)return;
   let siblings=columns().filter(n=>n!==a.node&&n.dataset.list),coord=horizontal?a.x:a.y;
   let before=siblings.find(n=>{let r=n.getBoundingClientRect();return coord<(horizontal?r.left+r.width/2:r.top+r.height/2)})||parent.querySelector('.new-list-card');
   if(before!==a.node.nextElementSibling&&before!==a.node)animateMove(()=>parent.insertBefore(a.node,before));
  }else if(col){
   let siblings=cards(col).filter(n=>n!==a.node),before=siblings.find(n=>{let r=n.getBoundingClientRect();return a.y<r.top+r.height/2})||col.querySelector('.inline-add');
   if(col!==a.node.parentNode||a.node.nextElementSibling!==before)animateMove(()=>col.insertBefore(a.node,before));
  }
 }
 function frame(){
  if(!active)return;let a=active,k=state.boardZoom?null:document.querySelector('.kanban');if(k){let r=k.getBoundingClientRect();if(a.y>r.top-40&&a.y<r.bottom+40){let dx=a.x>r.right-48?Math.min(13,(a.x-r.right+48)/3):a.x<r.left+48?-Math.min(13,(r.left+48-a.x)/3):0;k.scrollLeft+=dx}}
  let h=window.innerHeight,dy=a.y<85?-Math.min(12,(85-a.y)/3):a.y>h-100?Math.min(12,(a.y-h+100)/3):0;if(dy)window.scrollBy(0,dy);
  reorder();raf=requestAnimationFrame(frame);
 }
 async function finish(cancel=false){
  resetPending();if(!active)return false;let a=active;active=null;cancelAnimationFrame(raf);a.ghost.remove();a.status.remove();a.node.classList.remove('reorder-placeholder');document.body.classList.remove('reorder-active');blockedUntil=Date.now()+600;suppressClickUntil=blockedUntil;
  if(cancel){a.originalParent.insertBefore(a.node,a.originalNext?.parentNode===a.originalParent?a.originalNext:null);return true}
  let previous=structuredClone(data()),b=data().boards.find(b=>b.id===state.board);
  if(!b)return true;
  if(a.kind==='list'){let ids=columns().map(c=>c.dataset.list).filter(Boolean);b.lists.sort((x,y)=>ids.indexOf(x.id)-ids.indexOf(y.id));b.updatedAt=M.now()}
  else{
   let order=columns().flatMap(c=>cards(c).map(n=>{let t=data().tasks.find(t=>t.id===n.dataset.task);if(t&&t.listId!==c.dataset.list){t.listId=c.dataset.list;t.updatedAt=M.now()}return t})).filter(Boolean),ids=new Set(order.map(t=>t.id)),i=0;
   data().tasks=data().tasks.map(t=>ids.has(t.id)?order[i++]:t);let t=data().tasks.find(t=>t.id===a.node.dataset.task);if(t)t.updatedAt=M.now();
  }
  let scroll=document.querySelector('.kanban')?.scrollLeft||0;if(!await persist()){M.replace(previous);render();let k=document.querySelector('.kanban');if(k)k.scrollLeft=scroll}else{render();let k=document.querySelector('.kanban');if(k)k.scrollLeft=scroll;haptic();toast(a.kind==='list'?'List order saved':'Task order saved')}
  return true;
 }
 document.addEventListener('touchstart',e=>{if(e.touches.length!==1){finish(true);return}let t=e.touches[0];begin(e.target,t.clientX,t.clientY)},{passive:true});
 document.addEventListener('touchmove',e=>{if(e.touches.length!==1)return;let t=e.touches[0];if(active)e.preventDefault();move(t.clientX,t.clientY)},{passive:false});
 document.addEventListener('touchend',e=>{if(active){e.preventDefault();finish()}else resetPending()},{passive:false});
 document.addEventListener('touchcancel',()=>finish(true),{passive:true});
 document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0)begin(e.target,e.clientX,e.clientY)});
 document.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')move(e.clientX,e.clientY)});
 document.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')finish()});
 document.addEventListener('pointercancel',e=>{if(e.pointerType==='mouse')finish(true)});
 document.addEventListener('contextmenu',e=>{if(active||pending||candidate(e.target))e.preventDefault()});
 document.addEventListener('click',e=>{if(Date.now()<blockedUntil||active){e.preventDefault();e.stopImmediatePropagation()}},{capture:true});
 document.addEventListener('keydown',e=>{let h=e.target.closest('[data-list-handle]');if(h&&['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();let id=h.dataset.listHandle;action(['ArrowLeft','ArrowUp'].includes(e.key)?'list-up':'list-down',id).then(()=>columns().map(c=>c.matches('[data-list-handle]')?c:c.querySelector('[data-list-handle]')).find(h=>h?.dataset.listHandle===id)?.focus({preventScroll:true}))}});
 window.addEventListener('blur',()=>finish(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(true)});
 return {cancel(){if(!active&&!pending)return false;finish(true);return true}};
})();
