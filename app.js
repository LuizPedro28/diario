const KEY="rotina_v2";
const defaultData={
  name:"", waterGoal:2500, water:{}, habits:[
    {id:"teeth",title:"Escovar os dentes",note:"Manhã e noite",done:false},
    {id:"college",title:"Faculdade",note:"08:00",done:false},
    {id:"home",title:"Ajudar em casa",note:"13:00–13:40",done:false},
    {id:"gym",title:"Academia",note:"Seg, Ter, Qua, Sex e Sáb",done:false},
    {id:"senai",title:"SENAI",note:"18:40–22:00",done:false},
    {id:"night",title:"Preparar para dormir",note:"Desacelerar à noite",done:false}
  ], tasks:[], mood:"", journal:{}, faith:{}
};
let data=JSON.parse(localStorage.getItem(KEY)||"null")||defaultData;
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const dateKey=()=>new Date().toISOString().slice(0,10);
const todayKey=dateKey();
if(!data.water[todayKey]) data.water[todayKey]=[];
if(!data.journal[todayKey]) data.journal[todayKey]={};
if(!data.faith[todayKey]) data.faith[todayKey]={};

const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function fmtDate(){return new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"2-digit",month:"long"}).format(new Date())}
function greeting(){const h=new Date().getHours();return h<12?"Bom dia! 👋":h<18?"Boa tarde! ☀️":"Boa noite! 🌙"}
function waterTotal(){return data.water[todayKey].reduce((a,b)=>a+b,0)}
function waterPct(){return Math.min(100,Math.round(waterTotal()/data.waterGoal*100))}
function renderHeader(){$("#greeting").textContent=(data.name?`Olá, ${data.name}! `:"")+greeting().replace("!","!");$("#today").textContent=fmtDate();$("#dateLabel").textContent=fmtDate()}
function timeline(){
 const items=[
  ["05:30","☀️ Acordar","Sinal da Cruz + pequena oração"],
  ["06:20","🚌 Ônibus","Deslocamento para a faculdade"],
  ["07:40","🎓 Preparar para aula","Respirar, organizar material"],
  ["08:00","📚 Faculdade","Aulas"],
  ["11:10 / 12:30","🍛 Almoço","Dependendo do horário de saída"],
  ["13:00","🏠 Ajudar em casa","Louça, chão e organização"],
  ["14:00","🚲 Academia","Bike ~4 km + treino (exceto quinta e domingo)"],
  ["15:40","🍎 Café da tarde","Comer e descansar"],
  ["16:30","📿 Terço","Enquanto se arruma; termina geralmente na van"],
  ["17:50","🚐 Saída para SENAI","Deslocamento"],
  ["18:40","🏫 SENAI","Aula"],
  ["20:15","🍽️ Intervalo + jantar","Uma pequena pausa"],
  ["20:35","📚 SENAI","Aula até 22:00"],
  ["22:00","🚐 Volta","Deslocamento para casa"],
  ["23:00","🌙 Rotina noturna","Banho, mochila, diário e oração"],
  ["00:00","😴 Dormir","Descanso"]
 ];
 const now=new Date(), mins=now.getHours()*60+now.getMinutes();
 const parse=s=>{const m=s.match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):0};
 $("#timeline").innerHTML=items.map((x,i)=>{
   const n=parse(x[0].replace(" / 12:30","")); let current=mins>=n && (i===items.length-1||mins<parse(items[i+1][0].replace(" / 12:30","")));
   return `<div class="timeline-item ${current?"current":""}">
    <div class="timeline-dot"></div><div class="timeline-time">${x[0]}</div>
    <div class="timeline-title">${x[1]}</div><div class="timeline-note">${x[2]}</div>
   </div>`
 }).join("");
 let next=items.find(x=>parse(x[0].replace(" / 12:30",""))>mins);
 $("#nextActivity").textContent=next?`Próximo: ${next[1]} — ${next[0]}`:"Você chegou ao fim da rotina. 🌙";
}
function renderWater(){
 const total=waterTotal(), pct=waterPct();
 $("#waterAmount").textContent=total.toLocaleString("pt-BR");$("#waterGoal").textContent=data.waterGoal.toLocaleString("pt-BR");
 $("#waterGoalMini").textContent=data.waterGoal+" ml";$("#waterMini").textContent=total+" ml";$("#waterPercent").textContent=pct+"%";
 $("#waterFill").style.height=pct+"%";$("#waterMiniBar").style.width=pct+"%";
 $("#waterLog").innerHTML=data.water[todayKey].length?data.water[todayKey].map((v,i)=>`<span>💧 ${v} ml <button onclick="removeWater(${i})" style="border:0;background:none;cursor:pointer">×</button></span>`).join(""):"<span class='muted'>Nenhum registro ainda.</span>";
}
window.removeWater=i=>{data.water[todayKey].splice(i,1);save();renderAll()}
function addWater(v){if(!v||v<1)return;data.water[todayKey].push(Number(v));save();renderAll();toast(`💧 +${v} ml`);if(waterPct()>=100){document.querySelector(".water-card").classList.add("celebrate");toast("🎉 Meta de água atingida!")}}
$$("[data-water]").forEach(b=>b.onclick=()=>addWater(b.dataset.water));
$("#addCustomWater").onclick=()=>{addWater($("#customWater").value);$("#customWater").value=""};
$("#resetWater").onclick=()=>{if(confirm("Zerar a água de hoje?")){data.water[todayKey]=[];save();renderAll()}};

