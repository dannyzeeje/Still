'use strict';
function currentList(id){let board=data().boards.find(b=>b.id===state.board);return {board,list:board?.lists.find(l=>l.id===id)}}
function listMenu(id,anchor){let {list}=currentList(id);if(!list)return;anchor=anchor||[...document.querySelectorAll('[data-action=list-menu]')].find(b=>b.dataset.id===id);sheet(list.name,`<div class="choices list-dialog-actions"><button class="choice" data-action="edit-list" data-id="${id}">${icon('edit')} Edit list</button><button class="choice" data-action="duplicate-list" data-id="${id}">${icon('boards')} Duplicate list</button><button class="choice danger" data-action="delete-list" data-id="${id}">${icon('trash')} Delete list</button></div>`,null,true,anchor)}
function editList(id){let {list}=currentList(id);if(!list)return;sheet('Edit list',`<form class="list-edit-form" data-id="${id}">${field('name','List name',list.name,'text','required maxlength="60"')}<button class="primary wide">Save</button></form>`,null,true)}
async function saveListName(id,value){let {board,list}=currentList(id),name=value.trim();if(!list||!name||name.length>60)return false;let previous=structuredClone(data());list.name=name;list.updatedAt=board.updatedAt=M.now();if(!await persist()){M.replace(previous);return false}closeAll();render();return true}
let copyingList=false;
async function duplicateList(id){
 if(copyingList)return;let {board,list}=currentList(id);if(!list)return;copyingList=true;
 try{
  let previous=structuredClone(data()),base=list.name.slice(0,53),name=base+' (copy)',n=2;while(board.lists.some(l=>l.name===name))name=base.slice(0,60-String(n).length-8)+` (copy ${n++})`;
  const fresh=item=>{let copy=structuredClone(item);delete copy.id;delete copy.createdAt;delete copy.updatedAt;return M.entity(copy)};
  let copy=fresh(list);copy.name=name;delete copy.legacyStatus;
  let source=tasks().filter(t=>t.board===board.id&&t.listId===id),taskIds=new Map(source.map(t=>[t.id,M.entity().id]));
  const subs=arr=>(arr||[]).map(item=>{let s=fresh(item);s.children=subs(item.children);return s});
  let copied=source.map(t=>{let item=fresh(t);item.id=taskIds.get(t.id);item.listId=copy.id;item.subtasks=subs(t.subtasks);item.attachments=(t.attachments||[]).map(fresh);if(item.parentOccurrence){if(taskIds.has(item.parentOccurrence))item.parentOccurrence=taskIds.get(item.parentOccurrence);else delete item.parentOccurrence}return item});
  board.lists.splice(board.lists.indexOf(list)+1,0,copy);board.updatedAt=M.now();data().tasks.push(...copied);
  if(!await persist()){M.replace(previous);return}closeAll();render();toast('List duplicated');
 }finally{copyingList=false}
}

function positionListPopover(section,anchor){
 if(!anchor?.isConnected)return;let box=anchor.getBoundingClientRect(),vv=window.visualViewport,width=vv?.width||window.innerWidth,height=vv?.height||window.innerHeight,offsetX=vv?.offsetLeft||0,offsetY=vv?.offsetTop||0,pad=12;
 let popupWidth=Math.min(232,width-pad*2);section.style.width=popupWidth+'px';let popupHeight=section.offsetHeight||210;
 let left=Math.max(offsetX+pad,Math.min(box.right-popupWidth,offsetX+width-popupWidth-pad)),below=box.bottom+6,top=below+popupHeight<=offsetY+height-pad?below:Math.max(offsetY+pad,box.top-popupHeight-6);
 section.style.left=left+'px';section.style.top=top+'px';section.style.setProperty('--menu-origin',Math.max(16,Math.min(popupWidth-16,box.right-left-20))+'px '+(top>=box.bottom?'0%':'100%'));
}
function repositionListPopover(){let e=sheets.at(-1);if(e?.anchor&&$('.list-popover'))positionListPopover($('.list-popover'),e.anchor)}
window.addEventListener('resize',repositionListPopover);window.visualViewport?.addEventListener('resize',repositionListPopover);
function listColumn(id){return [...document.querySelectorAll('.screen section.column[data-list]')].find(n=>n.dataset.list===(id||''))}
function toggleListAdd(id,open){let col=listColumn(id);if(!col)return;let form=col.querySelector('.list-task-form'),button=col.querySelector('.add-task-pill');if(!form||!button||form.dataset.saving)return;form.hidden=!open;button.hidden=open;button.setAttribute('aria-expanded',String(open));if(open)form.querySelector('[name=title]').focus({preventScroll:true});else button.focus({preventScroll:true});updateViewport()}
async function addInlineTask(form){
 if(form.dataset.saving)return;let input=form.querySelector('[name=title]'),title=input.value.trim(),board=data().boards.find(b=>b.id===state.board),listId=form.dataset.list;
 if(!title||title.length>240||!board||(listId&&!board.lists.some(l=>l.id===listId)))return;
 form.dataset.saving='true';let submit=form.querySelector('button:not([type=button])');submit.disabled=true;
 let task=M.entity({title,board:board.id,listId,status:'todo',priority:data().preferences.defaultPriority||'none',dueDate:'',dueTime:'',startTime:'',duration:'',reminder:false,repeat:'none',repeatDays:[],interval:1,repeatEnd:'',repeatBehavior:'scheduled',tags:[],subtasks:[],notes:'',description:'',attachments:[]});data().tasks.push(task);
 try{
  if(!await persist()){data().tasks=data().tasks.filter(t=>t.id!==task.id);return}
  let col=form.closest('.column');if(!col?.isConnected)return;
  col.querySelector('.inline-add').insertAdjacentHTML('beforebegin',state.boardView==='list'?taskRow(task):boardCard(task));
  let count=col.querySelector('.list-heading h3 small');if(count)count.textContent=Number(count.textContent)+1;
  let oldOverview=$('.board-overview');if(oldOverview){let ts=tasks().filter(t=>t.board===board.id),unlisted=ts.some(t=>!board.lists.some(l=>l.id===t.listId));oldOverview.outerHTML=boardOverview([...(unlisted?[{id:'',name:'Unsorted'}]:[]),...board.lists],ts)}
  input.value='';input.focus({preventScroll:true});
 }finally{delete form.dataset.saving;submit.disabled=false}
}

// Keep the keyboard attached to the existing input when tapping Add repeatedly.
document.addEventListener('pointerdown',e=>{let submit=e.target.closest('.list-task-form .primary');if(submit&&submit.closest('form').querySelector('[name=title]')===document.activeElement)e.preventDefault()});

async function deleteList(id){
 let {board,list}=currentList(id);if(!list)return;
 let previous=structuredClone(data()),removed=new Set(data().tasks.filter(t=>t.board===board.id&&t.listId===id).map(t=>t.id));
 board.lists=board.lists.filter(l=>l.id!==id);board.updatedAt=M.now();
 data().tasks=data().tasks.filter(t=>!removed.has(t.id));
 if(removed.has(data().timer?.task)){data().timer.task='';data().timer.updatedAt=M.now()}
 if(!await persist()){M.replace(previous);return}
 if(removed.has(focusTask))focusTask='';
 closeAll();render();
}
