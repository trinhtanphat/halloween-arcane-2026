/**
 * Ravenhollow Expansion
 * Four Arcane Orders + interactive Spellbook.
 * Original browser-only experience, no account and no external APIs.
 */
const $ = (selector) => document.querySelector(selector);

const orders = [
  {name: "SOLARIS", glyph: "☀", color:"#f6bc73", short:"Dũng khí · Lửa", description:"Bạn là người thắp ngọn lửa tiên phong: dũng cảm, chân thành, sẵn lòng bảo vệ đồng đội. Hội Solaris trân trọng sự quyết đoán và ánh sáng."},
  {name: "NOCTIS", glyph: "☽", color:"#c9a6f4", short:"Trực giác · Bóng đêm", description:"Bạn lắng nghe những điều không ai thấy và tìm ra chân lý giữa màn sương. Hội Noctis trân trọng trực giác, lòng kiên định và chiều sâu tâm hồn."},
  {name: "AETHERIS", glyph: "✧", color:"#aae4f5", short:"Trí tuệ · Bầu trời", description:"Bạn luôn đặt câu hỏi và say mê những bí ẩn của thế giới. Hội Aetheris trân trọng trí tuệ, sự sáng tạo và khát vọng khám phá."},
  {name: "VERDANTIA", glyph: "❧", color:"#a0d7a5", short:"Nhân ái · Thiên nhiên", description:"Bạn mang đến sức sống và bình yên cho người xung quanh. Hội Verdantia trân trọng lòng nhân ái, sự gắn kết và khả năng chữa lành."}
];
const questions = [
  {text:"Bạn bước vào một thư viện đầy sách biết bay. Bạn chọn cuốn nào?", answers:[
    ["Bí mật của ngọn lửa bất diệt",0],["Chuyện kể của những vì sao xa",2],
    ["Nhật ký khu rừng cổ thụ",3],["Những lời tiên tri dưới trăng",1]
  ]},
  {text:"Một người bạn bị lạc trong mê cung phép thuật. Bạn sẽ...",answers:[
    ["Lắng nghe cảm giác để lần theo dấu vết",1],["Lập bản đồ và giải mã ký hiệu",2],
    ["Dũng cảm đi trước để tìm lối thoát",0],["Gọi mọi người cùng hỗ trợ",3]
  ]},
  {text:"Vật phẩm nào bạn muốn mang theo trong đêm Halloween?", answers:[
    ["Ngọn đèn có thể xua tan bóng tối",0],["La bàn dẫn tới những bí ẩn",1],
    ["Ống kính nhìn thấu tinh tú",2],["Hạt mầm hồi sinh khu vườn",3]
  ]}
];

const quizUI = {
  options:$("#order-options"),question:$("#order-question"),box:$("#order-question-box"),next:$("#order-next"),
  result:$("#order-result"),feedback:$("#order-feedback"),step:$("#order-step"),progress:$("#order-progress")
};
let index=0, selected=null, scores=[0,0,0,0];
function safeRead(key) {try{return localStorage.getItem(key);}catch{return null;}}
function safeStore(key,value){try{localStorage.setItem(key,value);}catch{}}
function renderQuestion(){
  if(!quizUI.options)return;
  selected=null;
  const q=questions[index];
  quizUI.question.textContent=q.text;
  quizUI.step.textContent="CÂU HỎI "+String(index+1).padStart(2,"0")+" / 03";
  quizUI.progress.style.width=((index+1)/questions.length*100)+"%";
  quizUI.feedback.textContent="Chọn một đáp án để tiếp tục.";
  quizUI.next.disabled=true;
  quizUI.next.textContent=index===questions.length-1?"NHẬN HUY HIỆU ✦":"TIẾP TỤC →";
  quizUI.options.replaceChildren();
  q.answers.forEach(([text,house],i)=>{
    const button=document.createElement("button");
    button.type="button";button.className="order-option";
    button.setAttribute("aria-pressed","false");
    const letter=document.createElement("span");letter.textContent=String.fromCharCode(65+i);
    const caption=document.createElement("span");caption.textContent=text;
    button.append(letter,caption);
    button.addEventListener("click",()=>{
      selected=house;
      [...quizUI.options.children].forEach(child=>child.setAttribute("aria-pressed",String(child===button)));
      quizUI.feedback.textContent="✦ Lựa chọn đã được ghi nhận.";
      quizUI.next.disabled=false;
    });
    quizUI.options.appendChild(button);
  });
}
function showOrder(winner){
  const order=orders[winner];
  quizUI.box.hidden=true;
  quizUI.result.hidden=false;
  $("#order-name").textContent=order.name;
  $("#order-symbol").textContent=order.glyph;
  $("#order-description").textContent=order.description;
  $("#order-symbol").style.color=order.color;
  $("#order-name").style.color=order.color;
  quizUI.step.textContent="HUY HIỆU ĐÃ ĐƯỢC TRAO";
  quizUI.progress.style.width="100%";
  safeStore("ravenhollow-order",String(winner));
}
quizUI.next?.addEventListener("click",()=>{
  if(selected===null)return;
  scores[selected]++;
  if(index<questions.length-1){index++;renderQuestion();return;}
  const highest=Math.max(...scores);
  // Stable tie-breaker: earlier choice in quiz order wins.
  const winner=scores.findIndex((score)=>score===highest);
  showOrder(winner);
});
$("#restart-order")?.addEventListener("click",()=>{
  index=0;scores=[0,0,0,0];selected=null;quizUI.result.hidden=true;quizUI.box.hidden=false;
  safeStore("ravenhollow-order","");
  renderQuestion();
});
const savedOrder=safeRead("ravenhollow-order");
if(savedOrder!==null && /^[0-3]$/.test(savedOrder))showOrder(Number(savedOrder));
else renderQuestion();

