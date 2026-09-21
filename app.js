/* =========================================================
   HABIT OS — app.js
   Vanilla JS, sem build, sem backend. Tudo fica no localStorage.
   ========================================================= */

/* ---------- CONFIG & PADRÕES ---------- */
const KEY="habit-os-v3"; // mantido para não perder dados já salvos no navegador
const DAYS=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const PRAYERS=[
{id:"p1",name:"Oração da manhã",time:"07:00",text:"Senhor, obrigado por este novo dia. Guia meus passos, minhas escolhas e minhas palavras. Dá-me disciplina, sabedoria e paz.",active:true},
{id:"p2",name:"Oração antes do almoço",time:"12:00",text:"Senhor, obrigado por este alimento e por tudo o que tornou possível esta refeição. Abençoa este momento e todos que precisam de alimento. Recebo esta refeição com gratidão.",active:true},
{id:"p3",name:"Oração da tarde",time:"18:00",text:"Senhor, obrigado por me sustentar até aqui. Ajuda-me a terminar bem o que comecei, corrigir meus erros e manter a paz.",active:true},
{id:"p4",name:"Oração da noite",time:"21:30",text:"Senhor, obrigado por este dia. Perdoa minhas falhas, guarda minha família e dá-me uma noite tranquila. Que amanhã eu possa recomeçar com coragem.",active:true}
];
const ACCENTS=[{id:"gold",hex:"#e2a63b"},{id:"teal",hex:"#3f8f86"},{id:"rose",hex:"#c9667a"},{id:"indigo",hex:"#5b6bd6"},{id:"forest",hex:"#3f7d52"}];
const ACCENT_MAP=Object.fromEntries(ACCENTS.map(a=>[a.id,a.hex]));
const THEME_LABELS={light:"Claro",dark:"Escuro",auto:"Automático"};
const LEVEL_TITLES=["Iniciante","Aprendiz","Consistente","Dedicado","Focado","Resiliente","Disciplinado","Mestre dos Hábitos","Lenda viva"];
const DEFAULT_SETTINGS={name:"",avatar:"🌟",accent:"gold",dailyGoal:3,weekStart:0};
const INITIAL={habits:[],completions:[],tasks:[],routines:[],routineSteps:[],routineDone:[],prayers:PRAYERS,prayerDone:[],events:[],xp:0,theme:"light",onboarded:false,settings:clone(DEFAULT_SETTINGS),seenAchievements:[]};

/* ---------- ESTADO ---------- */
let data=load(),page="today",modal=null,selected=dateKey(),month=new Date();
let habitsTab="habits",habitSearch="",repPeriod=14,playerRoutine=null,playerIndex=0;

function load(){
  try{
    let raw=localStorage.getItem(KEY)||localStorage.getItem("habit-os-data-v1");
    let x=raw?JSON.parse(raw):null;
    if(!x)return clone(INITIAL);
    return {
      ...clone(INITIAL),...x,
      prayers:x.prayers||PRAYERS,
      events:x.events||[],
      prayerDone:x.prayerDone||[],
      routines:(x.routines||[]).map(r=>({frequency:"daily",days:[],xp:(r.items?.length||0)*5,...r})),
      routineSteps:x.routineSteps||[],
      routineDone:x.routineDone||[],
      settings:{...clone(DEFAULT_SETTINGS),...(x.settings||{})},
      seenAchievements:x.seenAchievements||[],
    };
  }catch{return clone(INITIAL)}
}
function clone(x){return JSON.parse(JSON.stringify(x))}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}

/* ---------- UTILITÁRIOS ---------- */
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}
function pad(n){return String(n).padStart(2,"0")}
function dateKey(d=new Date()){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function date(k){let a=k.split("-").map(Number);return new Date(a[0],a[1]-1,a[2])}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function fmt(k){return new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"numeric",month:"long"}).format(date(k))}
function fmtShort(k){if(!k)return "—";return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit"}).format(date(k))}
function fmtDateTime(d){return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(d)}
function add(d,n){let x=new Date(d);x.setDate(x.getDate()+n);return x}
function toast(t){let e=document.createElement("div");e.className="toast";e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),1800)}
function slugify(s){return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||"rotina"}
function prioRank(p){return p==="high"?2:p==="low"?0:1}
function prioLabel(p){return p==="high"?"Alta":p==="low"?"Baixa":"Média"}
function orderedDayDefs(){let base=[{v:0,l:"Dom"},{v:1,l:"Seg"},{v:2,l:"Ter"},{v:3,l:"Qua"},{v:4,l:"Qui"},{v:5,l:"Sex"},{v:6,l:"Sáb"}];return data.settings.weekStart===1?[...base.slice(1),base[0]]:base}
function ring(pct,size=64,stroke=7,color="var(--accent)"){pct=Math.max(0,Math.min(1,pct||0));let r=(size-stroke)/2,c=2*Math.PI*r,off=c*(1-pct);return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="ring"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size/2} ${size/2})"/></svg>`}

/* ---------- CONSULTAS DE DOMÍNIO ---------- */
function scheduled(h,k){return h.frequency==="daily"||(h.days||[]).includes(date(k).getDay())}
function habits(k){return data.habits.filter(h=>!h.archived&&scheduled(h,k))}
function routines(k=dateKey()){return data.routines.filter(r=>!r.archived&&scheduled(r,k))}
function prayers(){return data.prayers.filter(p=>p.active!==false)}
function tasks(k){return data.tasks.filter(t=>!t.archived&&t.due===k)}
function events(k){return data.events.filter(e=>!e.archived&&e.date===k).sort((a,b)=>(a.time||"").localeCompare(b.time||""))}
function doneH(id,k){return data.completions.some(x=>x.habitId===id&&x.date===k)}
function doneP(id,k){return data.prayerDone.some(x=>x.prayerId===id&&x.date===k)}
function stepDone(rid,sid,k){return data.routineSteps.some(x=>x.routineId===rid&&x.stepId===sid&&x.date===k)}
function doneR(rid,k){return data.routineDone.some(x=>x.routineId===rid&&x.date===k)}
function stats(k){
  let h=habits(k),p=prayers(),t=tasks(k),r=routines(k);
  let total=h.length+p.length+t.length+r.length;
  let done=h.filter(x=>doneH(x.id,k)).length+p.filter(x=>doneP(x.id,k)).length+t.filter(x=>x.completed).length+r.filter(x=>doneR(x.id,k)).length;
  return {h,p,t,r,e:events(k),total,done,pct:total?done/total:0};
}
function streak(h){let set=new Set(data.completions.filter(x=>x.habitId===h.id).map(x=>x.date)),n=0,d=new Date();for(let i=0;i<365;i++){let k=dateKey(d);if(scheduled(h,k)){if(set.has(k))n++;else break}d=add(d,-1)}return n}
function rate(h,n){let a=0,b=0;for(let i=0;i<n;i++){let k=dateKey(add(new Date(),-i));if(scheduled(h,k)){a++;if(doneH(h.id,k))b++}}return a?b/a:0}
function range(n,off=0){let a=0,b=0;for(let i=off;i<off+n;i++){let s=stats(dateKey(add(new Date(),-i)));a+=s.total;b+=s.done}return a?b/a:0}
function analysis(n=7){
  let a=range(n),b=range(n,n),d=Math.round((a-b)*100),w=data.habits.filter(h=>!h.archived).sort((x,y)=>rate(x,14)-rate(y,14))[0],s=[];
  s.push(a>=.8?"Sua consistência recente está alta.":a>=.5?"Você está cumprindo uma parte importante das metas, mas ainda pode ganhar regularidade.":"Há espaço para recuperar consistência; priorize as metas essenciais.");
  s.push(d>5?`Os últimos ${n} dias ficaram ${d} pontos percentuais acima dos ${n} anteriores.`:d<-5?`Os últimos ${n} dias ficaram ${Math.abs(d)} pontos percentuais abaixo dos ${n} anteriores.`:`Os últimos ${n} dias ficaram próximos dos ${n} anteriores.`);
  if(w)s.push(`O hábito com menor cumprimento no período é "${w.name}", com ${Math.round(rate(w,14)*100)}%.`);
  return s.join(" ");
}

