import { create } from 'zustand';
import { safeStorage } from './storage';
import { addResult, acceptActivity, migrateCompetition } from './competition';
import { persist, createJSONStorage } from 'zustand/middleware';
export const useGame = create(persist((set, get) => ({
  screen: 'ready', score: 0, hits: 0, combo: 1, bestCombo: 1, roundBest: 1, smashed: 0, round: 1, time: 60, ammo: 6, reloading: false, weapon: 'hammer', event: null, eventLeft: 0, recent: [],
  sound: true, music: false, reducedMotion: typeof matchMedia!=='undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches, duration: 60, leaderboard: [], stats: {}, unlocked: [], highScore: 0, storageError: false,
  players: {local:{name:'You',avatar:0}}, playerId:'local', days:{}, activity:[], goldenLeft:0, announcement:null,
  set: patch => set(patch),
  savePlayer: (name, avatar, createNew=false) => {
    const s=get(); if(typeof name!=='string')return false; name=name.trim().slice(0,20);
    if (!name || !Number.isInteger(avatar) || avatar<0 || avatar>=25 || ['playing','paused'].includes(s.screen)) return false;
    const id=createNew?crypto.randomUUID():s.playerId;
    set({players:{...s.players,[id]:{...(createNew?{}:s.players[id]),name,avatar}},playerId:id}); return true;
  },
  selectPlayer: id => {if(get().players[id] && !['playing','paused'].includes(get().screen))set({playerId:id});},
  receiveActivity: event => {
    if(!acceptActivity(event)||event.at>Date.now()+5000||event.at<Date.now()-12000)return;
    set(s=>({activity:[event,...s.activity.filter(e=>e.id!==event.id && e.at>Date.now()-12000)].slice(0,4)}));
  },
  recordPlay: (patch, amount, events=[]) => {
    const s=get(), player=s.players[s.playerId], at=Date.now();
    const activity=events.map(e=>({...e,id:crypto.randomUUID(),playerId:s.playerId,...player,at,source:'local'})).filter(acceptActivity);
    set({...patch, highScore:Math.max(s.highScore,patch.score),
      players:{...s.players,[s.playerId]:{...player,highScore:Math.max(player.highScore||0,patch.score),bestCombo:Math.max(player.bestCombo||1,patch.combo)}},
      days:addResult(s.days,s.playerId,{amount,combo:patch.combo,smashed:(patch.smashed??s.smashed)-s.smashed}),
      activity:[...activity,...s.activity.filter(e=>e.at>at-12000)].slice(0,4)});
  },
  start: () => set({ screen: 'playing', score: 0, hits: 0, combo: 1, roundBest: 1, smashed: 0, round: 1, time: get().duration, ammo: 6, reloading: false, event: null, eventLeft: 0, recent: [], goldenLeft:0, announcement:null }),
  finish: () => { const s=get(); if(s.screen!=='playing') return; const record={score:s.score,combo:s.roundBest,smashed:s.smashed,date:new Date().toISOString(),id:Date.now()}; set({screen:'results', highScore:Math.max(s.highScore,s.score), leaderboard:[...s.leaderboard,record].sort((a,b)=>b.score-a.score).slice(0,10), event:null,goldenLeft:0,announcement:null}); },
}), { name:'crypto-meme-smash-v1', storage:createJSONStorage(() => safeStorage(() => localStorage, () => useGame.setState({storageError:true}))), merge:(saved,current)=>({...current,...migrateCompetition(saved)}), partialize:s=>({players:s.players,playerId:s.playerId,days:s.days,sound:s.sound,music:s.music,reducedMotion:s.reducedMotion,duration:s.duration,weapon:s.weapon,leaderboard:s.leaderboard,stats:s.stats,unlocked:s.unlocked,highScore:s.highScore,bestCombo:s.bestCombo}) }));