function renderHabits(){
 const day=new Date().getDay(); // 0 domingo, 4 quinta
 const gymAllowed=day!==0&&day!==4;
 $("#habitList").innerHTML=data.habits.map(h=>{
   const disabled=h.id==="gym"&&!gymAllowed;
   return `<div class="habit ${h.done?"done":""}">
    <button class="check" onclick="toggleHabit('${h.id}')" ${disabled?"disabled":""}>${h.done?"✓":""}</button>
    <div class="habit-main"><div class="habit-title">${h.title}${disabled?" — descanso":""}</div><div class="habit-note">${h.note}</div></div>
    <div class="habit-actions"><button onclick="deleteHabit('${h.id}')">🗑️</button></div>
   </div>`
 }).join("");
}
window.toggleHabit=id=>{const h=data.habits.find(x=>x.id===id);if(h){h.done=!h.done;save();renderAll();toast(h.done?"✨ Hábito concluído!":"Hábito desmarcado")}}
window.deleteHabit=id=>{data.habits=data.habits.filter(x=>x.id!==id);save();renderAll()}
function renderTasks(){
 $("#taskList").innerHTML=(data.tasks.length?data.tasks:[]).map(t=>`<div class="task ${t.done?"done":""}">
 <button class="check" onclick="toggleTask('${t.id}')">${t.done?"✓":""}</button><div class="habit-main"><div class="habit-title">${t.title}</div></div><button class="habit-actions" onclick="deleteTask('${t.id}')">🗑️</button></div>`).join("")||`<div class="card"><span class="muted">Nenhuma tarefa extra hoje. Use isso para não sobrecarregar seu dia. 🙂</span></div>`;
}
window.toggleTask=id=>{const t=data.tasks.find(x=>x.id===id);if(t){t.done=!t.done;save();renderAll()}}
window.deleteTask=id=>{data.tasks=data.tasks.filter(x=>x.id!==id);save();renderAll()}

