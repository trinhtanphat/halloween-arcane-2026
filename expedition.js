/**
 * Ravenhollow Castle Expedition.
 * Original browser-only story quest with four rooms, riddles and a final vault.
 * Individual relics persist locally; no personal data is sent anywhere.
 */
const $ = selector => document.querySelector(selector);
const storeKey = "ravenhollow-expedition-relics";
const vaultKey = "ravenhollow-vault-finished";
const rooms = [
  {id:"hall",chapter:"CHAPTER VI — THE GREAT HALL",title:"ĐẠI SẢNH BÓNG ĐÊM",icon:"♜",relic:"Ngọn Nến Hoàng Hôn",symbol:"✦",
   story:"Những cây nến lơ lửng soi sáng một lời tiên tri đã thất lạc trên mái vòm của đại sảnh.",
   question:"Ta cháy mà không cần củi, dẫn đường trong đêm và để lại ánh sáng. Ta là gì?",
   answers:["Chiếc chìa khóa sắt","Ngọn nến phép thuật","Chiếc đồng hồ cổ"],correct:1},
  {id:"library",chapter:"CHAPTER VII — THE LOST LIBRARY",title:"THƯ VIỆN BÍ ẨN",icon:"▤",relic:"Trang Sách Vĩnh Cửu",symbol:"❖",
   story:"Sau tủ sách bụi phủ, một quyển sách tự mở trước mặt bạn và đặt ra câu hỏi cho người đọc.",
   question:"Ta có nhiều trang, lưu giữ nghìn câu chuyện nhưng chẳng hề biết nói. Ta là gì?",
   answers:["Một cuốn sách","Một chiếc chuông","Một chiếc vương miện"],correct:0},
  {id:"tower",chapter:"CHAPTER VIII — THE MOON TOWER",title:"THÁP THIÊN VĂN",icon:"☽",relic:"Mảnh Trăng Bạc",symbol:"☾",
   story:"Cầu thang xoắn dẫn đến đài thiên văn. Những tinh tú chuyển động quanh một mảnh bạc đang phát sáng.",
   question:"Ta đổi hình qua từng đêm, phản chiếu ánh mặt trời và dẫn thủy triều. Ta là gì?",
   answers:["Ngọn lửa xanh","Ngôi sao băng","Mặt trăng"],correct:2},
  {id:"crypt",chapter:"CHAPTER IX — THE ANCIENT CRYPT",title:"HẦM MỘ CỔ",icon:"✝",relic:"Ấn Chú Ngàn Năm",symbol:"✶",
   story:"Dưới lớp đá rêu phong, một ký tự rực sáng trên cánh cửa đã bị phong ấn nhiều thế kỷ.",
   question:"Càng chia sẻ, ta càng lớn mạnh; ta giúp bạn vượt qua cả nỗi sợ. Ta là gì?",
   answers:["Lòng dũng cảm","Bóng tối","Sự im lặng"],correct:0}
];
const known = new Set(rooms.map(room=>room.id));
function read(key){
  try{return localStorage.getItem(key);}catch(_){return null;}
}
function store(key,value){
  try{localStorage.setItem(key,value);}catch(_){}
}
function restoreRelics() {
  try {
    const parsed=JSON.parse(read(storeKey)||"[]");
    if(!Array.isArray(parsed))return new Set();
    return new Set(parsed.filter(value=>typeof value==="string"&&known.has(value)));
  } catch (_) {return new Set();}
}
let collected=restoreRelics(), current="hall", lastWrong=null, opened=read(vaultKey)==="1";
const buttons=[...document.querySelectorAll("[data-room]")];
const answerBox=$("#expedition-answers");
const vaultButton=$("#vault-open");
const vaultFinal=$("#expedition-final");
function updateStatus(){
  for(const button of buttons){
    const found=collected.has(button.dataset.room);
    button.classList.toggle("found",found);
    button.classList.toggle("active",button.dataset.room===current);
    button.setAttribute("aria-pressed",String(button.dataset.room===current));
    button.querySelector(".room-check").textContent=found?"✓":"○";
  }
  const n=collected.size;
  $("#expedition-progress-label").textContent="CỔ VẬT ĐÃ THU THẬP · "+n+" / 4";
  $("#expedition-progress-bar").style.width=(n/rooms.length*100)+"%";
  vaultButton.disabled=n!==rooms.length||opened;
  vaultButton.innerHTML=n<rooms.length?"ĐÃ KHÓA <span>⊘</span>":(opened?"ĐÃ MỞ <span>✦</span>":"MỞ HẦM BÍ MẬT <span>✦</span>");
  $("#vault-hint").textContent=n===rooms.length ? (opened?"KHO BÁU ĐÃ ĐƯỢC GIẢI PHONG ẤN":"4 CỔ VẬT ĐÃ HỘI TỤ — CÁNH CỬA SẴN SÀNG"):"THU THẬP "+(rooms.length-n)+" CỔ VẬT CÒN LẠI";
  $("#vault-sigil").textContent=opened?"✶":"⌑";
  vaultFinal.hidden=!opened;
}
function renderRoom(id){
  const room=rooms.find(item=>item.id===id);
  if(!room)return;
  current=id;
  const found=collected.has(id);
  $("#expedition-scene").dataset.roomScene=id;
  $("#expedition-emblem").textContent=room.icon;
  $("#expedition-scene-label").textContent=room.chapter;
  $("#expedition-scene-title").textContent=room.title;
  $("#expedition-chapter").textContent=String(rooms.indexOf(room)+1).padStart(2,"0")+" / 04";
  $("#expedition-question").textContent=room.question;
  $("#expedition-room-story").textContent=room.story;
  $("#expedition-relic").hidden=!found;
  $("#expedition-relic-symbol").textContent=room.symbol;
  $("#expedition-relic-name").textContent=room.relic;
  $("#expedition-feedback").textContent=found ? "✦ Đã tìm thấy cổ vật. Bạn có thể khám phá phòng khác." : "Chọn lời giải đúng để nhận cổ vật.";
  lastWrong=null;
  answerBox.replaceChildren();
  room.answers.forEach((answer,i)=>{
    const button=document.createElement("button");button.type="button";
    button.disabled=found;button.dataset.answer=String(i);
    const letter=document.createElement("span");letter.textContent=String.fromCharCode(65+i);
    const text=document.createElement("span");text.textContent=answer;
    button.append(letter,text);
    if(found&&i===room.correct)button.classList.add("correct");
    button.addEventListener("click",()=>submitAnswer(id,i));
    answerBox.append(button);
  });
  updateStatus();
}
function submitAnswer(id,answer){
  if(current!==id||collected.has(id))return;
  const room=rooms.find(item=>item.id===id);
  if(!room)return;
  const choices=[...answerBox.querySelectorAll("[data-answer]")];
  if(answer!==room.correct){
    lastWrong=answer;
    choices.forEach(choice=>choice.classList.toggle("wrong",Number(choice.dataset.answer)===answer));
    $("#expedition-feedback").textContent="☽ Chưa đúng. Hãy đọc lại câu đố và thử một lời giải khác.";
    return;
  }
  collected.add(id);
  store(storeKey,JSON.stringify([...collected]));
  choices.forEach(choice=>{
    choice.disabled=true;
    choice.classList.remove("wrong");
    choice.classList.toggle("correct",Number(choice.dataset.answer)===room.correct);
  });
  $("#expedition-relic").hidden=false;
  $("#expedition-feedback").textContent="✦ Chính xác! Bạn đã tìm thấy "+room.relic+".";
  updateStatus();
  window.dispatchEvent(new Event("ravenhollow-progress"));
}
buttons.forEach(button=>button.addEventListener("click",()=>renderRoom(button.dataset.room)));
vaultButton.addEventListener("click",()=>{
  if(collected.size!==rooms.length||opened)return;
  opened=true;
  store(vaultKey,"1");
  updateStatus();
  window.dispatchEvent(new Event("ravenhollow-progress"));
  vaultFinal.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});
});
$("#expedition-replay").addEventListener("click",()=>{
  collected=new Set();opened=false;store(storeKey,"[]");store(vaultKey,"");
  renderRoom("hall");
  window.dispatchEvent(new Event("ravenhollow-progress"));
});
renderRoom("hall");
