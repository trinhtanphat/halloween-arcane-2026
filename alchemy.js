/**
 * Ravenhollow's original three-recipe potion laboratory and Arcane Passport.
 * No server storage, accounts, analytics, or third-party APIs.
 */
const $ = (selector) => document.querySelector(selector);
const store = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
const read = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
const broadcast = () => window.dispatchEvent(new Event("ravenhollow-progress"));
const ingredients = {
  moon: "Giọt Trăng", star: "Muối Sao", bloom: "Hoa Đêm",
  ember: "Than Rồng", tear: "Lệ Phượng", root: "Rễ Rừng"
};
const potions = [
  {name: "Moonveil Elixir", keys: ["moon","star","bloom"], description:"Giọt trăng soi tỏ, muối sao tinh khiết, hoa đêm nở muộn.", outcome:"☾ Moonveil Elixir — Chén thuốc soi sáng những bí mật trong màn sương."},
  {name: "Emberheart Brew", keys: ["ember","star","tear"], description:"Than rồng ấm nóng, muối sao lấp lánh, giọt lệ phượng hoàng.", outcome:"✦ Emberheart Brew — Ngọn lửa dũng khí bừng sáng trong tim."},
  {name: "Forest Whisper", keys: ["bloom","moon","root"], description:"Hoa đêm dịu dàng, giọt trăng và rễ cây từ rừng cấm.", outcome:"❧ Forest Whisper — Khu rừng cổ đại đã gửi lời chào tới bạn."}
];
let round = 0;
let picked = [];
let roundComplete = false;
let sessionComplete = false;
const stage = $("#alchemy .cauldron-stage");
const buttons = [...document.querySelectorAll("[data-ingredient]")];
const nextButton = $("#potion-next");
const clearButton = $("#potion-clear");
const selectionLabel = $("#potion-selection");
const recipeLabel = $("#potion-recipe");
const feedback = $("#potion-feedback");
function setFeedback(message) { feedback.textContent = message; }
function paintSelection() {
  buttons.forEach(button => {
    button.setAttribute("aria-pressed", String(picked.includes(button.dataset.ingredient)));
    button.disabled = roundComplete;
  });
  selectionLabel.textContent = "NGUYÊN LIỆU: " + picked.length + " / 3";
}
function loadRecipe() {
  roundComplete = false;
  sessionComplete = false;
  picked = [];
  stage.dataset.potion = "ready";
  $("#potion-title").textContent = potions[round].name;
  $("#potion-step").textContent = "CÔNG THỨC " + String(round+1).padStart(2,"0") + " / 03";
  $("#potion-hint").textContent = potions[round].description;
  recipeLabel.textContent = potions[round].keys.map(key=>ingredients[key]).join(" • ");
  $("#potion-liquid-label").textContent = "VẠC PHÉP ĐANG CHỜ NGUYÊN LIỆU";
  nextButton.hidden = true;
  clearButton.disabled = false;
  setFeedback("Mời chọn ba nguyên liệu trong công thức.");
  paintSelection();
}
function verifyPotion() {
  const expected = potions[round].keys;
  const success = picked.length === expected.length && expected.every(key=>picked.includes(key));
  stage.dataset.potion = success ? "success" : "failure";
  if(!success) {
    setFeedback("✧ Công thức chưa đúng. Vạc đã được làm sạch, hãy thử lại!");
    $("#potion-liquid-label").textContent = "CẦN THỬ LẠI";
    picked = [];
    paintSelection();
    return;
  }
  roundComplete = true;
  paintSelection();
  setFeedback(potions[round].outcome);
  $("#potion-liquid-label").textContent = "ĐIỀU CHẾ THÀNH CÔNG";
  nextButton.hidden = false;
  if(round === potions.length-1) {
    sessionComplete = true;
    nextButton.textContent = "↺ THỬ THÁCH LẦN NỮA";
    $("#potion-step").textContent = "HOÀN THÀNH PHÒNG PHA CHẾ";
    store("ravenhollow-potion-finished", "1");
    broadcast();
  } else {
    nextButton.textContent = "CÔNG THỨC TIẾP THEO →";
  }
}
buttons.forEach(button=>button.addEventListener("click",()=>{
  if(roundComplete)return;
  const key=button.dataset.ingredient;
  if(!(key in ingredients))return;
  if(picked.includes(key))picked=picked.filter(item=>item!==key);
  else if(picked.length<3)picked.push(key);
  stage.dataset.potion = "ready";
  $("#potion-liquid-label").textContent="VẠC ĐANG HÒA QUYỆN";
  paintSelection();
  setFeedback("Đã chọn: "+(picked.length?picked.map(item=>ingredients[item]).join(", "):"chưa có nguyên liệu")+".");
  if(picked.length===3)verifyPotion();
}));
clearButton?.addEventListener("click",()=>{
  if(roundComplete)return;
  picked=[];stage.dataset.potion="ready";paintSelection();
  $("#potion-liquid-label").textContent="VẠC PHÉP ĐÃ ĐƯỢC LÀM SẠCH";
  setFeedback("Đã đổ vạc. Bạn có thể chọn lại ba nguyên liệu.");
});
nextButton?.addEventListener("click",()=>{
  if(!roundComplete)return;
  round = sessionComplete ? 0 : Math.min(round+1,potions.length-1);
  loadRecipe();
});
loadRecipe();

