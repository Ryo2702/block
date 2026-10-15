import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGame } from '../store/useGame';
import { rankings } from '../store/competition';
import { characters } from '../game/characters';
import { money } from '../game/rules';

export function AnimatedMoney({value}) {
  const reduced=useGame(s=>s.reducedMotion), [shown,setShown]=useState(value), current=useRef(value);
  useEffect(()=>{
    if(reduced){current.current=value;setShown(value);return;}
    const from=current.current, start=performance.now();let frame;
    const tick=now=>{const t=Math.min(1,(now-start)/240);current.current=from+(value-from)*t;setShown(current.current);if(t<1)frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[value,reduced]);
  return <span>{money(shown)}</span>;
}
function Avatar({avatar}) {return <img className="player-avatar" src={characters[avatar]?.src || characters[0].src} alt=""/>;}
export function PlayerEditor() {
  const s=useGame(), player=s.players[s.playerId], [name,setName]=useState(player.name),[avatar,setAvatar]=useState(player.avatar),[adding,setAdding]=useState(false),[message,setMessage]=useState('');
  const busy=['playing','paused'].includes(s.screen);
  useEffect(()=>{setName(player.name);setAvatar(player.avatar);setAdding(false);},[s.playerId,player.name,player.avatar]);
  return <form className="player-editor" onSubmit={e=>{e.preventDefault();if(s.savePlayer(name,avatar,adding)){setAdding(false);setMessage('Player saved.');}}}>
    <label>Playing as<select aria-label="Local player" disabled={busy} value={s.playerId} onChange={e=>s.selectPlayer(e.target.value)}>{Object.entries(s.players).map(([id,p])=><option key={id} value={id}>{p.name}</option>)}</select></label>
    <label>Display name<input required maxLength={20} value={name} disabled={busy} onChange={e=>setName(e.target.value)} placeholder="Your smash name"/></label>
    <label>Avatar<select value={avatar} disabled={busy} onChange={e=>setAvatar(Number(e.target.value))}>{characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <div className="player-actions"><Avatar avatar={avatar}/><button className="text-button" disabled={busy||!name.trim()} type="submit">{adding?'Create player':'Save player'}</button><button className="text-button" type="button" disabled={busy} onClick={()=>{setAdding(!adding);setName(adding?player.name:'');setAvatar(adding?player.avatar:Object.keys(s.players).length%25);setMessage('');}}>{adding?'Cancel':'New player'}</button></div>
    <p className="small" role="status">{busy?'Finish this round to change players.':message||'Share this browser. Take turns. Settle the score.'}</p>
  </form>;
}
export function Leaderboard({compact=false}) {
  const s=useGame(), [period,setPeriod]=useState('daily'),[now,setNow]=useState(()=>new Date()), list=useRef(null),positions=useRef(new Map());
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(timer);},[]);
  const rows=rankings(s.players,s.days,period,now,true), top=rows.slice(0,10), mine=rows.find(r=>r.id===s.playerId);
  const order=top.map(r=>r.id).join(',');
  useLayoutEffect(()=>{
    const next=new Map();
    for(const el of list.current?.children || []){
      const y=el.offsetTop, old=positions.current.get(el.dataset.player);next.set(el.dataset.player,y);
      if(old!==undefined&&old!==y&&!s.reducedMotion)el.animate([{transform:`translateY(${old-y}px)`},{transform:'translateY(0)'}],{duration:350,easing:'ease-out'});
    }
    positions.current=next;
  },[order,period,s.reducedMotion]);
  const body=<>
    <div className="period-tabs" role="group" aria-label="Leaderboard period">{[['daily','Daily'],['weekly','Weekly'],['all','All-time']].map(([id,label])=><button key={id} aria-pressed={period===id} onClick={()=>setPeriod(id)}>{label}</button>)}</div>
    <p className="board-note">Local players + fictional demo rivals · arcade dollars{period==='weekly'?' · Mon–Sun':''}</p>
    <h4 className="smashers-title">TOP SMASHERS</h4>
    <div className="podium">{[0,1,2].map(i=>{const p=top[i];return <div key={p?.id||i} className={'podium-place place-'+i}>
      <span className="medal">{['1st','2nd','3rd'][i]}</span>{p?<><Avatar avatar={p.avatar}/><b title={p.name}>{p.name}</b>{p.demo&&<small className="demo-badge">DEMO</small>}<strong><AnimatedMoney value={p.score}/></strong><small>{p.combo}× combo<br/>{p.smashed} blocks</small></>:<><span className="open-place">?</span><small>Up for grabs</small></>}
    </div>;})}</div>
    <div className="ranking-list" ref={list}>{top.map(p=><div data-player={p.id} data-demo={p.demo||undefined} key={p.id} className={'ranking-row '+(p.id===s.playerId?'is-you':'')}><span className="rank-number">{p.rank}</span><Avatar avatar={p.avatar}/><span className="player-name">{p.name}{p.demo&&<small className="demo-badge">DEMO</small>}{p.id===s.playerId&&<small>YOU</small>}</span><strong><AnimatedMoney value={p.score}/></strong></div>)}</div>
    {!top.length&&<p className="board-note">Be the first to set a score.</p>}
    <p className="board-note">{mine?`Your position: #${mine.rank} · ${money(mine.score)}`:'Smash a block to join this board.'}</p>
    {!compact&&<PlayerEditor/>}
  </>;
  return compact?<details className="competition-panel" open><summary>Leaderboard <span>TOP 10</span></summary>{body}<details className="player-details"><summary>Your player</summary><PlayerEditor/></details></details>:<section className="competition-panel expanded">{body}</section>;
}
const activityText=e=>e.type==='combo'?`reached a ${e.value}× combo!`:e.type==='blocks'?`destroyed ${e.value} blocks!`:e.type==='golden'?'found the Golden Hammer!':e.type==='jackpot'?`hit a ${money(e.value)} jackpot!`:e.type==='lucky'?`found ${money(e.value)} in a lucky block!`:e.type==='mystery'?`uncovered ${money(e.value)}!`:`won ${money(e.value)}!`;
export function ActivityFeed() {
  const events=useGame(s=>s.activity),[now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  const visible=events.filter(e=>e.at>now-12000);
  return <section className="activity-panel"><div className="section-heading"><h3>Smash activity</h3><span>THIS BROWSER</span></div><div className="activity-items" role="log" aria-label="Recent smash activity" aria-live="polite" aria-relevant="additions">{visible.map(e=><div className={'activity-row '+(e.value>=2500||e.type==='jackpot'?'big-win':'')} key={e.id}><Avatar avatar={e.avatar}/><p><b>{e.name}</b> {activityText(e)}<small>{e.source==='local'?'Local play':'Multiplayer'} · {e.type==='jackpot'?'★ JACKPOT':e.type==='combo'?'↗ COMBO RUSH':e.type==='golden'?'✦ POWER UP':'✧ NICE HIT'}</small></p></div>)}</div>{!visible.length&&<p className="board-note">Quiet stack. Your next smash could change that.</p>}<div className="reward-foot">ARCADE REWARDS · NO CASH VALUE</div></section>;
}