// Cast an original elemental spell by changing an animated scene.
const spellInfo={
  luminara:{glyph:"✦",mote:"#ffe5a4",label:"✦ LUMINARA — Thắp sáng những bí ẩn ngủ quên."},
  nebulora:{glyph:"☾",mote:"#cda7fc",label:"☽ NEBULORA — Màn sương hé lộ lời thì thầm cổ xưa."},
  asterium:{glyph:"✧",mote:"#a2e3ff",label:"✧ ASTERIUM — Các vì sao chạm xuống căn phòng bí mật."},
  florastra:{glyph:"❧",mote:"#b5f9ad",label:"❧ FLORASTRA — Sức sống thức tỉnh từ khu rừng cấm."}
};
const chamber=$("#spell-chamber");
let activeCast="luminara";
function populateMotes(name){
  const particles=$("#chamber-particles");if(!particles)return;
  particles.replaceChildren();
  const fragment=document.createDocumentFragment();
  for(let i=0;i<34;i++){
    const mote=document.createElement("span");mote.className="magic-mote";
    mote.style.setProperty("--start-x",(10+(i*37.79)%80).toFixed(2)+"%");
    mote.style.setProperty("--start-y",(25+(i*23.37)%65).toFixed(2)+"%");
    mote.style.setProperty("--size",(2+(i*7)%7)+"px");
    mote.style.setProperty("--duration",(3+(i*7)%5)+"s");
    mote.style.setProperty("--delay",(-i*.31)+"s");
    mote.style.setProperty("--drift",(((i*27)%130)-65)+"px");
    mote.style.setProperty("--mote-color",spellInfo[name].mote);
    fragment.appendChild(mote);
  }
  particles.appendChild(fragment);
}
function cast(name){
  if(!spellInfo[name])return;
  activeCast=name;
  const info=spellInfo[name];
  chamber.dataset.spell=name;
  $("#chamber-glyph").textContent=info.glyph;
  $("#spell-message").textContent=info.label;
  document.querySelectorAll("[data-cast]").forEach((button)=>{
    const active=button.dataset.cast===name;
    button.classList.toggle("selected",active);
    button.setAttribute("aria-pressed",String(active));
  });
  chamber.classList.remove("cast");
  void chamber.offsetWidth; // replay a one-shot rune burst for repeat clicks
  chamber.classList.add("cast");
  populateMotes(name);
}
document.querySelectorAll("[data-cast]").forEach(button=>{
  button.addEventListener("click",()=>cast(button.dataset.cast));
});
cast(activeCast);

// Safe, scoped offline support. No login state or personal data enters the cache.
if ("serviceWorker" in navigator && (location.protocol==="https:" || location.hostname==="localhost" || location.hostname==="127.0.0.1")){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(err=>console.info("Offline mode unavailable:",err.message));
  },{once:true});
}
