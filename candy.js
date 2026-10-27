/**
 * Ravenhollow Candy Hunt — accessible, turn-based Halloween microgame.
 * No timers, randomness from external APIs, server scores or tracking.
 */
const $ = (q) => document.querySelector(q);
const lanes = [...document.querySelectorAll("#candy-road [data-lane]")];
const track = $("#candy-road");
const chapters = [
  {candy:1,ghost:4},{candy:3,ghost:0},{candy:0,ghost:2},{candy:4,ghost:1},
  {candy:2,ghost:3},{candy:0,ghost:4},{candy:3,ghost:1},{candy:1,ghost:2},
  {candy:4,ghost:0},{candy:2,ghost:3}
];
const total=chapters.length;
const bestKey="ravenhollow-candy-best";
const medalKey="ravenhollow-candy-finished";
let round=0,player=2,score=0,ended=false,best=0;
try {
  const saved=Number(localStorage.getItem(bestKey));
  if(Number.isInteger(saved) && saved>=0 && saved<=total)best=saved;
}catch(_){}
const say=(text)=>{$("#candy-feedback").textContent=text;};
function setSaved(key,value){try{localStorage.setItem(key,String(value));}catch(_){}}
function updateHUD(){
  $("#candy-round").textContent=ended?"HOÀN THÀNH":"LƯỢT "+String(round+1).padStart(2,"0")+" / "+total;
  $("#candy-score").textContent=score;
  $("#candy-best").textContent=best;
  $("#candy-progress-fill").style.width=(round/total*100)+"%";
  $("#candy-grab").disabled=ended;
  $("#candy-left").disabled=ended;
  $("#candy-right").disabled=ended;
}
function render(){
  const chapter=chapters[Math.min(round,total-1)];
  lanes.forEach((button,i)=>{
    const isPlayer=i===player,hasCandy=!ended && i===chapter.candy,hasGhost=!ended&&i===chapter.ghost;
    button.classList.toggle("selected",isPlayer);
    button.setAttribute("aria-pressed",String(isPlayer));
    button.setAttribute("aria-label","Làn "+(i+1)+(isPlayer?", đang đứng tại đây":"")+(hasCandy?", có kẹo":hasGhost?", có bóng ma":""));
    button.replaceChildren();
    const path=document.createElement("span");path.className="candy-lane-line";path.setAttribute("aria-hidden","true");
    const sprite=document.createElement("span");sprite.className="candy-target";sprite.setAttribute("aria-hidden","true");
    sprite.textContent=hasCandy?"🍬":hasGhost?"👻":"✧";
    const avatar=document.createElement("span");avatar.className="candy-avatar";avatar.setAttribute("aria-hidden","true");
    avatar.textContent=isPlayer?"🧙":"·";
    button.append(path,sprite,avatar);
  });
  updateHUD();
}
function move(lane){
  if(ended)return;
  player=Math.max(0,Math.min(lanes.length-1,lane));
  render();
  const chapter=chapters[round];
  if(player===chapter.candy)say("✦ Đúng làn kẹo! Nhấn NHẶT KẸO để thu thập.");
  else if(player===chapter.ghost)say("☽ Cẩn thận! Làn này có bóng ma. Hãy đổi làn trước khi nhặt.");
  else say("Làn "+(player+1)+" không có kẹo. Hãy tìm viên kẹo phát sáng.");
}
function finish(){
  ended=true;
  best=Math.max(best,score);
  setSaved(bestKey,best);
  if(score>=6){
    setSaved(medalKey,"1");
    window.dispatchEvent(new Event("ravenhollow-progress"));
  }
  const win=score>=6;
  $("#candy-outcome").textContent=win?"✦ THỢ SĂN KẸO RAVENHOLLOW":"☾ HẸN GẶP LẠI ĐÊM TRĂNG";
  $("#candy-result-text").textContent=win
    ?"Bạn đã thu thập "+score+"/10 viên kẹo và mở khóa huy hiệu Thợ Săn Kẹo!"
    :"Bạn nhặt được "+score+"/10 viên. Thử lại để đạt ít nhất 6 viên và nhận huy hiệu nhé.";
  $("#candy-completion").hidden=false;
  say(win?"✦ Chúc mừng! Huy hiệu Thợ Săn Kẹo đã được ghi nhận.":"☾ Trò chơi hoàn thành. Bạn có thể thử lại bất cứ lúc nào.");
  render();
}
function collect(){
  if(ended)return;
  const c=chapters[round];
  if(player===c.candy){score++;say("✦ +1 KẸO! Bạn đã nhặt được một viên kẹo ma thuật.");}
  else if(player===c.ghost){score=Math.max(0,score-1);say("☽ Bóng ma làm rơi mất một viên kẹo!");}
  else say("Làn đường này không có kẹo. Hãy thử vận may ở lượt sau!");
  round++;
  if(round>=total){finish();return;}
  best=Math.max(best,score);
  render();
  const previous=$("#candy-feedback").textContent;
  say(previous+" Lượt "+(round+1)+" đã bắt đầu.");
}
lanes.forEach((button)=>button.addEventListener("click",()=>move(Number(button.dataset.lane))));
$("#candy-left").addEventListener("click",()=>move(player-1));
$("#candy-right").addEventListener("click",()=>move(player+1));
$("#candy-grab").addEventListener("click",collect);
track.addEventListener("keydown",(event)=>{
  if(["ArrowLeft","ArrowRight"," ","Enter"].includes(event.key)){
    // Native Space/Enter on lane buttons must select the lane, not end the turn.
    if((event.key===" "||event.key==="Enter")&&event.target!==track)return;
    event.preventDefault();
    if(event.key==="ArrowLeft")move(player-1);
    else if(event.key==="ArrowRight")move(player+1);
    else collect();
  }
});
$("#candy-replay").addEventListener("click",()=>{
  round=0;player=2;score=0;ended=false;
  $("#candy-completion").hidden=true;
  say("Sẵn sàng cho chuyến săn kẹo mới! Chọn làn và nhấn NHẶT KẸO.");
  render();
});
render();