function renderFaith(){
 const f=data.faith[todayKey];
 $("#moodMini").textContent=data.mood||"Como você está hoje?";
 $("#moodResult").textContent=data.mood?`Hoje você marcou: ${data.mood}`:"";
 $("#mindDump").value=data.journal[todayKey]?.mind||"";
 $("#gratitude").value=data.journal[todayKey]?.gratitude||"";
 $("#tomorrow").value=data.journal[todayKey]?.tomorrow||"";
 $("#gospel").value=data.journal[todayKey]?.gospel||"";
}
$$("[data-mood]").forEach(b=>b.onclick=()=>{data.mood=b.dataset.mood;save();renderAll();toast("🧠 Check-in salvo")});
$("#saveJournal").onclick=()=>{data.journal[todayKey]={...(data.journal[todayKey]||{}),mind:$("#mindDump").value,gratitude:$("#gratitude").value,tomorrow:$("#tomorrow").value};save();toast("📝 Diário salvo")};
$("#saveGospel").onclick=()=>{data.journal[todayKey]={...(data.journal[todayKey]||{}),gospel:$("#gospel").value};save();toast("📖 Reflexão salva")};
$$("[data-complete]").forEach(b=>b.onclick=()=>{data.faith[todayKey][b.dataset.complete]=true;save();b.textContent="✓ Registrado";b.disabled=true;toast("🙏 Momento registrado")});

function dayProgress(){
 const habits=data.habits.filter(h=>!(h.id==="gym"&&(new Date().getDay()===0||new Date().getDay()===4)));
 const completed=habits.filter(h=>h.done).length;
 const tasks=data.tasks.filter(t=>t.done).length;
 const faith=Object.values(data.faith[todayKey]||{}).filter(Boolean).length;
 const total=habits.length+data.tasks.length+3;
 const done=completed+tasks+Math.min(faith,3);
 return total?Math.round(done/total*100):0;
}
function renderProgress(){
 const p=dayProgress();$("#dayProgress").textContent=p+"%";$("#ringText").textContent=p+"%";$("#dayProgressBar").style.width=p+"%";$("#ring").style.background=`conic-gradient(var(--accent) ${p*3.6}deg,var(--line) 0deg)`;
}
function renderAll(){renderHeader();timeline();renderWater();renderHabits();renderTasks();renderFaith();renderProgress()}
$$(".tab").forEach(tab=>tab.onclick=()=>{ $$(".tab").forEach(x=>x.classList.remove("active"));tab.classList.add("active");$$(".section").forEach(x=>x.classList.remove("active"));$("#"+tab.dataset.section).classList.add("active")});
$$("[data-jump]").forEach(b=>b.onclick=()=>{const target=b.dataset.jump;document.querySelector(`[data-section="${target}"]`).click()});

let modalType="";
function openModal(type){modalType=type;$("#modalTitle").textContent=type==="habit"?"Novo hábito":"Nova tarefa";$("#modalInput").placeholder=type==="habit"?"Ex.: Ler 10 minutos":"Ex.: Comprar material";$("#modalInput").value="";$("#modal").classList.remove("hidden");$("#modalInput").focus()}
$("#addHabitBtn").onclick=()=>openModal("habit");$("#addTaskBtn").onclick=()=>openModal("task");
$("#closeModal").onclick=$("#cancelModal").onclick=()=>$("#modal").classList.add("hidden");
$("#modalForm").onsubmit=e=>{e.preventDefault();const title=$("#modalInput").value.trim();if(!title)return;if(modalType==="habit")data.habits.push({id:crypto.randomUUID(),title,note:"Personalizado",done:false});else data.tasks.push({id:crypto.randomUUID(),title,done:false});save();$("#modal").classList.add("hidden");renderAll();toast("✨ Adicionado!")};

$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("theme",document.body.classList.contains("dark")?"dark":"light")};
if(localStorage.getItem("theme")==="dark")document.body.classList.add("dark");

$("#waterGoalInput").value=data.waterGoal;$("#nameInput").value=data.name;
$("#saveSettings").onclick=()=>{data.waterGoal=Math.max(500,Number($("#waterGoalInput").value)||2500);data.name=$("#nameInput").value.trim();save();renderAll();toast("⚙️ Configurações salvas")};

let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").hidden=false});
$("#installBtn").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").hidden=true};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));

renderAll();