/* ---------- NÍVEL & CONQUISTAS ---------- */
function levelInfo(xp){const per=200,level=Math.floor(xp/per)+1,into=xp%per,title=LEVEL_TITLES[Math.min(level-1,LEVEL_TITLES.length-1)];return {level,into,per,pct:into/per,title}}
const ACHIEVEMENTS=[
  {id:"first_habit",icon:"🌱",name:"Primeiro passo",desc:"Crie seu primeiro hábito",test:()=>data.habits.length>0},
  {id:"week_streak",icon:"🔥",name:"Semana de fogo",desc:"7 dias seguidos em um hábito",test:()=>data.habits.some(h=>streak(h)>=7)},
  {id:"month_streak",icon:"🏔️",name:"Trinta dias",desc:"30 dias seguidos em um hábito",test:()=>data.habits.some(h=>streak(h)>=30)},
  {id:"perfect_day",icon:"✨",name:"Dia perfeito",desc:"100% das metas em um dia",test:()=>{for(let i=0;i<60;i++){let s=stats(dateKey(add(new Date(),-i)));if(s.total>0&&s.pct>=1)return true}return false}},
  {id:"xp_500",icon:"⭐",name:"500 XP",desc:"Acumule 500 XP",test:()=>data.xp>=500},
  {id:"xp_2000",icon:"💠",name:"2000 XP",desc:"Acumule 2000 XP",test:()=>data.xp>=2000},
  {id:"routine_master",icon:"📋",name:"Rotina dominada",desc:"Complete uma rotina 10 vezes",test:()=>{let c={};data.routineDone.forEach(r=>c[r.routineId]=(c[r.routineId]||0)+1);return Object.values(c).some(v=>v>=10)}},
  {id:"prayer_faithful",icon:"🙏",name:"Fiel",desc:"30 orações concluídas",test:()=>data.prayerDone.length>=30},
  {id:"task_master",icon:"✅",name:"Produtivo",desc:"20 tarefas concluídas",test:()=>data.tasks.filter(t=>t.completed).length>=20},
];
function achievementsList(){return ACHIEVEMENTS.map(a=>({...a,unlocked:a.test()}))}
function achievementsGrid(list){return list.map(a=>`<div class="ach ${a.unlocked?"on":"off"}"><div class="achIcon">${a.icon}</div><div class="achName">${esc(a.name)}</div><div class="achDesc">${esc(a.desc)}</div></div>`).join("")}
function checkAchievements(){
  let list=achievementsList(),newly=list.filter(a=>a.unlocked&&!data.seenAchievements.includes(a.id));
  if(newly.length){newly.forEach(a=>data.seenAchievements.push(a.id));save();toast(newly.length>1?`🏆 ${newly.length} conquistas desbloqueadas!`:`🏆 Conquista: ${newly[0].name}`)}
}

