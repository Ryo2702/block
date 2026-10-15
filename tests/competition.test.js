import test from 'node:test';
import assert from 'node:assert/strict';
import { addResult, rankings, migrateCompetition, acceptActivity } from '../src/store/competition.js';
import { specialBlock, specialReward } from '../src/game/rules.js';
const players={a:{name:'Ace',avatar:0},b:{name:'Bee',avatar:1}};
const result={amount:100,combo:3,smashed:1};
test('calendar day and Monday week boundaries include year changes without double counting',()=>{
 let days={};
 for(const [id,date,amount] of [['a','2025-12-28T12:00:00',900],['a','2025-12-29T12:00:00',100],['a','2026-01-01T12:00:00',200],['b','2026-01-01T12:00:00',400],['b','2026-01-02T12:00:00',999]])days=addResult(days,id,{...result,amount},new Date(date));
 const now=new Date('2026-01-01T23:59:59');
 assert.deepEqual(rankings(players,days,'daily',now).map(p=>[p.id,p.score]),[['b',400],['a',200]]);
 assert.deepEqual(rankings(players,days,'weekly',now).map(p=>[p.id,p.score]),[['b',400],['a',300]]);
 assert.deepEqual(rankings(players,days,'all',now).map(p=>[p.id,p.score]),[['a',1200],['b',400]]);
 assert.equal(rankings(players,days,'daily',new Date('2026-01-02T00:00:00'))[0].score,999);
});
test('live updates reorder players and aggregate combo and blocks without mutating previous totals',()=>{
 const first=addResult({},'a',result), second=addResult(first,'b',{...result,amount:200});
 const third=addResult(second,'a',{amount:300,combo:10,smashed:2});
 assert.equal(rankings(players,second,'daily')[0].id,'b');
 assert.deepEqual(rankings(players,third,'daily')[0],{...players.a,id:'a',score:400,combo:10,smashed:3,rank:1});
 assert.equal(rankings(players,first,'daily')[0].score,100);
});
test('legacy records migrate once and retain the original round history',()=>{
 const saved={leaderboard:[{score:75,combo:5,smashed:3,date:'2025-12-30T12:00:00'}]};
 const migrated=migrateCompetition(saved);
 assert.equal(rankings(migrated.players,migrated.days,'all',new Date('2026-01-01'))[0].score,75);
 assert.equal(migrated.leaderboard,saved.leaderboard);
 assert.deepEqual(migrateCompetition(migrated),migrated);
});
test('activity contract rejects invalid amounts, avatars and sources',()=>{
 const event={id:'hit-1',playerId:'a',name:'Ace',avatar:0,type:'win',value:50,at:Date.now(),source:'local'};
 assert.ok(acceptActivity(event));
 for(const patch of [{value:NaN},{value:-1},{avatar:25},{source:'fake'},{name:''},{type:'unknown'}])assert.ok(!acceptActivity({...event,...patch}));
});
test('special blocks are rare and mystery outcomes cover money and timed damage',()=>{
 assert.deepEqual([0,.025,.085,.16,.99].map(specialBlock),['jackpot','lucky','mystery',null,null]);
 assert.equal(specialReward('jackpot').amount,2500);
 assert.equal(specialReward('lucky').amount,250);
 assert.equal(specialReward('mystery',0).amount,500);
 assert.equal(specialReward('mystery',.9).golden,true);
 assert.deepEqual(specialReward(null),{amount:0});
});

test('first visit hydrates a default local player without saved state',()=>{
 const saved=migrateCompetition();
 assert.equal(saved.playerId,'local');assert.equal(saved.players.local.name,'You');assert.deepEqual(saved.days,{});
});

test('demo rivals fill each period without changing real records or local-only rankings',()=>{
 const days=addResult({},'a',{...result,amount:2000}),before=JSON.stringify(days);
 for(const [period,factor] of [['daily',1],['weekly',5],['all',24]]){
  const rows=rankings(players,days,period,new Date(),true);
  assert.equal(rows.filter(p=>p.demo).length,10);
  assert.equal(rows.find(p=>p.id==='demo-0').score,1800*factor);
  assert.equal(rows.find(p=>p.id==='a').score,2000);
  assert.deepEqual(rows.map(p=>p.rank),Array.from({length:11},(_,i)=>i+1));
 }
 assert.equal(JSON.stringify(days),before);
 assert.equal(rankings(players,days,'daily').length,1);
 assert.equal(rankings(players,days,'daily',new Date(),true)[0].id,'a');
});
