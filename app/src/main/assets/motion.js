'use strict';
function boardOverview(lists,ts){return `<div class="board-overview" aria-label="Board overview" ${state.boardZoom?'':'hidden'}>${lists.map(l=>{let items=l.id?ts.filter(t=>t.listId===l.id):ts.filter(t=>!data().boards.find(b=>b.id===state.board).lists.some(x=>x.id===t.listId));return `<button class="overview-list" data-list="${l.id}" ${l.id&&state.boardZoom?`data-list-handle="${l.id}"`: ''} data-action="board-overview-list" data-id="${l.id}" aria-label="Open ${esc(l.name)} list"><div class="overview-heading"><strong>${esc(l.name)}</strong><small>${items.filter(t=>t.status!=='done').length}</small></div><div class="overview-previews">${items.slice(0,4).map(t=>`<div class="overview-task ${t.status==='done'?'done':''}"><i class="overview-dot ${esc(t.priority)}"></i><span>${esc(t.title)}</span></div>`).join('')||'<small class="overview-empty">Empty list</small>'}</div>${items.length>4?`<small class="overview-more">+${items.length-4} more</small>`:''}</button>`}).join('')||'<p class="help">Create a list in the zoomed-in view.</p>'}</div>`}
let boardZoomAnimation=null;
function stopBoardZoomMotion(){boardZoomAnimation?.cancel();boardZoomAnimation=null}
function setBoardZoom(out,listId){
 window.StillReorder?.cancel();stopBoardZoomMotion();
 if(out)state.boardZoomScroll=$('.kanban')?.scrollLeft||0;
 state.boardZoom=out;
 if(listId!==undefined&&state.boardView!=='kanban'){state.boardView='kanban';render()}
 const overview=$('.board-overview'),track=$('.kanban')||$('.board-lists'),button=$('[data-action=board-zoom]');
 if(!overview||!track||!button)return;
 overview.hidden=!out;track.hidden=out;
 overview.querySelectorAll('[data-list]').forEach(n=>{if(out&&n.dataset.list)n.setAttribute('data-list-handle',n.dataset.list);else n.removeAttribute('data-list-handle')});
 button.setAttribute('aria-pressed',String(out));button.setAttribute('aria-label',out?'Zoom in':'Zoom out');button.innerHTML=icon(out?'zoomin':'zoomout')+`<span>${out?'Zoom in':'Zoom out'}</span>`;
 let focus=button;
 if(!out&&track.classList.contains('kanban')){
  track.style.scrollBehavior='auto';track.style.scrollSnapType='none';
  let col=listId!==undefined?[...track.querySelectorAll(':scope > [data-list]')].find(c=>c.dataset.list===listId):null;
  track.scrollLeft=col?Math.max(0,track.scrollLeft+col.getBoundingClientRect().left-track.getBoundingClientRect().left-4):state.boardZoomScroll||0;
  if(col)focus=col.querySelector('[data-list-handle]')||button;
  requestAnimationFrame(()=>{track.style.removeProperty('scroll-behavior');track.style.removeProperty('scroll-snap-type')});
 }
 focus.focus({preventScroll:true});
 let stage=$('.board-stage');if(stage?.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  boardZoomAnimation=stage.animate([{opacity:.5,transform:`scale(${out?1.015:.985})`},{opacity:1,transform:'scale(1)'}],{duration:180,easing:'cubic-bezier(.2,.75,.25,1)'});
 }
}
function zoomIntoList(id){setBoardZoom(false,id)}
window.StillMotion=(()=>{
 let previousScreen='',previousSheet='';
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function enter(el,kind='page'){if(el?.classList.contains('list-popover'))return;if(!el||!el.animate||reduced())return;el.getAnimations?.().forEach(a=>a.cancel());el.animate(kind==='dialog'?[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}]:[{opacity:.45},{opacity:1}],{duration:180,easing:'cubic-bezier(.25,.1,.25,1)'})}
 function sync(){
  let key=[state.tab,state.board,state.tab==='calendar'?state.calDate:''].join(':');
  if(key!==previousScreen){let wasReady=!!previousScreen;previousScreen=key;if(wasReady)enter(document.querySelector('.screen'))}
  let top=sheets.at(-1),sheetKey=top?[top.title,sheets.length,document.querySelector('.sheet form')?.dataset.id||''].join(':'):'';
  if(sheetKey!==previousSheet){previousSheet=sheetKey;enter(document.querySelector('.sheet'),top?.modal?'dialog':'page')}
 }
 const observer=new MutationObserver(sync);for(const id of ['app','overlay']){let el=document.getElementById(id);if(el)observer.observe(el,{childList:true,subtree:true})}return {sync};
})();
