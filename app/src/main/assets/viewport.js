'use strict';
let viewportPeak=window.innerHeight,viewportWidth=window.innerWidth,viewportFrame=0;
function activeEditor(){const el=document.activeElement;return el&&el.matches('input:not([type=hidden]):not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),textarea,[contenteditable=true]')?el:null}
function ensureActiveVisible(){const el=activeEditor();if(!el)return;let box=el.getBoundingClientRect();if(el.isContentEditable){const sel=window.getSelection();if(sel?.rangeCount&&el.contains(sel.anchorNode)){let caret=sel.getRangeAt(0).getBoundingClientRect();if(caret.height)box=caret}}let vv=window.visualViewport,top=vv?.offsetTop||0,bottom=top+(vv?.height||window.innerHeight)-28,scroller=el.closest('.color-dialog')||el.closest('.sheet-content')||el.closest('.sheet')||document.scrollingElement||document.documentElement;const header=el.closest('.color-dialog')?.querySelector('.color-dialog-head')||el.closest('.sheet')?.querySelector('.sheet-head');if(header)top=Math.max(top,header.getBoundingClientRect().bottom+16);else top+=60;let delta=box.bottom>bottom?box.bottom-bottom:box.top<top?box.top-top:0;if(box.height>bottom-top&&!el.isContentEditable)delta=box.top-top;if(Math.abs(delta)>1)scroller.scrollTop+=delta}
function updateViewport(){const vv=window.visualViewport,height=vv?.height||window.innerHeight;if(Math.abs(window.innerWidth-viewportWidth)>80){viewportPeak=height;viewportWidth=window.innerWidth}else viewportPeak=Math.max(viewportPeak,height);document.documentElement.style.setProperty('--viewport-height',Math.round(height)+'px');document.body.classList.toggle('keyboard-open',!!activeEditor()&&viewportPeak-height>120);cancelAnimationFrame(viewportFrame);viewportFrame=requestAnimationFrame(ensureActiveVisible)}
window.viewportChanged=updateViewport;
window.addEventListener('resize',updateViewport);
window.visualViewport?.addEventListener('resize',updateViewport);
window.visualViewport?.addEventListener('scroll',updateViewport);
document.addEventListener('focusin',()=>{updateViewport();setTimeout(updateViewport,280)});
document.addEventListener('focusout',()=>setTimeout(updateViewport,60));
document.addEventListener('input',()=>{cancelAnimationFrame(viewportFrame);viewportFrame=requestAnimationFrame(ensureActiveVisible)});
document.addEventListener('selectionchange',()=>{if(activeEditor()?.isContentEditable){cancelAnimationFrame(viewportFrame);viewportFrame=requestAnimationFrame(ensureActiveVisible)}});
updateViewport();

window.applyNativeInsets=(top,bottom)=>{document.documentElement.style.setProperty('--safe-top',Math.max(0,Number(top)||0)+'px');if(bottom!==undefined)document.documentElement.style.setProperty('--safe-bottom',Math.max(0,Number(bottom)||0)+'px');updateViewport()};
if(window.Native?.statusInset)window.applyNativeInsets(Native.statusInset(),window.Native?.bottomInset?Native.bottomInset():0);
document.addEventListener('scroll',e=>{let page=e.target?.closest?.('.page');if(page)page.classList.toggle('scrolled',e.target.scrollTop>8);else if(e.target===document)document.body.classList.toggle('scrolled',window.scrollY>8)},true);

document.addEventListener('pointermove',e=>{let glass=e.target.closest('.tabbar,.quick-sheet');if(!glass)return;let box=glass.getBoundingClientRect();glass.style.setProperty('--light-x',((e.clientX-box.left)/box.width*100)+'%');glass.style.setProperty('--light-y',((e.clientY-box.top)/box.height*100)+'%')});