/* ---------- CASCA / NAVEGAÇÃO ---------- */
function nav(){return `<nav class="nav"><div class="navin">${[["today","⌂","Hoje"],["agenda","▦","Agenda"],["habits","✓","Hábitos"],["evolution","▥","Evolução"],["profile","◉","Perfil"]].map(x=>`<button class="${page===x[0]?"active":""}" onclick="go('${x[0]}')"><strong>${x[1]}</strong>${x[2]}</button>`).join("")}<button class="addBtn" onclick="openForm('quick')">＋</button></div></nav>`}
function go(p){page=p;modal=null;render()}
function render(){
  let active=document.activeElement,activeId=active&&active.id,selStart=activeId&&typeof active.selectionStart==="number"?active.selectionStart:null;
  let dark=data.theme==="dark"||(data.theme==="auto"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark",dark);
  document.documentElement.style.setProperty("--accent",ACCENT_MAP[data.settings.accent]||ACCENT_MAP.gold);
  let body=data.onboarded?`<main>${page==="today"?today():page==="agenda"?agenda():page==="habits"?habitsHubPage():page==="evolution"?evolution():profileSettings()}</main>${nav()}`:onboard();
  document.getElementById("app").innerHTML=body;
  if(modal)document.getElementById("app").insertAdjacentHTML("beforeend",modal==="player"?routinePlayerView():modal);
  if(activeId){let el=document.getElementById(activeId);if(el){el.focus();if(selStart!==null&&el.setSelectionRange){try{el.setSelectionRange(selStart,selStart)}catch(e){}}}}
}
function onboard(){return `<div class="onboard"><div class="eyebrow">HABIT OS</div><div><div class="onTitle">Organize.<br>Execute.<br>Evolua.</div><p>Hábitos, rotinas, agenda, orações, tarefas, XP e relatórios — tudo neste navegador.</p></div><button class="primary light" onclick="data.onboarded=true;save();render()">COMEÇAR</button></div>`}
function section(t,b){return `<div class="section"><b>${t}</b></div>${b}`}
function check(cls,on,fn){return `<button class="check ${on?"done":""}" onclick="${fn}">${on?"✓":""}</button>`}
function empty(a,b,c,t){return `<div class="card empty"><h3>${a}</h3><div class="sub">${b}</div><button class="primary" onclick="openForm('${t}')">+ ${c}</button></div>`}

/* ---------- ITENS ---------- */
function habitItem(h,k=dateKey()){let d=doneH(h.id,k);return `<div class="item">${check("",d,`toggleH('${h.id}','${k}')`)}<div class="itemMain"><div class="itemName ${d?"doneText":""}">${esc(h.icon)} ${esc(h.name)}</div><div class="meta">🔥 ${streak(h)} dias • +${h.xp} XP</div></div><button class="iconBtn" onclick="openForm('habit','${h.id}')">✎</button></div>`}
function prayerItem(p){let d=doneP(p.id,dateKey());return `<div class="item">${check("",d,`toggleP('${p.id}')`)}<div class="itemMain"><div class="itemName ${d?"doneText":""}">🙏 ${esc(p.name)}</div><div class="meta">⏰ ${esc(p.time)}</div><div class="prayerPreview">${esc(p.text)}</div></div><button class="iconBtn" onclick="openForm('prayer','${p.id}')">✎</button></div>`}
function taskItem(t){return `<div class="item">${check("",t.completed,`toggleT('${t.id}')`)}<div class="itemMain"><div class="itemName ${t.completed?"doneText":""}">${esc(t.title)}</div><div class="meta">${prioLabel(t.priority)}</div></div><button class="iconBtn" onclick="openForm('task','${t.id}')">✎</button></div>`}
function eventItem(e){return `<div class="item"><div class="time">${esc(e.time||"—")}</div><div class="itemMain"><div class="itemName">${esc(e.title)}</div><div class="meta">${esc(e.category||"Agenda")}${e.notes?" • "+esc(e.notes):""}</div></div><button class="iconBtn" onclick="openForm('event','${e.id}')">✎</button></div>`}
function routineItem(r,k=dateKey()){
  let doneToday=doneR(r.id,k),doneCount=r.items.filter(s=>stepDone(r.id,s.id,k)).length,isToday=k===dateKey();
  return `<div class="card routineCard ${doneToday?"routineDone":""}">
    <div class="item" style="padding:0;border:0">
      <div style="font-size:26px">📋</div>
      <div class="itemMain"><div class="itemName ${doneToday?"doneText":""}">${esc(r.name)}</div><div class="meta">${doneCount}/${r.items.length} passos • +${r.xp||r.items.length*5} XP</div></div>
      ${isToday?`<button class="secondary small" onclick="openRoutinePlayer('${r.id}')">▶ Guiado</button>`:""}
    </div>
    <div class="stepsList">${r.items.map(s=>`<label class="stepRow"><input type="checkbox" ${stepDone(r.id,s.id,k)?"checked":""} onchange="toggleRoutineStep('${r.id}','${s.id}','${k}')"><span>${esc(s.title)}</span></label>`).join("")}</div>
  </div>`;
}

/* ---------- PÁGINA: HOJE ---------- */
function dailyGoalCard(s){
  let goal=data.settings.dailyGoal||3;
  if(s.done>=goal)return `<div class="card goalCard metGoal">🎉 Meta diária de ${goal} metas cumprida!</div>`;
  return `<div class="card goalCard"><div class="goalRow"><span>Meta diária</span><b>${s.done}/${goal}</b></div><div class="progress thin"><i style="width:${Math.min(100,s.done/goal*100)}%"></i></div></div>`;
}
function today(){
  let k=dateKey(),s=stats(k),lv=levelInfo(data.xp),bestStreak=Math.max(0,...data.habits.filter(h=>!h.archived).map(h=>streak(h)),0);
  let name=data.settings.name?`, ${esc(data.settings.name)}`:"";
  return `<div class="top"><div><div class="eyebrow">HABIT OS</div><div class="title">Olá${name}</div><div class="sub">${fmt(k)}</div></div><div class="avatarBadge">${esc(data.settings.avatar||"🌟")}</div></div>
  <div class="card hero">
    <div class="heroGrid">
      <div class="heroMain"><div class="percent">${Math.round(s.pct*100)}%</div><div class="muted">${s.done}/${s.total} metas cumpridas</div><div class="progress"><i style="width:${s.pct*100}%"></i></div><div class="muted heroFoot">🔥 maior sequência: ${bestStreak} dias • ${data.xp} XP</div></div>
      <div class="heroLevel">${ring(lv.pct,72,8,"var(--accent)")}<div class="levelLabel"><b>Nv.${lv.level}</b><span>${lv.into}/${lv.per}</span></div></div>
    </div>
  </div>
  ${dailyGoalCard(s)}
  ${section("Hábitos", s.h.map(h=>habitItem(h)).join("")||empty("Nenhum hábito","Crie metas para dias específicos.","Novo hábito","habit"))}
  ${section("Rotinas", s.r.map(r=>routineItem(r)).join("")||empty("Nenhuma rotina","Crie uma sequência de passos para seguir todos os dias.","Nova rotina","routine"))}
  ${section("Orações", prayers().map(prayerItem).join(""))}
  ${section("Tarefas", s.t.map(taskItem).join("")||empty("Sem tarefas","Organize suas tarefas por data.","Nova tarefa","task"))}
  ${section("Agenda de hoje", s.e.map(eventItem).join("")||empty("Sem compromissos","Adicione horários, estudos, treinos ou compromissos.","Adicionar","event"))}`;
}

/* ---------- PÁGINA: AGENDA ---------- */
function agenda(){
  let s=stats(selected),days=calendarDays(month);
  return `<div class="top"><div><div class="title">Agenda</div><div class="sub">Escolha um dia e veja suas metas</div></div><button class="secondary" onclick="openForm('event')">＋ Compromisso</button></div>
  <div class="card">
    <div class="calendarHead"><button class="secondary small" onclick="monthMove(-1)">‹</button><b>${month.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</b><button class="secondary small" onclick="monthMove(1)">›</button></div>
    <div class="weekHead">${orderedDayDefs().map(x=>`<span>${x.l}</span>`).join("")}</div>
    <div class="monthGrid">${days.map(x=>x?cell(x):"<div></div>").join("")}</div>
  </div>
  <div class="card selectedDay"><div class="eyebrow">DIA SELECIONADO</div><h2>${fmt(selected)}</h2><div class="bigPct">${Math.round(s.pct*100)}%</div><div class="progress"><i style="width:${s.pct*100}%"></i></div><div class="muted">${s.done}/${s.total} metas • ${s.e.length} compromissos</div></div>
  ${section("Metas", s.h.map(h=>habitItem(h,selected)).join("")||"<div class='muted'>Nenhum hábito programado.</div>")}
  ${section("Rotinas", s.r.map(r=>routineItem(r,selected)).join("")||"<div class='muted'>Nenhuma rotina programada.</div>")}
  ${section("Tarefas", s.t.map(taskItem).join("")||empty("Sem tarefas","Adicione uma tarefa para este dia.","Nova tarefa","task"))}
  ${section("Compromissos", s.e.map(eventItem).join("")||empty("Sem compromissos","Seu dia está livre.","Adicionar","event"))}`;
}
function calendarDays(d){
  let first=new Date(d.getFullYear(),d.getMonth(),1),last=new Date(d.getFullYear(),d.getMonth()+1,0),a=[];
  let startDay=first.getDay(),lead=data.settings.weekStart===1?(startDay+6)%7:startDay;
  for(let i=0;i<lead;i++)a.push(null);
  for(let i=1;i<=last.getDate();i++)a.push(new Date(d.getFullYear(),d.getMonth(),i));
  return a;
}
function cell(d){let k=dateKey(d),s=stats(k);return `<button class="calCell ${k===selected?"selectedCell":""} ${k===dateKey()?"todayCell":""}" onclick="selected='${k}';render()"><b>${d.getDate()}</b><span>${Math.round(s.pct*100)}%</span><i style="width:${Math.max(4,s.pct*100)}%"></i></button>`}
function monthMove(n){month=new Date(month.getFullYear(),month.getMonth()+n,1);render()}

/* ---------- PÁGINA: HÁBITOS (hábitos / rotinas / tarefas) ---------- */
function setHabitsTab(t){habitsTab=t;render()}
function habitsHubPage(){
  return `<div class="top"><div><div class="title">Hábitos</div><div class="sub">Gerencie hábitos, rotinas e tarefas</div></div></div>
  <div class="tabs">${[["habits","Hábitos"],["routines","Rotinas"],["tasks","Tarefas"]].map(x=>`<button class="tab ${habitsTab===x[0]?"on":""}" onclick="setHabitsTab('${x[0]}')">${x[1]}</button>`).join("")}</div>
  ${habitsTab==="habits"?habitsListView():habitsTab==="routines"?routinesListView():tasksListView()}`;
}
function habitsListView(){
  let q=habitSearch.trim().toLowerCase();
  let all=data.habits.filter(h=>!h.archived);
  let list=q?all.filter(h=>h.name.toLowerCase().includes(q)||String(h.category||"").toLowerCase().includes(q)):all;
  return `<div class="searchRow"><input class="input" id="habitSearchInput" placeholder="Buscar hábito ou categoria" value="${esc(habitSearch)}" oninput="habitSearch=this.value;render()"></div>
  <div class="actionRow" style="margin:-4px 0 10px;justify-content:flex-end"><button class="secondary small" onclick="openForm('habit')">＋ Novo hábito</button></div>
  ${list.map(h=>`<div class="card"><div class="item" style="padding:0;border:0"><div style="font-size:28px">${esc(h.icon)}</div><div class="itemMain"><div class="itemName">${esc(h.name)}</div><div class="meta">${esc(h.category)} • ${h.frequency==="daily"?"Todos os dias":(h.days||[]).map(x=>DAYS[x]).join(", ")}</div></div><span class="pill">+${h.xp}</span></div><div class="actionRow"><span class="muted">🔥 ${streak(h)}d • 14 dias: ${Math.round(rate(h,14)*100)}%</span><button class="secondary small" onclick="openForm('habit','${h.id}')">Editar</button></div></div>`).join("")||(q?`<div class="card empty"><h3>Nada encontrado</h3><div class="sub">Tente outro termo de busca.</div></div>`:empty("Nenhum hábito","Crie sua primeira meta.","Novo hábito","habit"))}`;
}
function routinesListView(){
  let list=data.routines.filter(r=>!r.archived);
  return `<div class="actionRow" style="margin:0 0 10px;justify-content:flex-end;gap:8px">
    <label class="secondary small" style="display:inline-block;cursor:pointer">Importar rotina<input type="file" accept="application/json" style="display:none" onchange="importRoutineFile(event)"></label>
    <button class="secondary small" onclick="openForm('routine')">＋ Nova rotina</button>
  </div>
  <div class="hint" style="margin:-4px 0 10px">Crie a rotina aqui, toque em "Exportar" no card e depois em "Importar rotina" no outro aparelho para levá-la junto.</div>
  ${list.map(r=>`<div class="card"><div class="item" style="padding:0;border:0"><div style="font-size:28px">📋</div><div class="itemMain"><div class="itemName">${esc(r.name)}</div><div class="meta">${r.items.length} passos • ${r.frequency==="daily"?"Todos os dias":(r.days||[]).map(x=>DAYS[x]).join(", ")||"Todos os dias"} • +${r.xp} XP</div></div></div><div class="actionRow"><span class="muted">Concluída ${data.routineDone.filter(x=>x.routineId===r.id).length}x</span><div style="display:flex;gap:6px"><button class="secondary small" onclick="exportRoutine('${r.id}')">Exportar</button><button class="secondary small" onclick="openForm('routine','${r.id}')">Editar</button></div></div></div>`).join("")||empty("Nenhuma rotina","Crie uma sequência de passos (ex: rotina da manhã).","Nova rotina","routine")}`;
}
function tasksListView(){
  let all=data.tasks.filter(t=>!t.archived);
  let pending=all.filter(t=>!t.completed).sort((a,b)=>(a.due||"").localeCompare(b.due||"")||prioRank(b.priority)-prioRank(a.priority));
  let done=all.filter(t=>t.completed).sort((a,b)=>(b.due||"").localeCompare(a.due||""));
  return `<div class="actionRow" style="margin:0 0 10px;justify-content:flex-end"><button class="secondary small" onclick="openForm('task')">＋ Nova tarefa</button></div>
  <div class="section"><b>Pendentes (${pending.length})</b></div>
  ${pending.map(t=>`<div class="item">${check("",false,`toggleT('${t.id}')`)}<div class="itemMain"><div class="itemName">${esc(t.title)}</div><div class="meta">${fmtShort(t.due)} • ${prioLabel(t.priority)}</div></div><button class="iconBtn" onclick="openForm('task','${t.id}')">✎</button></div>`).join("")||"<div class='muted'>Nenhuma tarefa pendente.</div>"}
  <div class="section"><b>Concluídas (${done.length})</b></div>
  ${done.slice(0,15).map(t=>`<div class="item">${check("",true,`toggleT('${t.id}')`)}<div class="itemMain"><div class="itemName doneText">${esc(t.title)}</div><div class="meta">${fmtShort(t.due)}</div></div><button class="iconBtn" onclick="openForm('task','${t.id}')">✎</button></div>`).join("")||"<div class='muted'>Nenhuma tarefa concluída ainda.</div>"}`;
}

/* ---------- PÁGINA: EVOLUÇÃO (métricas + nível + conquistas + relatório) ---------- */
function setPeriod(n){repPeriod=n;render()}
function evolution(){
  let a=range(7),b=range(7,7),diff=Math.round((a-b)*100),lv=levelInfo(data.xp),period=repPeriod,chartDays=Math.min(period,30);
  let series=[];for(let i=chartDays-1;i>=0;i--){let d=add(new Date(),-i),k=dateKey(d),s=stats(k);series.push({k,label:`${pad(d.getDate())}/${pad(d.getMonth()+1)}`,pct:Math.round(s.pct*100)})}
  let heatDays=Math.min(period,98),ach=achievementsList();
  return `<div class="top"><div><div class="title">Evolução</div><div class="sub">Análise baseada nos seus registros</div></div></div>
  <div class="card analysisHero"><div class="eyebrow">ÚLTIMOS 7 DIAS</div><div class="analysisScore">${Math.round(a*100)}%</div><div class="progress"><i style="width:${a*100}%"></i></div><p class="analysisText">${esc(analysis(7))}</p></div>
  <div class="grid">
    <div class="card stat"><div class="statNum">${Math.round(a*100)}%</div><div class="sub">últimos 7 dias</div></div>
    <div class="card stat"><div class="statNum">${Math.round(b*100)}%</div><div class="sub">7 anteriores</div></div>
    <div class="card stat"><div class="statNum">${diff>0?"+":""}${diff} pp</div><div class="sub">variação</div></div>
    <div class="card stat"><div class="statNum">${data.xp}</div><div class="sub">XP total</div></div>
  </div>
  <div class="section"><b>Nível</b></div>
  <div class="card"><div class="heroGrid"><div class="heroMain"><div style="font-family:var(--font-display);font-size:24px;font-weight:700">Nível ${lv.level} · ${lv.title}</div><div class="progress"><i style="width:${lv.pct*100}%"></i></div><div class="muted">${lv.into}/${lv.per} XP para o próximo nível</div></div><div class="heroLevel">${ring(lv.pct,72,8,"var(--accent)")}<div class="levelLabel"><b>${lv.level}</b><span>NÍVEL</span></div></div></div></div>
  <div class="section"><b>Conquistas</b><span class="muted">${ach.filter(x=>x.unlocked).length}/${ach.length}</span></div>
  <div class="card">${achievementsGrid(ach)}</div>
  <div class="section"><b>Relatório</b><span class="muted">período</span></div>
  <div class="card"><div class="periodChips">${[[7,"7 dias"],[30,"30 dias"],[90,"90 dias"]].map(p=>`<button class="chip ${period===p[0]?"on":""}" onclick="setPeriod(${p[0]})">${p[1]}</button>`).join("")}</div></div>
  <div class="section"><b>Gráfico diário</b><span class="muted">${chartDays} dias${period>chartDays?" (últimos 30)":""}</span></div>
  <div class="card"><div class="barChart">${series.map(x=>`<div class="chartCol"><small>${x.pct}%</small><div class="chartBar" style="height:${Math.max(4,x.pct)}%"></div><span>${x.label}</span></div>`).join("")}</div></div>
  <div class="section"><b>Desempenho por hábito</b><span class="muted">${period} dias</span></div>
  <div class="card">${data.habits.filter(h=>!h.archived).map(h=>`<div class="metricRow"><div><b>${esc(h.name)}</b><small>${Math.round(rate(h,period)*100)}% no período</small></div><div class="miniProgress"><i style="width:${rate(h,period)*100}%"></i></div></div>`).join("")||"<div class='muted'>Crie hábitos para gerar métricas.</div>"}</div>
  <div class="section"><b>Calendário de consistência</b><span class="muted">${heatDays} dias</span></div>
  <div class="card"><div class="heatmap">${Array.from({length:heatDays},(_,i)=>{let d=add(new Date(),-(heatDays-1)+i),k=dateKey(d),s=stats(k);return `<button class="heat ${s.pct>=.8?"h3":s.pct>=.5?"h2":s.pct>0?"h1":""}" title="${k}" onclick="selected='${k}';page='agenda';month=new Date(d.getFullYear(),d.getMonth(),1);render()">${d.getDate()}</button>`}).join("")}</div></div>
  <div class="section"><b>Exportar relatório</b><span class="muted">${period} dias</span></div>
  <div class="card"><p class="sub">Baixe um relatório para analisar sua evolução — sozinho, com alguém, ou com uma IA.</p>
    <div class="reportButtons">
      <button class="reportBtn" onclick="downloadPDF()"><span>📄</span><b>Baixar PDF</b></button>
      <button class="reportBtn" onclick="downloadCSV()"><span>📊</span><b>Baixar CSV (planilha)</b></button>
      <button class="reportBtn" onclick="downloadSummary()"><span>📝</span><b>Baixar resumo em texto</b></button>
    </div>
  </div>`;
}

/* ---------- PÁGINA: PERFIL & CONFIGURAÇÕES ---------- */
function updateSetting(k,v){data.settings[k]=v;save();render()}
function setTheme(t){data.theme=t;save();render()}
function setAccent(id){data.settings.accent=id;save();render()}
function profileSettings(){
  let s=data.settings;
  return `<div class="top"><div><div class="title">Perfil</div><div class="sub">Configurações e preferências</div></div></div>
  <div class="card"><b>Perfil</b>
    <div class="formRow"><label class="label">NOME</label><input class="input" id="settingsNameInput" value="${esc(s.name||"")}" onchange="updateSetting('name',this.value)" placeholder="Como podemos te chamar?"></div>
    <div class="formRow"><label class="label">EMOJI</label><input class="input emojiInput" maxlength="4" value="${esc(s.avatar||"🌟")}" onchange="updateSetting('avatar',this.value)"></div>
  </div>
  <div class="card"><b>Aparência</b>
    <p class="sub">Tema: ${THEME_LABELS[data.theme]||data.theme}</p>
    <div class="segmented">${[["light","Claro"],["dark","Escuro"],["auto","Automático"]].map(t=>`<button class="seg ${data.theme===t[0]?"on":""}" onclick="setTheme('${t[0]}')">${t[1]}</button>`).join("")}</div>
    <p class="sub" style="margin-top:14px">Cor de destaque</p>
    <div class="swatchRow">${ACCENTS.map(c=>`<button class="swatch ${s.accent===c.id?"on":""}" style="background:${c.hex}" onclick="setAccent('${c.id}')" aria-label="${c.id}"></button>`).join("")}</div>
  </div>
  <div class="card"><b>Metas</b>
    <div class="formRow"><label class="label">META DIÁRIA (nº de itens concluídos)</label><input class="input" type="number" min="1" max="20" value="${s.dailyGoal||3}" onchange="updateSetting('dailyGoal',Number(this.value)||3)"></div>
    <label class="label">INÍCIO DA SEMANA</label>
    <div class="segmented"><button class="seg ${s.weekStart===0?"on":""}" onclick="updateSetting('weekStart',0)">Domingo</button><button class="seg ${s.weekStart===1?"on":""}" onclick="updateSetting('weekStart',1)">Segunda</button></div>
  </div>
  <div class="card"><b>🙏 Orações</b><p class="sub">Manhã, antes do almoço, tarde e noite. Edite texto e horário.</p>
    ${data.prayers.map(p=>`<div class="miniRow"><span>${esc(p.name)} • ${esc(p.time)}</span><button class="iconBtn" onclick="openForm('prayer','${p.id}')">✎</button></div>`).join("")}
    <button class="secondary" onclick="openForm('prayer')">＋ Nova oração</button>
  </div>
  <div class="card"><b>📊 Relatório</b><p class="sub">Veja sua evolução e baixe um relatório para análise.</p><button class="secondary" onclick="go('evolution')">Ver evolução e relatório</button></div>
  <div class="card"><b>📦 Dados</b><p class="sub">Tudo fica salvo neste navegador. Faça backup regularmente.</p>
    <div class="actionRow" style="justify-content:flex-start;gap:8px">
      <button class="secondary" onclick="exportData()">Exportar backup</button>
      <label class="secondary" style="display:inline-block;cursor:pointer">Importar backup<input type="file" accept="application/json" style="display:none" onchange="importData(event)"></label>
    </div>
    <button class="dangerBtn" onclick="resetAllData()">Apagar todos os dados</button>
  </div>
  <div class="card"><b>Sobre</b><p class="sub">Habit OS Web • v4 • Feito para funcionar 100% offline, sem conta e sem nuvem.</p></div>`;
}

/* ---------- FORMULÁRIOS ---------- */
function openForm(t,e){modal=t==="habit"?habitForm(e):t==="task"?taskForm(e):t==="event"?eventForm(e):t==="prayer"?prayerForm(e):t==="quick"?quickForm():routineForm(e);render()}
function closeForm(){modal=null;playerRoutine=null;render()}
function daysButtons(sel=[]){return orderedDayDefs().map(d=>`<button type="button" class="day ${sel.includes(d.v)?"sel":""}" data-v="${d.v}" onclick="this.classList.toggle('sel')">${d.l}</button>`).join("")}
function readDays(form){return [...form.querySelectorAll(".day")].filter(x=>x.classList.contains("sel")).map(x=>Number(x.dataset.v))}

function habitForm(e){let h=e?data.habits.find(x=>x.id===e):null;return `<div class="modal"><div class="sheet"><div class="sheetTop"><div class="title">${h?"Editar":"Novo"} hábito</div><button class="close" onclick="closeForm()">Fechar</button></div><form class="form" onsubmit="saveHabit(event,'${e||""}')"><label class="label">NOME</label><input class="input" name="name" value="${esc(h?.name||"")}" required><label class="label">ÍCONE</label><input class="input" name="icon" value="${esc(h?.icon||"✓")}"><label class="label">CATEGORIA</label><input class="input" name="category" value="${esc(h?.category||"Pessoal")}"><label class="label">FREQUÊNCIA</label><select class="select" name="frequency" onchange="this.nextElementSibling.style.display=this.value==='days'?'flex':'none'"><option value="daily" ${h?.frequency!=="days"?"selected":""}>Todos os dias</option><option value="days" ${h?.frequency==="days"?"selected":""}>Dias da semana</option></select><div class="days" style="display:${h?.frequency==="days"?"flex":"none"}">${daysButtons(h?.days||[1,3,5])}</div><label class="label">XP</label><input class="input" type="number" name="xp" min="1" max="1000" value="${h?.xp||10}"><label class="label">DESCRIÇÃO</label><textarea class="input" name="note" rows="3">${esc(h?.note||"")}</textarea><button class="primary">SALVAR</button>${h?`<button type="button" class="dangerBtn" onclick="deleteItem('habit','${h.id}')">EXCLUIR</button>`:""}</form></div></div>`}
function saveHabit(ev,e){ev.preventDefault();let f=new FormData(ev.target),ds=readDays(ev.target),o={name:f.get("name"),icon:f.get("icon")||"✓",category:f.get("category")||"Pessoal",frequency:f.get("frequency"),days:ds,xp:Number(f.get("xp"))||10,note:f.get("note")||"",archived:false};if(e)Object.assign(data.habits.find(h=>h.id===e),o);else data.habits.push({id:uid(),...o});save();closeForm();toast("Hábito salvo")}

function taskForm(e){let t=e?data.tasks.find(x=>x.id===e):null;return `<div class="modal"><div class="sheet"><div class="sheetTop"><div class="title">${t?"Editar":"Nova"} tarefa</div><button class="close" onclick="closeForm()">Fechar</button></div><form class="form" onsubmit="saveTask(event,'${e||""}')"><label class="label">TÍTULO</label><input class="input" name="title" value="${esc(t?.title||"")}" required><label class="label">DATA</label><input class="input" name="due" type="date" value="${t?.due||selected}" required><label class="label">PRIORIDADE</label><select class="select" name="priority"><option ${t?.priority==="low"?"selected":""} value="low">Baixa</option><option ${!t||t.priority==="medium"?"selected":""} value="medium">Média</option><option ${t?.priority==="high"?"selected":""} value="high">Alta</option></select><label class="label">NOTAS</label><textarea class="input" name="note" rows="3">${esc(t?.note||"")}</textarea><button class="primary">SALVAR</button>${t?`<button type="button" class="dangerBtn" onclick="deleteItem('task','${t.id}')">EXCLUIR</button>`:""}</form></div></div>`}
function saveTask(ev,e){ev.preventDefault();let f=new FormData(ev.target),old=e?data.tasks.find(t=>t.id===e):null,o={title:f.get("title"),due:f.get("due"),priority:f.get("priority"),note:f.get("note")||"",completed:old?.completed||false,archived:false};if(old)Object.assign(old,o);else data.tasks.push({id:uid(),...o});save();closeForm();toast("Tarefa salva")}

function eventForm(e){let x=e?data.events.find(a=>a.id===e):null;return `<div class="modal"><div class="sheet"><div class="sheetTop"><div class="title">${x?"Editar":"Novo"} compromisso</div><button class="close" onclick="closeForm()">Fechar</button></div><form class="form" onsubmit="saveEvent(event,'${e||""}')"><label class="label">TÍTULO</label><input class="input" name="title" value="${esc(x?.title||"")}" placeholder="Estudo, treino, consulta..." required><label class="label">DATA</label><input class="input" name="date" type="date" value="${x?.date||selected}" required><label class="label">HORÁRIO</label><input class="input" name="time" type="time" value="${x?.time||"08:00"}"><label class="label">CATEGORIA</label><input class="input" name="category" value="${esc(x?.category||"Agenda")}"><label class="label">NOTAS</label><textarea class="input" name="notes" rows="3">${esc(x?.notes||"")}</textarea><button class="primary">SALVAR</button>${x?`<button type="button" class="dangerBtn" onclick="deleteItem('event','${x.id}')">EXCLUIR</button>`:""}</form></div></div>`}
function saveEvent(ev,e){ev.preventDefault();let f=new FormData(ev.target),o={title:f.get("title"),date:f.get("date"),time:f.get("time"),category:f.get("category"),notes:f.get("notes"),archived:false};if(e)Object.assign(data.events.find(x=>x.id===e),o);else data.events.push({id:uid(),...o});save();closeForm();toast("Compromisso salvo")}

function prayerForm(e){let p=e?data.prayers.find(x=>x.id===e):null;return `<div class="modal"><div class="sheet"><div class="sheetTop"><div class="title">${p?"Editar":"Nova"} oração</div><button class="close" onclick="closeForm()">Fechar</button></div><form class="form" onsubmit="savePrayer(event,'${e||""}')"><label class="label">NOME</label><input class="input" name="name" value="${esc(p?.name||"")}" required><label class="label">HORÁRIO</label><input class="input" type="time" name="time" value="${p?.time||"12:00"}" required><label class="label">TEXTO</label><textarea class="input" name="text" rows="9" required>${esc(p?.text||"")}</textarea><label class="switchRow"><input type="checkbox" name="active" ${p?.active!==false?"checked":""}> Mostrar na rotina diária</label><button class="primary">SALVAR</button>${p?`<button type="button" class="dangerBtn" onclick="deleteItem('prayer','${p.id}')">EXCLUIR</button>`:""}</form></div></div>`}
function savePrayer(ev,e){ev.preventDefault();let f=new FormData(ev.target),o={name:f.get("name"),time:f.get("time"),text:f.get("text"),active:f.get("active")==="on"};if(e)Object.assign(data.prayers.find(x=>x.id===e),o);else data.prayers.push({id:uid(),...o});save();closeForm();toast("Oração salva")}

function parseItems(text,oldItems=[]){let used=new Set();return String(text).split(",").map(t=>t.trim()).filter(Boolean).map(title=>{let m=oldItems.find(o=>!used.has(o.id)&&o.title.trim().toLowerCase()===title.toLowerCase());if(m){used.add(m.id);return {id:m.id,title}}return {id:uid(),title}})}
function routineForm(e){let r=e?data.routines.find(x=>x.id===e):null;return `<div class="modal"><div class="sheet"><div class="sheetTop"><div class="title">${r?"Editar":"Nova"} rotina</div><button class="close" onclick="closeForm()">Fechar</button></div><form class="form" onsubmit="saveRoutine(event,'${e||""}')"><label class="label">NOME</label><input class="input" name="name" value="${esc(r?.name||"")}" required><label class="label">PASSOS</label><textarea class="input" name="items" rows="6">${esc(r?.items?.map(x=>x.title).join(", ")||"Acordar, Beber água, Arrumar a cama")}</textarea><div class="hint">Separe os passos por vírgula.</div><label class="label">FREQUÊNCIA</label><select class="select" name="frequency" onchange="this.nextElementSibling.style.display=this.value==='days'?'flex':'none'"><option value="daily" ${r?.frequency!=="days"?"selected":""}>Todos os dias</option><option value="days" ${r?.frequency==="days"?"selected":""}>Dias da semana</option></select><div class="days" style="display:${r?.frequency==="days"?"flex":"none"}">${daysButtons(r?.days||[])}</div><label class="label">XP AO CONCLUIR</label><input class="input" type="number" name="xp" min="1" max="500" value="${r?.xp||(r?.items?.length||3)*5}"><button class="primary">SALVAR</button>${r?`<button type="button" class="secondary" style="margin-top:8px;width:100%" onclick="exportRoutine('${r.id}')">⭳ EXPORTAR PARA OUTRO APARELHO</button><button type="button" class="dangerBtn" onclick="deleteItem('routine','${r.id}')">EXCLUIR</button>`:""}</form></div></div>`}
function saveRoutine(ev,e){ev.preventDefault();let f=new FormData(ev.target),ds=readDays(ev.target),old=e?data.routines.find(x=>x.id===e):null,items=parseItems(f.get("items"),old?.items||[]),o={name:f.get("name"),items,frequency:f.get("frequency"),days:ds,xp:Number(f.get("xp"))||items.length*5,archived:false};if(old)Object.assign(old,o);else data.routines.push({id:uid(),...o});save();closeForm();toast("Rotina salva")}

/* ---------- EXPORTAR / IMPORTAR UMA ROTINA (levar de um aparelho para outro) ---------- */
function exportRoutine(id){
  let r=data.routines.find(x=>x.id===id);if(!r)return;
  let payload={type:"habit-os-routine",version:1,routine:{name:r.name,items:r.items.map(i=>({title:i.title})),frequency:r.frequency,days:r.days,xp:r.xp}};
  downloadBlob(`habit-os-rotina-${slugify(r.name)}.json`,JSON.stringify(payload,null,2),"application/json");
  toast("Rotina exportada");
}
function importRoutineFile(ev){
  let file=ev.target.files[0];if(!file)return;
  let reader=new FileReader();
  reader.onload=()=>{
    try{
      let obj=JSON.parse(reader.result),list=[];
      if(obj&&obj.type==="habit-os-routine"&&obj.routine)list=[obj.routine];
      else if(obj&&Array.isArray(obj.routines))list=obj.routines;
      else if(obj&&obj.name&&Array.isArray(obj.items))list=[obj];
      if(!list.length){toast("Arquivo inválido");ev.target.value="";return}
      if(!confirm(list.length>1?`Importar ${list.length} rotinas para este dispositivo?`:`Importar a rotina "${list[0].name}" para este dispositivo?`)){ev.target.value="";return}
      list.forEach(r=>data.routines.push({
        id:uid(),
        name:r.name||"Rotina importada",
        items:(r.items||[]).map(i=>({id:uid(),title:(i&&i.title)||String(i)})),
        frequency:r.frequency==="days"?"days":"daily",
        days:Array.isArray(r.days)?r.days:[],
        xp:Number(r.xp)||((r.items||[]).length*5)||10,
        archived:false,
      }));
      save();render();toast(list.length>1?`${list.length} rotinas importadas`:"Rotina importada");
    }catch(err){toast("Arquivo inválido")}
    ev.target.value="";
  };
  reader.readAsText(file);
}

function quickForm(){return `<div class="modal"><div class="sheet"><div class="sheetTop"><div class="title">Adicionar</div><button class="close" onclick="closeForm()">Fechar</button></div><div class="quickGrid">${[["✓","Hábito","habit"],["□","Tarefa","task"],["◷","Compromisso","event"],["◈","Rotina","routine"],["🙏","Oração","prayer"]].map(x=>`<button class="quick" onclick="openForm('${x[2]}')"><span>${x[0]}</span><b>${x[1]}</b></button>`).join("")}</div></div></div>`}

/* ---------- AÇÕES ---------- */
function toggleH(id,k=dateKey()){let i=data.completions.findIndex(x=>x.habitId===id&&x.date===k),h=data.habits.find(x=>x.id===id);if(i>=0){data.xp=Math.max(0,data.xp-(data.completions[i].xp||h.xp));data.completions.splice(i,1)}else{data.completions.push({habitId:id,date:k,xp:h.xp});data.xp+=h.xp}save();checkAchievements();render()}
function toggleP(id){let k=dateKey(),i=data.prayerDone.findIndex(x=>x.prayerId===id&&x.date===k);if(i>=0)data.prayerDone.splice(i,1);else{data.prayerDone.push({prayerId:id,date:k});data.xp+=5}save();checkAchievements();render()}
function toggleT(id){let t=data.tasks.find(x=>x.id===id);t.completed=!t.completed;save();checkAchievements();render()}
function toggleRoutineStep(rid,sid,k=dateKey()){
  let i=data.routineSteps.findIndex(x=>x.routineId===rid&&x.stepId===sid&&x.date===k);
  if(i>=0)data.routineSteps.splice(i,1);else data.routineSteps.push({routineId:rid,stepId:sid,date:k});
  let r=data.routines.find(x=>x.id===rid);
  if(r){
    let allDone=r.items.length>0&&r.items.every(s=>stepDone(rid,s.id,k)),wasDone=doneR(rid,k);
    if(allDone&&!wasDone){let xp=r.xp||r.items.length*5;data.routineDone.push({routineId:rid,date:k,xp});data.xp+=xp}
    else if(!allDone&&wasDone){let entry=data.routineDone.find(x=>x.routineId===rid&&x.date===k);if(entry)data.xp=Math.max(0,data.xp-(entry.xp||0));data.routineDone=data.routineDone.filter(x=>!(x.routineId===rid&&x.date===k))}
  }
  save();checkAchievements();render();
}
function deleteItem(type,id){
  if(!confirm("Excluir este item?"))return;
  let m={habit:"habits",task:"tasks",event:"events",prayer:"prayers",routine:"routines"}[type];
  data[m]=data[m].filter(x=>x.id!==id);
  if(type==="habit")data.completions=data.completions.filter(x=>x.habitId!==id);
  if(type==="prayer")data.prayerDone=data.prayerDone.filter(x=>x.prayerId!==id);
  if(type==="routine"){data.routineSteps=data.routineSteps.filter(x=>x.routineId!==id);data.routineDone=data.routineDone.filter(x=>x.routineId!==id)}
  save();closeForm();
}

/* ---------- MODO GUIADO DE ROTINA ---------- */
function openRoutinePlayer(id){playerRoutine=id;playerIndex=0;modal="player";render()}
function routinePlayerView(){
  let r=data.routines.find(x=>x.id===playerRoutine);
  if(!r||!r.items.length){modal=null;return "";}
  let k=dateKey(),step=r.items[playerIndex],isLast=playerIndex===r.items.length-1,isDone=stepDone(r.id,step.id,k);
  return `<div class="modal"><div class="sheet player"><div class="sheetTop"><div class="title">${esc(r.name)}</div><button class="close" onclick="closeForm()">Fechar</button></div>
  <div class="routineStep"><div class="routineIcon">${isDone?"✅":"📋"}</div><div class="routineTitle">${esc(step.title)}</div><div class="muted">Passo ${playerIndex+1} de ${r.items.length}</div></div>
  <div class="playerDots">${r.items.map((s,i)=>`<span class="dot ${i===playerIndex?"on":""} ${stepDone(r.id,s.id,k)?"done":""}"></span>`).join("")}</div>
  <div class="playerNav"><button class="secondary" ${playerIndex===0?"disabled":""} onclick="playerMove(-1)">‹ Voltar</button><button class="primary" onclick="playerComplete()">${isLast?"Concluir rotina":"Concluir e avançar"}</button></div>
  </div></div>`;
}
function playerMove(n){let r=data.routines.find(x=>x.id===playerRoutine);if(!r)return;playerIndex=Math.max(0,Math.min(r.items.length-1,playerIndex+n));render()}
function playerComplete(){
  let r=data.routines.find(x=>x.id===playerRoutine);if(!r)return;
  let step=r.items[playerIndex],k=dateKey();
  if(!stepDone(r.id,step.id,k))toggleRoutineStep(r.id,step.id,k);
  if(playerIndex<r.items.length-1){playerIndex++;render()}else{toast("Rotina concluída! 🎉");modal=null;render()}
}

/* ---------- DADOS: EXPORTAR / IMPORTAR / RESET ---------- */
function exportData(){let b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`habit-os-backup-${dateKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function importData(ev){
  let file=ev.target.files[0];if(!file)return;
  let reader=new FileReader();
  reader.onload=()=>{
    try{
      let obj=JSON.parse(reader.result);
      if(!confirm("Importar este backup vai substituir os dados atuais. Continuar?")){ev.target.value="";return}
      data={...clone(INITIAL),...obj,prayers:obj.prayers||PRAYERS,settings:{...clone(DEFAULT_SETTINGS),...(obj.settings||{})},routineSteps:obj.routineSteps||[],routineDone:obj.routineDone||[],seenAchievements:obj.seenAchievements||[]};
      save();render();toast("Backup importado");
    }catch(err){toast("Arquivo inválido")}
    ev.target.value="";
  };
  reader.readAsText(file);
}
function resetAllData(){
  if(!confirm("Isso vai apagar TODOS os seus hábitos, tarefas, rotinas e histórico. Deseja continuar?"))return;
  if(!confirm("Tem certeza? Essa ação não pode ser desfeita."))return;
  localStorage.removeItem(KEY);
  data=clone(INITIAL);
  save();render();toast("Dados apagados");
}

/* ---------- RELATÓRIO ---------- */
function buildReport(period){
  let days=[];
  for(let i=period-1;i>=0;i--){let d=add(new Date(),-i),k=dateKey(d),s=stats(k);days.push({k,pct:s.pct,done:s.done,total:s.total})}
  let totalDone=days.reduce((a,d)=>a+d.done,0),totalPossible=days.reduce((a,d)=>a+d.total,0),pctOverall=totalPossible?totalDone/totalPossible:0;
  let xpEarned=data.completions.filter(c=>days.some(d=>d.k===c.date)).reduce((a,c)=>a+(c.xp||0),0)
    +data.prayerDone.filter(p=>days.some(d=>d.k===p.date)).length*5
    +data.routineDone.filter(r=>days.some(d=>d.k===r.date)).reduce((a,r)=>a+(r.xp||0),0);
  let tasksInPeriod=data.tasks.filter(t=>days.some(d=>d.k===t.due)),tasksDone=tasksInPeriod.filter(t=>t.completed).length;
  let habitRows=data.habits.filter(h=>!h.archived).map(h=>({name:h.name,category:h.category,rate:rate(h,period),streak:streak(h),xp:data.completions.filter(c=>c.habitId===h.id&&days.some(d=>d.k===c.date)).reduce((a,c)=>a+(c.xp||0),0)}));
  let prayerRate=prayers().length?(data.prayerDone.filter(p=>days.some(d=>d.k===p.date)).length/(prayers().length*period)):0;
  return {period,days,totalDone,totalPossible,pctOverall,xpEarned,tasksInPeriod:tasksInPeriod.length,tasksDone,habitRows,prayerRate,generated:new Date()};
}
function csvEsc(v){v=String(v??"");return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function downloadBlob(name,content,type){let b=new Blob([content],{type}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function downloadCSV(){
  let r=buildReport(repPeriod),lines=[];
  lines.push("Relatório Habit OS");
  lines.push(`Período,Últimos ${r.period} dias`);
  lines.push(`Gerado em,${fmtDateTime(r.generated)}`);
  lines.push("");
  lines.push(["Data","Cumprido","Total","Percentual"].join(","));
  r.days.forEach(d=>lines.push([d.k,d.done,d.total,Math.round(d.pct*100)+"%"].join(",")));
  lines.push("");
  lines.push(["Hábito","Categoria","Taxa no período","Sequência atual","XP no período"].join(","));
  r.habitRows.forEach(h=>lines.push([csvEsc(h.name),csvEsc(h.category),Math.round(h.rate*100)+"%",h.streak,h.xp].join(",")));
  downloadBlob(`habit-os-relatorio-${dateKey()}.csv`,lines.join("\n"),"text/csv;charset=utf-8");
  toast("CSV baixado");
}
function downloadSummary(){
  let r=buildReport(repPeriod),lv=levelInfo(data.xp),lines=[];
  lines.push(`RELATÓRIO HABIT OS — Últimos ${r.period} dias`);
  lines.push(`Gerado em ${fmtDateTime(r.generated)}`);
  lines.push("");
  lines.push(`Cumprimento geral: ${Math.round(r.pctOverall*100)}% (${r.totalDone}/${r.totalPossible} metas)`);
  lines.push(`XP ganho no período: ${r.xpEarned} • XP total: ${data.xp} • Nível ${lv.level} (${lv.title})`);
  lines.push(`Tarefas: ${r.tasksDone}/${r.tasksInPeriod} concluídas`);
  lines.push(`Orações: ${Math.round(r.prayerRate*100)}% de cumprimento`);
  lines.push("");
  lines.push("Desempenho por hábito:");
  r.habitRows.forEach(h=>lines.push(`- ${h.name} (${h.category}): ${Math.round(h.rate*100)}% no período, sequência atual de ${h.streak} dias, ${h.xp} XP`));
  lines.push("");
  lines.push("Histórico diário:");
  r.days.forEach(d=>lines.push(`${d.k}: ${d.done}/${d.total} (${Math.round(d.pct*100)}%)`));
  lines.push("");
  lines.push("Peça para uma IA analisar este resumo e sugerir ajustes na rotina.");
  downloadBlob(`habit-os-resumo-${dateKey()}.txt`,lines.join("\n"),"text/plain;charset=utf-8");
  toast("Resumo baixado");
}
function downloadPDF(){
  let r=buildReport(repPeriod),lv=levelInfo(data.xp);
  let html=`<h1>Relatório Habit OS</h1><p class="pMeta">Últimos ${r.period} dias • Gerado em ${fmtDateTime(r.generated)}</p>
  <div class="pStats">
    <div><b>${Math.round(r.pctOverall*100)}%</b><span>cumprimento geral</span></div>
    <div><b>${r.xpEarned}</b><span>XP no período</span></div>
    <div><b>Nv. ${lv.level}</b><span>${lv.title}</span></div>
    <div><b>${r.tasksDone}/${r.tasksInPeriod}</b><span>tarefas concluídas</span></div>
  </div>
  <h2>Desempenho por hábito</h2>
  <table><thead><tr><th>Hábito</th><th>Categoria</th><th>Taxa</th><th>Sequência</th><th>XP</th></tr></thead><tbody>
  ${r.habitRows.map(h=>`<tr><td>${esc(h.name)}</td><td>${esc(h.category)}</td><td>${Math.round(h.rate*100)}%</td><td>${h.streak}d</td><td>${h.xp}</td></tr>`).join("")}
  </tbody></table>
  <h2>Histórico diário</h2>
  <table><thead><tr><th>Data</th><th>Cumprido</th><th>Total</th><th>%</th></tr></thead><tbody>
  ${r.days.map(d=>`<tr><td>${d.k}</td><td>${d.done}</td><td>${d.total}</td><td>${Math.round(d.pct*100)}%</td></tr>`).join("")}
  </tbody></table>`;
  let area=document.getElementById("printArea");
  if(area)area.innerHTML=html;
  window.print();
}

/* ---------- BOOT ---------- */
if("serviceWorker"in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{});
if(window.matchMedia)window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if(data.theme==="auto")render()});
window.addEventListener("afterprint",()=>{let a=document.getElementById("printArea");if(a)a.innerHTML=""});
render();
