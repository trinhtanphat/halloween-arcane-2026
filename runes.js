/**
 * Ravenhollow Rune Memory: original, fully client-side matching minigame.
 * Every playable card is a real button (native Tab, Enter, Space).
 * Only achievement and best move counts persist locally.
 */
const $=(selector)=>document.querySelector(selector);
const board=$("#rune-board");
const difficultyButtons=[...document.querySelectorAll("[data-rune-level]")];
const symbols=[
  {glyph:"☽",title:"Mặt Trăng"},
  {glyph:"✧",title:"Tinh Tú"},
  {glyph:"❖",title:"Tinh Thạch"},
  {glyph:"♜",title:"Tháp Cổ"},
  {glyph:"⚗",title:"Bình Thuốc"},
  {glyph:"✶",title:"Vầng Sáng"},
  {glyph:"❧",title:"Mầm Phép"},
  {glyph:"♧",title:"Cỏ Bốn Lá"}
];
const levels={normal:6,hard:8};
const badgeKey="ravenhollow-runes-finished";
let level="normal",deck=[],opened=[],matched=new Set(),moves=0,blocked=false,finished=false,unflipTimer=null;
function getBest(){
  try{
    const n=Number(localStorage.getItem("ravenhollow-runes-best-"+level));
    return Number.isInteger(n)&&n>=levels[level]&&n<=999?n:null;
  }catch(_){return null;}
}
function persist(key,val){try{localStorage.setItem(key,String(val));}catch(_){}}
function randomShuffle(items){
  const result=[...items];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
function cardName(index){
  const data=symbols[deck[index]];
  if(matched.has(index))return "Phiến "+(index+1)+": "+data.title+" — đã ghép đúng";
  if(opened.includes(index))return "Phiến "+(index+1)+": "+data.title+" — đang mở";
  return "Phiến "+(index+1)+": chưa lật";
}
function paintCard(index){
  const button=board.querySelector('[data-rune-card="'+index+'"]');
  if(!button)return;
  const visible=opened.includes(index)||matched.has(index);
  button.classList.toggle("revealed",visible);
  button.classList.toggle("matched",matched.has(index));
  button.setAttribute("aria-label",cardName(index));
  button.setAttribute("aria-pressed",String(visible));
  button.disabled=matched.has(index)||finished;
  button.querySelector(".rune-face-symbol").textContent=visible?symbols[deck[index]].glyph:"✦";
  button.querySelector(".rune-face-name").textContent=visible?symbols[deck[index]].title:"RAVENHOLLOW";
}
function paintHUD(){
  const total=levels[level], completed=matched.size/2;
  $("#rune-matched").textContent=completed+"/"+total;
  $("#rune-moves").textContent=moves;
  $("#rune-best").textContent=getBest()??"—";
  $("#rune-progress-fill").style.width=(completed/total*100)+"%";
  $("#rune-board-mode").textContent=total+" CẶP CỔ NGỮ";
  board.dataset.level=level;
  difficultyButtons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.runeLevel===level)));
}
function say(message){$("#rune-message").textContent=message;}
function finish(){
  finished=true;
  const oldBest=getBest();
  if(oldBest===null||moves<oldBest)persist("ravenhollow-runes-best-"+level,moves);
  persist(badgeKey,"1");
  window.dispatchEvent(new Event("ravenhollow-progress"));
  $("#rune-victory").hidden=false;
  $("#rune-win-message").textContent="Bạn đã giải mã "+levels[level]+" cặp trong "+moves+" lượt! Huy hiệu Người Giữ Ký Ức đã được mở khóa.";
  say("✦ CHÚC MỪNG! Bạn đã giải mã mọi phiến đá.");
  for(let i=0;i<deck.length;i++)paintCard(i);
  paintHUD();
}
function selectCard(index){
  if(blocked||finished||matched.has(index)||opened.includes(index))return;
  opened.push(index);
  paintCard(index);
  if(opened.length<2){
    say("☾ Hãy lật thêm một phiến đá để kiểm tra cặp.");
    return;
  }
  moves++;
  const [a,b]=opened;
  if(deck[a]===deck[b]){
    matched.add(a);matched.add(b);
    opened=[];
    paintCard(a);paintCard(b);
    say("✧ Tuyệt vời! Đã ghép đúng "+symbols[deck[a]].title+".");
    if(matched.size===deck.length)finish();
  }else{
    blocked=true;
    say("☽ Hai cổ ngữ khác nhau. Hãy nhớ vị trí trước khi chúng úp lại!");
    unflipTimer=setTimeout(()=>{
      opened=[];blocked=false;unflipTimer=null;
      paintCard(a);paintCard(b);
      say("✦ Tiếp tục thử. Không giới hạn thời gian!");
    },850);
  }
  paintHUD();
}
function reset(nextLevel=level){
  if(unflipTimer!==null){clearTimeout(unflipTimer);unflipTimer=null;}
  level=Object.hasOwn(levels,nextLevel)?nextLevel:"normal";
  const symbolsForLevel=Array.from({length:levels[level]},(_,i)=>i);
  deck=randomShuffle(symbolsForLevel.flatMap(i=>[i,i]));
  opened=[];matched=new Set();moves=0;blocked=false;finished=false;
  board.replaceChildren();
  for(let i=0;i<deck.length;i++){
    const card=document.createElement("button");
    card.type="button";
    card.className="rune-card";
    card.dataset.runeCard=String(i);
    card.dataset.pair=String(deck[i]);
    const glyph=document.createElement("span");
    glyph.className="rune-face-symbol";
    glyph.setAttribute("aria-hidden","true");
    const name=document.createElement("span");
    name.className="rune-face-name";name.setAttribute("aria-hidden","true");
    card.append(glyph,name);
    card.addEventListener("click",()=>selectCard(i));
    board.appendChild(card);
    paintCard(i);
  }
  $("#rune-victory").hidden=true;
  say("✦ Chọn hai phiến đá để tìm một cặp cổ ngữ.");
  paintHUD();
}
difficultyButtons.forEach(button=>button.addEventListener("click",()=>reset(button.dataset.runeLevel)));
$("#rune-restart").addEventListener("click",()=>reset());
reset();
