/**
 * Ravenhollow Ghost Rhythm Duel — original browser-only arcade game.
 * Four rune lanes, an optional unhurried practice mode and a timed spell duel.
 * WebAudio tones are synthesized on demand; no songs, audio files or network.
 */
const $=selector=>document.querySelector(selector);
const root=$("#duel-game");
const laneButtons=[...root.querySelectorAll("[data-duel-lane]")];
const symbols=["☾","✦","❖","✶"];
const notesHz=[261.63,329.63,392.00,523.25];
const settings={practice:{count:12,interval:0},duel:{count:16,interval:880}};
const bestKey=mode=>"ravenhollow-duel-best-"+mode;
let mode="practice",state="idle",sequence=[],index=0,score=0,combo=0,health=5,hits=0,misses=0,peak=0;
let startAt=0,pausedAt=0,frame=0,lastCue=-1,audio=null,muted=true;
const start=$("#duel-start"),pauseButton=$("#duel-pause"),resetButton=$("#duel-restart");
const feedback=$("#duel-feedback"),status=$("#duel-status");
const soundButton=$("#duel-sound");
const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function readBest(){
  try{const n=Number(localStorage.getItem(bestKey(mode)));return Number.isSafeInteger(n)&&n>=0&&n<=30000?n:0;}
  catch(_){return 0;}
}
function saveBest(value){
  try{if(value>readBest())localStorage.setItem(bestKey(mode),String(value));}catch(_){}
}
function playTone(lane,good=true){
  if(muted)return;
  try{
    const Ctor=window.AudioContext||window.webkitAudioContext;
    if(!Ctor)return;
    audio??=new Ctor();
    if(audio.state==="suspended")audio.resume().catch(()=>{});
    const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
    osc.type=good?"sine":"triangle";
    osc.frequency.setValueAtTime(good?notesHz[lane]:180,t);
    if(good)osc.frequency.exponentialRampToValueAtTime(notesHz[lane]*1.5,t+.15);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(.055,t+.02);
    gain.gain.exponentialRampToValueAtTime(.0001,t+.22);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);osc.stop(t+.23);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }catch(_){}
}
function say(message){feedback.textContent=message;}
function readStats(){
  $("#duel-score").textContent=String(score);
  $("#duel-combo").textContent=String(combo);
  $("#duel-health").textContent="❤".repeat(health)+"♡".repeat(5-health);
  $("#duel-progress").textContent=index+"/"+sequence.length;
  $("#duel-best").textContent=String(readBest());
  $("#duel-ghost-health").style.width=((1-index/Math.max(1,sequence.length))*100)+"%";
  $("#duel-ghost-health").setAttribute("aria-valuenow",String(sequence.length-index));
  root.dataset.score=String(score);
  root.dataset.combo=String(combo);
  root.dataset.index=String(index);
  root.dataset.health=String(health);
  root.dataset.hits=String(hits);
  root.dataset.misses=String(misses);
}
function paint(){
  root.dataset.mode=mode;
  root.dataset.state=state;
  const active=state==="running" && index<sequence.length;
  root.dataset.currentLane=active?String(sequence[index]):"";
  laneButtons.forEach((button,i)=>{
    const chosen=active&&sequence[index]===i;
    button.classList.toggle("duel-target",chosen);
    button.disabled=!active;
    button.setAttribute("aria-pressed",String(chosen));
  });
  status.textContent=state==="idle"?"SẴN SÀNG":state==="running"?"ĐANG ĐẤU":state==="paused"?"TẠM DỪNG":"KẾT THÚC";
  start.disabled=state==="running"||state==="paused";
  pauseButton.disabled=state==="idle"||state==="finished";
  pauseButton.textContent=state==="paused"?"▶ TIẾP TỤC":"Ⅱ TẠM DỪNG";
  $("#duel-relic").textContent=active?symbols[sequence[index]]:"✦";
  $("#duel-mode-note").textContent=mode==="duel"?"ĐẤU NHỊP · 16 ẤN CHÚ":"LUYỆN TẬP · 12 ẤN CHÚ";
  readStats();
}
function cancelLoop(){if(frame)cancelAnimationFrame(frame);frame=0;}
function reset(){
  cancelLoop();state="idle";sequence=[];index=score=combo=hits=misses=peak=0;health=5;startAt=pausedAt=0;lastCue=-1;
  root.style.setProperty("--duel-flight","0%");
  $("#duel-result").hidden=true;
  root.classList.remove("duel-hit","duel-miss");
  say("✦ Chọn chế độ, bắt đầu rồi bấm đúng ấn chú bằng phím 1–4 hoặc chạm.");
  $("#duel-best").textContent=String(readBest());
  paint();
}
function end(){
  cancelLoop();state="finished";
  saveBest(score);
  $("#duel-result").hidden=false;
  const won=health>0&&index===sequence.length;
  root.dataset.result=won?"won":"lost";
  $("#duel-result-title").textContent=won?"✦ HỒN MA ĐÃ ĐƯỢC GIẢI PHONG ẤN!":"☽ PHÉP THUẬT BỊ GIÁN ĐOẠN";
  $("#duel-result-text").textContent=(won?"Bạn đã đánh bại hồn ma! ":"Hãy thử thêm một lần nữa! ")+
    "Điểm "+score+" · "+hits+" ấn chú trúng · combo cao nhất "+peak+".";
  say(won?"✦ Xuất sắc! Vũ điệu pháp thuật đã hóa giải hồn ma.":"☾ Hồn ma vẫn đang chờ bạn thử sức lần nữa.");
  paint();
}
function next(){
  if(index>=sequence.length||health<=0){end();return;}
  lastCue=-1;
  root.style.setProperty("--duel-flight","0%");
  paint();
}
function flash(kind){
  root.classList.remove("duel-hit","duel-miss");
  void root.offsetWidth;
  root.classList.add(kind==="miss"?"duel-miss":"duel-hit");
}
function resolve(lane,judgment){
  if(state!=="running")return;
  if(judgment==="miss"){
    combo=0;health=Math.max(0,health-1);misses++;
    say(lane===-1?"☽ Ấn chú đã trôi qua! Hãy bắt nhịp lại.":"☽ Nhầm ấn chú! Hồn ma phản đòn.");
    flash("miss");playTone(Math.max(0,lane),false);
  }else{
    hits++;combo++;peak=Math.max(peak,combo);
    const points=judgment==="perfect"?150:judgment==="good"?105:100;
    score+=points+Math.min(combo-1,12)*10;
    say(judgment==="perfect"?"✦ PERFECT! Pháp thuật bùng sáng!":
      judgment==="good"?"✧ GOOD! Hồn ma đã trúng phép!":"✦ Chính xác! Tiếp tục kết hợp ấn chú.");
    flash("hit");playTone(lane);
  }
  index++;
  next();
}
function gameTick(now){
  if(state!=="running"||mode!=="duel")return;
  if(index>=sequence.length){end();return;}
  const beat=startAt+index*settings.duel.interval;
  const offset=now-beat;
  const progress=Math.max(0,Math.min(1,(offset+760)/1180));
  root.style.setProperty("--duel-flight",(progress*100).toFixed(1)+"%");
  if(offset>=-120&&lastCue!==index){
    lastCue=index;
    // A tiny metronome cue, never sourced from copyrighted music.
    playTone(sequence[index]);
  }
  if(offset>430){resolve(-1,"miss");}
  if(state==="running")frame=requestAnimationFrame(gameTick);
}
function startGame(){
  cancelLoop();
  sequence=[];
  for(let i=0;i<settings[mode].count;i++){
    let value=Math.floor(Math.random()*4);
    if(i>1&&sequence[i-1]===value&&sequence[i-2]===value)value=(value+1)%4;
    sequence.push(value);
  }
  $("#duel-ghost-health").setAttribute("aria-valuemax",String(sequence.length));
  state="running";score=combo=hits=misses=peak=index=0;health=5;lastCue=-1;
  startAt=performance.now()+1000;
  $("#duel-result").hidden=true;
  root.dataset.result="";
  say(mode==="practice"?"✦ Chạm ấn chú đang phát sáng. Không giới hạn thời gian!":
    "☾ Chuẩn bị! Ấn chú lao tới cổng. Chạm đúng nhịp để tạo combo.");
  paint();
  if(mode==="duel")frame=requestAnimationFrame(gameTick);
}
function pause(){
  if(state==="running"){
    state="paused";pausedAt=performance.now();cancelLoop();
    say("Ⅱ Đã tạm dừng. Nhấn TIẾP TỤC để trở lại màn đấu.");
  }else if(state==="paused"){
    state="running";
    if(mode==="duel"){startAt+=performance.now()-pausedAt;frame=requestAnimationFrame(gameTick);}
    say("▶ Pháp thuật tiếp tục! Hãy theo dõi ấn chú.");
  }
  paint();
}
function press(lane){
  if(state!=="running"||!Number.isInteger(lane)||lane<0||lane>3)return;
  if(lane!==sequence[index]){resolve(lane,"miss");return;}
  if(mode==="practice"){resolve(lane,"practice");return;}
  const delta=performance.now()-(startAt+index*settings.duel.interval);
  if(delta< -420){say("☾ Còn sớm! Chờ ấn chú tiến tới cổng phép thuật.");return;}
  if(delta>430){resolve(-1,"miss");return;}
  resolve(lane,Math.abs(delta)<=150?"perfect":"good");
}
root.querySelectorAll("[data-duel-mode]").forEach(button=>button.addEventListener("click",()=>{
  if(state==="running"||state==="paused")return;
  mode=button.dataset.duelMode;
  root.querySelectorAll("[data-duel-mode]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
  reset();
}));
laneButtons.forEach(button=>button.addEventListener("click",()=>press(Number(button.dataset.duelLane))));
start.addEventListener("click",startGame);
pauseButton.addEventListener("click",pause);
resetButton.addEventListener("click",reset);
soundButton.addEventListener("click",()=>{
  muted=!muted;soundButton.setAttribute("aria-pressed",String(!muted));
  soundButton.textContent=muted?"♫ ÂM PHÉP: TẮT":"♫ ÂM PHÉP: BẬT";
  if(!muted)playTone(0);
});
document.addEventListener("keydown",event=>{
  if(state!=="running"||event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
  const el=event.target;
  if(el?.matches?.("input,textarea,select,[contenteditable]")||document.querySelector("dialog[open]"))return;
  if(root.getBoundingClientRect().bottom<0||root.getBoundingClientRect().top>innerHeight)return;
  if(/^[1-4]$/.test(event.key)){
    event.preventDefault();
    press(Number(event.key)-1);
  }
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&state==="running")pause();});
window.addEventListener("blur",()=>{if(state==="running")pause();});
window.addEventListener("pagehide",()=>{cancelLoop();audio?.close?.().catch(()=>{});audio=null;});
reset();
