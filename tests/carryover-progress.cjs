const fs=require('fs'),assert=require('assert'),{JSDOM,VirtualConsole}=require('jsdom');
const base=__dirname+'/../app/src/main/assets/';let saved='',errors=[],checks=[],noteExports=[],timerAlerts=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
const dom=new JSDOM('<!doctype html><main id="app"></main><div id="overlay"></div><div id="toast"></div>',{url:'https://still.local/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const w=dom.window;w.TextEncoder=TextEncoder;w.structuredClone=x=>JSON.parse(JSON.stringify(x));w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.Native={timerFinished:(id,end,mode)=>timerAlerts.push({id,end,mode}),load:()=>saved,save:s=>{saved=s;return 'ok'},refresh(){},theme(){},haptic(){},launchAction:()=>'',exportAttachment:(name,data)=>noteExports.push({name,data}),exportNotePdf:(title,blocks)=>noteExports.push({title,blocks:JSON.parse(blocks)})};
w.eval(['model.js','viewport.js','notes.js','docx.js','colors.js','task-interactions.js','lists.js','app.js','refinements.js','reorder.js','motion.js'].map(f=>fs.readFileSync(base+f,'utf8')).join('\n')+'\nwindow.Test={M,render,action,taskEditor,closeAll,saveTask,focus,search,theme,timerTick,habitEditor,boardEditor,getDraft:()=>draft,getState:()=>state,readTaskForm,RichNote,NoteDocx,flushNote,exportNote,updateViewport,ensureActiveVisible};');
const T=w.Test,doc=w.document,$=s=>doc.querySelector(s),tick=()=>new Promise(r=>setTimeout(r,25));
function ok(name,fn){fn();checks.push(name)}
async function click(selector){assert($(selector),'Missing '+selector);$(selector).click();await tick()}
async function submit(selector){$(selector).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick()}
function fill(name,val){if(name==='body'&&$('#note-body')){$('#note-body').textContent=val;return}let e=$('[name="'+name+'"]');assert(e,'Missing '+name);e.value=val}
(async()=>{
await tick();const M=T.M,today=M.day(),yesterday=M.addDays(today,-1);M.data.preferences.name='Test';
const make=p=>M.entity({title:'Deadline',dueDate:yesterday,dueTime:'09:00',status:'todo',priority:'low',tags:[],subtasks:[],attachments:[],...p});
const overdue=make({}),done=make({status:'done'}),archived=make({archived:true}),future=make({dueDate:M.addDays(today,1)}),undated=make({dueDate:''});M.data.tasks.push(overdue,done,archived,future,undated);
ok('Past deadlines move to today with high priority',()=>{assert(M.rolloverOverdue());assert.equal(overdue.dueDate,today);assert.equal(overdue.priority,'high');assert.equal(overdue.overdueSince,yesterday);assert.equal(overdue.dueTime,'09:00')});
ok('Completed, archived, future and undated tasks remain unchanged',()=>{assert.equal(done.dueDate,yesterday);assert.equal(archived.dueDate,yesterday);assert.equal(future.priority,'low');assert.equal(undated.dueDate,'')});
ok('Same-day processing is idempotent',()=>assert(!M.rolloverOverdue()));
ok('Repeated carryover retains original deadline',()=>{M.rolloverOverdue(M.addDays(today,3));assert.equal(overdue.dueDate,M.addDays(today,3));assert.equal(overdue.overdueSince,yesterday)});
// Restore current day to exercise UI and normal persistence.
overdue.dueDate=today;overdue.subtasks=[M.entity({title:'Parent',done:true,children:[M.entity({title:'Child',done:false,children:[]})]})];T.render();
ok('Today renders overdue badge and nested 1/2 progress',()=>{const row=doc.querySelector('[data-task="'+overdue.id+'"]');assert(row.querySelector('.overdue-tag'));assert.equal(row.querySelector('.subtask-progress').textContent.trim(),'1/2')});
await T.action('task-expand',overdue.id);await click('[data-action=inline-sub-toggle][data-id="'+overdue.subtasks[0].children[0].id+'"]');
ok('Inline completion updates counter and saves subtasks',()=>{const row=doc.querySelector('[data-task="'+overdue.id+'"]');assert.equal(row.querySelector('.subtask-progress').textContent.trim(),'2/2');assert(JSON.parse(saved).tasks.find(t=>t.id===overdue.id).subtasks[0].children[0].done)});
let board=M.entity({name:'Test board',lists:[M.entity({name:'List'})]});M.data.boards.push(board);overdue.board=board.id;overdue.listId=board.lists[0].id;await T.action('board',board.id);
ok('Board card has the same progress and overdue indicators',()=>{const row=doc.querySelector('.task-card[data-task="'+overdue.id+'"]');assert(row.querySelector('.overdue-tag'));assert.equal(row.querySelector('.subtask-progress').textContent.trim(),'2/2')});
M.toggleTask(overdue.id);T.render();ok('Completed tasks no longer show overdue',()=>assert(!doc.querySelector('[data-task="'+overdue.id+'"] .overdue-tag')));
let habit=M.entity({name:'New habit',startDate:yesterday,frequency:'daily',target:1,completions:[],days:[]});M.data.habits.push(habit);
ok('Creation date bounds availability even with backdated start',()=>{assert(!M.habitAvailable(habit,yesterday));assert(!M.dueHabit(habit,yesterday));assert(M.habitAvailable(habit,today))});
await T.action('habits');ok('Habit week marks previous days unavailable',()=>assert.equal(doc.querySelectorAll('.habit-day.unavailable').length,6));T.closeAll();await T.action('habit-detail',habit.id);ok('Habit history marks previous days unavailable',()=>assert.equal(doc.querySelectorAll('.cal-day.unavailable').length,27));T.closeAll();
M.toggleHabit(habit.id);ok('New habit streak starts at one',()=>assert.equal(M.streak(habit),1));
let recurring=make({repeat:'daily',interval:1,overdueSince:yesterday,dueDate:today});ok('Recurring schedules retain original anchor',()=>assert.equal(M.recurrenceNext(recurring),today));
M.data.tasks.push(recurring);M.toggleTask(recurring.id);let next=M.data.tasks.find(t=>t.parentOccurrence===recurring.id);ok('Next recurrence has fresh overdue state',()=>assert.equal(next.overdueSince,null));
await M.save();ok('Saved state survives restart and keeps original deadline',()=>{let copy=JSON.parse(saved);M.replace(copy);assert.equal(M.data.tasks.find(t=>t.id===overdue.id).overdueSince,yesterday)});
ok('No runtime errors',()=>assert.deepEqual(errors,[]));fs.writeFileSync(__dirname+'/carryover-progress-results.json',JSON.stringify({passed:checks.length,checks},null,2));console.log(checks.length+' carryover/progress checks passed');dom.window.close();})().catch(e=>{console.error(e);dom.window.close();process.exit(1)});
