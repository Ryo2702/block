import { create } from 'zustand';
import { safeStorage } from './storage';
import { persist, createJSONStorage } from 'zustand/middleware';
export const useGame = create(persist((set, get) => ({
  screen: 'ready', score: 0, hits: 0, combo: 1, bestCombo: 1, roundBest: 1, smashed: 0, round: 1, time: 60, ammo: 6, reloading: false, weapon: 'hammer', event: null, eventLeft: 0, recent: [],
  sound: true, music: false, reducedMotion: typeof matchMedia!=='undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches, duration: 60, leaderboard: [], stats: {}, unlocked: [], highScore: 0, storageError: false,
  set: patch => set(patch),
  start: () => set({ screen: 'playing', score: 0, hits: 0, combo: 1, roundBest: 1, smashed: 0, round: 1, time: get().duration, ammo: 6, reloading: false, event: null, eventLeft: 0, recent: [] }),
  finish: () => { const s=get(); if(s.screen!=='playing') return; const record={score:s.score,combo:s.roundBest,smashed:s.smashed,date:new Date().toISOString(),id:Date.now()}; set({screen:'results', highScore:Math.max(s.highScore,s.score), leaderboard:[...s.leaderboard,record].sort((a,b)=>b.score-a.score).slice(0,10), event:null}); },
}), { name:'crypto-meme-smash-v1', storage:createJSONStorage(() => safeStorage(() => localStorage, () => useGame.setState({storageError:true}))), partialize:s=>({sound:s.sound,music:s.music,reducedMotion:s.reducedMotion,duration:s.duration,weapon:s.weapon,leaderboard:s.leaderboard,stats:s.stats,unlocked:s.unlocked,highScore:s.highScore,bestCombo:s.bestCombo}) }));
