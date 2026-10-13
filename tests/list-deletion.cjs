const fs=require('fs'),assert=require('assert'),{JSDOM,VirtualConsole}=require('jsdom');let saved='',fail=false,checks=[],errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM('<main id="app"></main><div id="overlay"></div><div id="toast"></div>',{url:'https://still.local/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document,$=s=>d.querySelector(s);w.TextEncoder=TextEncoder;w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=w.scrollBy=()=>{};w.Native={load:()=>saved,save:s=>{if(fail)return 'failed';saved=s;return 'ok'},refresh(){},theme(){},haptic(){},launchAction:()=>''};const base=__dirname+'/../app/src/main/assets/';w.eval(['model.js','viewport.js','notes.js','docx.js','colors.js','task-interactions.js','lists.js','app.js','refinements.js','reorder.js','motion.js'].map(f=>fs.readFileSync(base+f,'utf8')).join('\n')+'\nwindow.T={M,action,closeAll,taskEditor,saveTask};');const T=w.T,wait=(ms=35)=>new Promise(r=>setTimeout(r,ms));function ok(n,f){f();checks.push(n)}function submit(f){f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}))}
(async()=>{
 await wait();T.M.data.preferences.name='Test';
 const list=T.M.entity({name:'Remove me'}),keepList=T.M.entity({name:'Keep me'}),board=T.M.entity({name:'Board',lists:[list,keepList]}),other=T.M.entity({name:'Other board',lists:[T.M.entity({name:'Other list'})]});
 T.M.data.boards.push(board,other);
 const make=(extra={})=>T.M.entity({title:'Task',board:board.id,listId:list.id,status:'todo',priority:'none',tags:[],subtasks:[T.M.entity({title:'Child',children:[]})],attachments:[{id:'file',data:'example'}],...extra});
 const doomed=[make(),make({status:'done'}),make({archived:true})],kept=[make({listId:keepList.id}),make({listId:''}),make({board:other.id,listId:other.lists[0].id})];
 T.M.data.tasks.push(...doomed,...kept);T.M.data.timer=T.M.entity({task:doomed[0].id,mode:'focus',total:1500,remaining:500,running:false});
 await T.action('board',board.id);await T.action('list-menu',list.id);await T.action('delete-list',list.id);
 ok('Confirmation describes permanent task deletion',()=>{assert($('.sheet').textContent.includes('permanently deleted'));assert(!$('.sheet').textContent.includes('kept under Unsorted'))});
 await T.action('close');ok('Cancel preserves list and every task',()=>{assert.equal(T.M.data.tasks.length,6);assert.equal(T.M.data.boards[0].lists.length,2)});
 await T.action('delete-list',list.id);let before=JSON.stringify(T.M.data);fail=true;await T.action('confirm-delete-list',list.id);fail=false;
 ok('Failed save restores list, tasks, embedded content and timer',()=>assert.equal(JSON.stringify(T.M.data),before));
 ok('Failed save leaves confirmation available for retry',()=>assert($('.sheet [data-action=confirm-delete-list]')));
 await T.action('confirm-delete-list',list.id);
 ok('Deletion removes open completed and archived tasks',()=>{assert(!T.M.data.tasks.some(t=>doomed.some(x=>x.id===t.id)));assert(!T.M.data.boards[0].lists.some(l=>l.id===list.id))});
 ok('Unsorted, neighbouring lists and other boards are untouched',()=>assert.deepEqual(JSON.parse(JSON.stringify(T.M.data.tasks)),JSON.parse(JSON.stringify(kept))));
 ok('Persisted deletion includes nested content and attachments',()=>{let savedData=JSON.parse(saved);assert.equal(savedData.tasks.length,3);for(let t of doomed)assert(!savedData.tasks.some(x=>x.id===t.id));assert.equal(savedData.boards[0].lists.length,1)});
 ok('Focus can continue without referencing the removed task',()=>{assert.equal(T.M.data.timer.task,'');assert.equal(T.M.data.timer.remaining,500)});
 let after=JSON.stringify(T.M.data);await T.action('confirm-delete-list',list.id);
 ok('Repeated stale deletion is harmless',()=>assert.equal(JSON.stringify(T.M.data),after));
 await T.action('delete-list',keepList.id);
 const style=d.createElement('style');style.textContent=fs.readFileSync(base+'style.css','utf8').split('/* 1.13:')[1].replace(/^.*?\*\//s,'').replaceAll('var(--safe-top)','0px').replaceAll('var(--safe-bottom)','0px');d.head.append(style);
 ok('Phone dialog has rounded corners and no bottom-sheet handle',()=>{assert.equal(w.getComputedStyle($('.sheet')).borderRadius,'26px');assert.equal(w.getComputedStyle($('.handle')).display,'none');assert.equal(w.getComputedStyle($('.sheet')).maxWidth,'440px')});
 ok('Backdrop reserves horizontal space on both sides',()=>{let css=w.getComputedStyle($('.backdrop'));assert.equal(css.paddingLeft,'20px');assert.equal(css.paddingRight,'20px')});
 ok('No JavaScript errors',()=>assert.deepEqual(errors,[]));
 fs.writeFileSync(__dirname+'/list-deletion-results.json',JSON.stringify({passed:checks.length,checks,scope:'JSDOM persistence, failure and CSS checks; physical phone rendering unverified.'},null,2));console.log(checks.length+' list deletion checks passed\n'+checks.join('\n'));dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exit(1)});
