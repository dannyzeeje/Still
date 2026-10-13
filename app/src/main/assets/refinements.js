'use strict';
function durationLabel(n){return n>=60?`${Math.floor(n/60)}h${n%60?' '+n%60+'m':''}`:`${n}m`}
function rememberDuration(n){if(Number.isInteger(n)&&n>0&&n<=1439)data().preferences.recentDurations=[n,...(data().preferences.recentDurations||[]).filter(x=>x!==n)].slice(0,5)}
function recentDurationButtons(){let ns=data().preferences.recentDurations||[];return ns.length?`<div class="recent-durations" aria-label="Recently used durations">${ns.map(n=>`<button data-action="duration-recent" data-id="${n}" aria-label="Set ${Math.floor(n/60)} hours ${n%60} minutes">${durationLabel(n)}</button>`).join('')}</div>`:''}
let durationReturnFocus=null;
function closeDurationPicker(){let el=$('#duration-overlay');if(!el)return;el.remove();$('#overlay').inert=false;$('#app').inert=!!sheets.length;durationReturnFocus?.focus({preventScroll:true})}
function durationWheelValue(w){let count=Number(w.getAttribute('aria-valuemax'))+1;return ((Math.round(w.scrollTop/44)%count)+count)%count}
function openDurationPicker(){
 if($('#duration-overlay'))return;
 durationReturnFocus=document.activeElement;
 let n=Math.round((data().timer?.total||data().preferences[focusMode+'Minutes']*60)/60);
 let wheel=(kind,count,value)=>`<div class="duration-unit"><span>${kind==='hours'?'Hours':'Minutes'}</span><div class="duration-wheel-shell"><div class="duration-wheel" data-unit="${kind}" tabindex="0" role="spinbutton" aria-label="${kind}" aria-valuemin="0" aria-valuemax="${count-1}" aria-valuenow="${value}">${Array.from({length:count*7},(_,i)=>`<button tabindex="-1" data-index="${i}" data-value="${i%count}" aria-hidden="true">${String(i%count).padStart(2,'0')}</button>`).join('')}</div></div></div>`;
 let el=document.createElement('div');el.id='duration-overlay';el.className='duration-overlay';el.innerHTML=`<section class="duration-dialog" role="dialog" aria-modal="true" aria-labelledby="duration-title"><header><h2 id="duration-title">Duration</h2><button aria-label="Close duration picker" data-duration-close>×</button></header><div class="duration-wheels">${wheel('hours',24,Math.floor(n/60))}<b>:</b>${wheel('minutes',60,n%60)}</div><p class="duration-error" role="status"></p><button class="primary wide" data-duration-apply>Set duration</button></section>`;
 $('#overlay').inert=true;$('#app').inert=true;document.body.append(el);
 el.querySelectorAll('.duration-wheel').forEach(w=>{
  const count=Number(w.getAttribute('aria-valuemax'))+1,step=44,center=count*3;let idle=0,touching=false;
  const index=()=>Math.round(w.scrollTop/step),mod=n=>((n%count)+count)%count;
  const update=()=>{let i=index(),v=mod(i);w.setAttribute('aria-valuenow',v);w.setAttribute('aria-valuetext',`${v} ${w.dataset.unit}`);w.querySelectorAll('button.selected').forEach(b=>b.classList.remove('selected'));w.children[i]?.classList.add('selected');};
  const recenter=()=>{if(!w.isConnected||touching)return;let i=index(),fraction=w.scrollTop-i*step;w.scrollTop=(center+mod(i))*step+fraction;update()};
  w.scrollTop=(center+Number(w.getAttribute('aria-valuenow')))*step;update();
  w.addEventListener('scroll',()=>{update();let i=index();if(i<count/2||i>count*6.5){let fraction=w.scrollTop-i*step;w.scrollTop=(center+mod(i))*step+fraction;update()}clearTimeout(idle);idle=setTimeout(recenter,160)},{passive:true});
  w.addEventListener('scrollend',recenter,{passive:true});
  w.addEventListener('touchstart',()=>{touching=true;clearTimeout(idle)},{passive:true});
  const endTouch=()=>{touching=false;clearTimeout(idle);idle=setTimeout(recenter,180)};w.addEventListener('touchend',endTouch,{passive:true});w.addEventListener('touchcancel',endTouch,{passive:true});
  w.addEventListener('click',e=>{let b=e.target.closest('[data-index]');if(b){const top=+b.dataset.index*step;if(w.scrollTo)w.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});else w.scrollTop=top;update()}});
  w.addEventListener('keydown',e=>{let i=index();if(e.key==='ArrowUp')i--;else if(e.key==='ArrowDown')i++;else if(e.key==='Home')i=center;else if(e.key==='End')i=center+count-1;else return;e.preventDefault();w.scrollTop=i*step;update();clearTimeout(idle);idle=setTimeout(recenter,180)});
 });
 el.addEventListener('click',e=>{if(e.target===el||e.target.closest('[data-duration-close]'))closeDurationPicker();if(e.target.closest('[data-duration-apply]')){let ws=[...el.querySelectorAll('.duration-wheel')],n=durationWheelValue(ws[0])*60+durationWheelValue(ws[1]);if(n<1||n>1439){el.querySelector('.duration-error').textContent='Choose at least 1 minute.';return}closeDurationPicker();requestDuration(n)}});
 el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeDurationPicker();return}if(e.key==='Tab'){let xs=[...el.querySelectorAll('button:not([tabindex="-1"]),[tabindex="0"]')],i=xs.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();xs.at(-1).focus()}else if(!e.shiftKey&&i===xs.length-1){e.preventDefault();xs[0].focus()}e.stopPropagation()}});
 el.querySelector('.duration-wheel').focus({preventScroll:true});
}
function requestDuration(n){if(!Number.isInteger(n)||n<1||n>1439)return;if(data().timer){confirmation('Change duration?','This will reset your current timer.','duration-confirm',String(n));return}return applyDuration(n)}
async function applyDuration(n){
 if(!Number.isInteger(n)||n<1||n>1439)return;
 let previous=structuredClone(data());data().timer=null;data().preferences[focusMode+'Minutes']=n;
 if(!await persist()){M.replace(previous);return}
 while(sheets.length&&sheets.at(-1).title!=='Focus')sheets.pop();if(sheets.at(-1)?.title==='Focus')sheets.pop();focus();render();
}
