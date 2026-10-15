let context, musicTimer;
export function unlockAudio() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    context ||= new Audio();
    if (context.state === 'suspended') context.resume().catch(() => {});
  } catch {
    // Audio is optional; unsupported or blocked audio must not stop gameplay.
    context = undefined;
  }
}
export function sound(type, enabled=true) {
  if(!enabled || !context) return;
  const frequencies={hammer:110,gun:410,hit:180,pop:650,fall:95,combo:880,reward:1046,jackpot:1568,reload:240};
  const o=context.createOscillator(), g=context.createGain(); o.connect(g); g.connect(context.destination);
  const now=context.currentTime; o.type=type==='gun'?'square':'sine'; o.frequency.setValueAtTime(frequencies[type]||300,now); o.frequency.exponentialRampToValueAtTime(type==='reward'||type==='combo'?1320:45,now+.18); g.gain.setValueAtTime(.065,now);g.gain.exponentialRampToValueAtTime(.001,now+.23);o.start();o.stop(now+.25);
}
export function music(enabled) { clearInterval(musicTimer); if(!enabled||!context)return; let beat=0; const notes=[130.81,164.81,196,164.81,146.83,174.61,220,174.61];musicTimer=setInterval(()=>{const o=context.createOscillator(),g=context.createGain();o.connect(g);g.connect(context.destination);o.frequency.value=notes[beat++%notes.length];g.gain.setValueAtTime(.018,context.currentTime);g.gain.exponentialRampToValueAtTime(.001,context.currentTime+.28);o.start();o.stop(context.currentTime+.3);},380); }
