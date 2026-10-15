import test from 'node:test';
import assert from 'node:assert/strict';
import { multiplier, reward, hitTest, targets, EVENTS } from '../src/game/rules.js';
test('combo thresholds advance at 2, 5, 10 and 20 hits',()=>{assert.deepEqual([0,1,2,4,5,9,10,19,20].map(multiplier),[1,1,2,2,3,3,5,5,10]);});
test('weighted reward boundaries and modifiers',()=>{
 assert.deepEqual(reward({},()=>0),{tier:'Common',amount:1});
 assert.deepEqual(reward({damage:2},()=>.999999),{tier:'Legendary',amount:10000});
 assert.equal(reward({damage:2,combo:3,event:EVENTS[0]},()=>0).amount,6);
 assert.equal(reward({damage:2,destroyed:true,event:EVENTS[2]},()=>0).amount,101);
 assert.equal(reward({damage:2,destroyed:false,event:EVENTS[2]},()=>0).amount,1);
});
test('hits ignore destroyed creatures and support removal collapses the stack',()=>{
 const blocks=[{id:1,x:400,y:505,w:190,h:170,dead:true},{id:2,x:400,y:400,w:190,h:170},{id:3,x:400,y:295,w:190,h:170}];
 assert.equal(hitTest(blocks,400,505),undefined);assert.equal(hitTest(blocks,400,400).id,2);assert.equal(hitTest(blocks,5,5),undefined);
 assert.deepEqual(targets(blocks),[{id:2,y:505},{id:3,y:400}]);
});
test('all rewards are finite positive integers across event and rarity combinations',()=>{for(const event of [null,...EVENTS])for(let rarity=0;rarity<5;rarity++)for(let i=0;i<100;i++){const r=reward({event,rarity,damage:.5,combo:10,destroyed:true});assert.ok(Number.isSafeInteger(r.amount)&&r.amount>0);}});
