/**
 * User-activated soundscape. Synthesizes quiet ambient audio locally through WebAudio.
 * Starts muted and uses no external audio files, streaming or tracking.
 */
const soundToggle = document.querySelector("#sound-toggle");
const AudioContextType = window.AudioContext || window.webkitAudioContext;
let context=null, master=null, sources=[], active=false;
function updateSoundButton() {
  soundToggle.setAttribute("aria-pressed",String(active));
  soundToggle.textContent=active?"♫ ÂM THANH: BẬT":"♫ ÂM THANH: TẮT";
}
function createSoundscape(){
  context = new AudioContextType();
  master=context.createGain();
  master.gain.value=0;
  master.connect(context.destination);
  // A subdued magical C-minor pad made of sine waves; fades in over seconds.
  for(const [frequency,level,type] of [[130.81,.24,"sine"],[155.56,.14,"sine"],[196,.10,"triangle"],[261.62,.055,"sine"]]){
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    oscillator.type=type;
    oscillator.frequency.value=frequency;
    gain.gain.value=level;
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    sources.push(oscillator);
  }
  const lfo=context.createOscillator();
  const lfoGain=context.createGain();
  lfo.frequency.value=.11;
  lfoGain.gain.value=.07;
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();
  sources.push(lfo);
}
async function toggleSound(){
  if(!AudioContextType){
    soundToggle.textContent="ÂM THANH KHÔNG HỖ TRỢ";
    soundToggle.disabled=true;
    return;
  }
  try{
    if(!context)createSoundscape();
    if(active){
      active=false;
      // Smooth fade-out prevents pops, then suspend to save energy.
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(0,context.currentTime,.14);
      setTimeout(()=>{if(!active && context?.state==="running")context.suspend().catch(()=>{});},500);
    }else{
      await context.resume();
      active=true;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(.14,context.currentTime,.55);
    }
  }catch(error){
    active=false;
    console.info("Optional soundscape unavailable:",error?.message||error);
  }
  updateSoundButton();
}
soundToggle?.addEventListener("click",toggleSound);
document.addEventListener("visibilitychange",()=>{
  if(!context||!active)return;
  if(document.hidden)context.suspend().catch(()=>{});
  else context.resume().catch(()=>{});
});
window.addEventListener("pagehide",()=>{
  for(const oscillator of sources){try{oscillator.stop();}catch(_){}}
  sources=[];
  context?.close().catch(()=>{});
},{once:true});
updateSoundButton();
