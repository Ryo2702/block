import { useState } from 'react';
import { Music2, Pause, Play, ChevronRight, ChevronLeft, Hammer, Crosshair } from 'lucide-react';
import { useGame } from '../store/useGame';
import { characters } from '../game/characters';
import { money } from '../game/rules';
import { unlockAudio } from '../game/audio';

export function MusicButton() {
  const enabled=useGame(s=>s.music);
  return <button className={'icon-button music-toggle '+(enabled?'music-on':'')} aria-label={enabled?'Mute music':'Enable music'} aria-pressed={enabled} title={enabled?'Music on':'Music off'} onClick={()=>{unlockAudio();useGame.getState().set({music:!enabled});}}><Music2 size={18}/></button>;
}
// Explicitly fictional entertainment; never mixed into scores or actual activity.
const demoWins=[['SmashKing',0,2450],['SOLHunter',13,7800],['UglyWhale',17,1500],['MoonBoy',18,3200],['BlockCrusher',5,12500]];
export function DemoParade() {
  const [paused,setPaused]=useState(false),reduced=useGame(s=>s.reducedMotion);
  return <section className="demo-ticker" aria-label="Fictional winnings demo parade" data-paused={paused||reduced}>
    <span className="demo-label">DEMO PARADE<small>FICTIONAL PLAYERS</small></span>
    <div className="ticker-window" tabIndex={0} aria-label="Fictional arcade winnings; pause to browse"><div className="ticker-track">{[0,1].map(copy=><div className="ticker-copy" key={copy} aria-hidden={copy===1?true:undefined}>{demoWins.map(([name,avatar,amount])=><span className="ticker-win" key={name}><img src={characters[avatar].src} alt=""/><b>{name}</b><span>{amount>=7500?'hit a jackpot of':'smashed'}</span><strong>{money(amount)}</strong><span className="ticker-star">✦</span></span>)}</div>)}</div></div>
    <button className="ticker-control" aria-label={paused?'Play demo parade':'Pause demo parade'} disabled={reduced} onClick={()=>setPaused(!paused)}>{paused||reduced?<Play size={13}/>:<Pause size={13}/>}</button>
  </section>;
}
const chapters=[
  {name:'The market went weird.',tag:'CHAPTER 01 · MEET THE STACK',avatar:18,body:'A market meltdown turned everyone into moody little blocks. They’ve stacked themselves sky-high, and someone needs to let off steam. That someone is you.',tip:'One round. One weird stack. All winnings are imaginary arcade dollars.'},
  {name:'Choose your kind of chaos.',tag:'CHAPTER 02 · PICK YOUR PUNCH',avatar:5,body:'The bonker hits hard. Pop therapy fires fast. Choose a weapon below, then tap a misfit in the arena. Break a lower block and watch the neighbors tumble.',tip:'Hammer: 2 damage, unlimited swings. Pop gun: 1 damage, six shots. Reload with R or the reload button.'},
  {name:'The stack fights back.',tag:'CHAPTER 03 · CHASE THE SURPRISE',avatar:13,body:'Some angry misfits dodge. Lucky blocks hide a bonus. Mystery blocks reveal money or a Golden Hammer, and the rare jackpot block rewards a big finish.',tip:'Keep hitting within 2.8 seconds for Combo Rush. A miss resets it. Golden Hammer doubles hammer damage for eight seconds.'},
  {name:'Become a top smasher.',tag:'CHAPTER 04 · MAKE YOUR MARK',avatar:0,body:'Smash before the clock runs out, set a personal record, then hand the arcade to a friend. Create your own names under “Your player” and compete on this browser.',tip:'Your scores come from actual play. DEMO rivals and the parade are fictional; Smash activity shows your real local hits.'},
];
export function StoryGuide({onDone}) {
  const [step,setStep]=useState(0),weapon=useGame(s=>s.weapon),chapter=chapters[step];
  return <section className="story-guide" aria-label="Interactive arcade story">
    <div className="story-chapter" key={step}><img src={characters[chapter.avatar].src} alt=""/><div><span className="eyebrow">{chapter.tag}</span><h3>{chapter.name}</h3></div></div>
    <div aria-live="polite"><p className="story-body">{chapter.body}</p><p className="story-tip">{chapter.tip}</p></div>
    {step===1&&<div className="story-weapons">{[['hammer','The bonker',Hammer],['gun','Pop therapy',Crosshair]].map(([id,name,Icon])=><button key={id} aria-pressed={weapon===id} onClick={()=>useGame.getState().set({weapon:id})}><Icon size={16}/>{name}</button>)}</div>}
    <div className="story-controls"><button className="text-button" disabled={step===0} onClick={()=>setStep(step-1)}><ChevronLeft size={15}/>Back</button><span>{step+1} / {chapters.length}</span>{step<chapters.length-1?<button className="text-button" onClick={()=>setStep(step+1)}>Next chapter<ChevronRight size={15}/></button>:<button className="text-button" onClick={onDone}>Back to the arcade<ChevronRight size={15}/></button>}</div>
  </section>;
}