// Achievements are intentionally checked from local state, never inferred from UI alone.
const stampIds = ["order","spells","portal","potion","vault","candy","runes"];
function validVaultProgress(){
  if(read("ravenhollow-vault-finished")!=="1")return false;
  try{
    const relics=JSON.parse(read("ravenhollow-expedition-relics")||"[]");
    return Array.isArray(relics)&&["hall","library","tower","crypt"].every(id=>relics.includes(id));
  }catch(_){return false;}
}
function completed(){
  const rawOrder=read("ravenhollow-order");
  let spellList=[];
  try { const value=JSON.parse(read("ravenhollow-spells")||"[]"); if(Array.isArray(value))spellList=value.filter(s=>typeof s==="string"); }catch(_){}
  const allSpells=["luminara","nebulora","asterium","florastra"].every(s=>spellList.includes(s));
  return {
    order: rawOrder!==null && /^[0-3]$/.test(rawOrder),
    spells: allSpells,
    portal: read("ravenhollow-portal-finished")==="1",
    potion: read("ravenhollow-potion-finished")==="1",
    vault: validVaultProgress(),
    candy: read("ravenhollow-candy-finished")==="1",
    runes: read("ravenhollow-runes-finished")==="1"
  };
}
function updatePassport(){
  const progress=completed();
  const count=stampIds.filter(id=>progress[id]).length;
  $("#passport-count").textContent=count+"/"+stampIds.length;
  $("#passport-progress-bar").style.width=(count/stampIds.length*100)+"%";
  stampIds.forEach(id=>{
    const item=$("#stamp-"+id);
    const ok=progress[id];
    item.classList.toggle("unlocked",ok);
    item.dataset.complete=String(ok);
  });
  const message=count===stampIds.length
    ? "✦ CHÚC MỪNG! Bạn đã nhận danh hiệu ĐẠI PHÁP SƯ RAVENHOLLOW."
    : "Bạn đã hoàn thành "+count+"/"+stampIds.length+" nhiệm vụ. Tiếp tục khám phá để nhận huy hiệu Đại Pháp Sư.";
  $("#passport-status").textContent=message;
  return {count,progress};
}
window.addEventListener("ravenhollow-progress",updatePassport);
window.addEventListener("storage",(event)=>{
  if(event.key?.startsWith("ravenhollow-"))updatePassport();
});
$("#passport-share")?.addEventListener("click",async ()=>{
  const {count,progress}=updatePassport();
  const rows=[
    "✧ RAVENHOLLOW — THE ENCHANTED HALLOWEEN 2026",
    "Hộ chiếu pháp sư: "+count+"/"+stampIds.length+" nhiệm vụ",
    ...stampIds.map((id,i)=>(progress[id]?"✓ ":"○ ")+[
      "Gia nhập hội pháp sư","Thi triển 4 thần chú","Vượt cổng bí ẩn","Pha chế 3 thuốc phép","Giải phong ấn kho báu","Săn đủ kẹo đêm trăng","Ghép đủ các cặp cổ ngữ"
    ][i]),
    "https://trinhtanphat.github.io/halloween-arcane-2026/"
  ];
  try{
    if(!navigator.clipboard?.writeText)throw new Error("Clipboard unsupported");
    await navigator.clipboard.writeText(rows.join("\n"));
    $("#passport-status").textContent="✦ Đã sao chép hành trình! Bạn có thể chia sẻ với bạn bè.";
  }catch(_){
    $("#passport-status").textContent="Không thể tự động sao chép trên trình duyệt này. Bạn vẫn có thể chụp ảnh hộ chiếu để chia sẻ.";
  }
});
updatePassport();