import {test,expect} from '@playwright/test';

test('local players, immediate rankings, real activity, persistence and mobile collapse',async({page})=>{
 await page.goto('/');
 await page.locator('.player-details>summary').click();
 await page.getByLabel('Display name').fill('SmashKing');
 await page.getByRole('button',{name:'Save player',exact:true}).click();
 await page.getByRole('button',{name:'Let’s smash'}).click();
 await page.evaluate(async()=>{
  const {useGame}=await import('/src/store/useGame.js');
  const s=useGame.getState();s.recordPlay({score:2500,combo:5,smashed:1},2500,[{type:'jackpot',value:2500}]);
 });
 await expect(page.locator('.ranking-row.is-you')).toContainText('SmashKing');
 await expect(page.locator('.ranking-row.is-you')).toContainText('$2,500');
 await expect(page.locator('.activity-row')).toContainText('SmashKing hit a $2,500 jackpot!');
 await expect(page.locator('.activity-row')).toContainText('Local play');
 await expect(page.getByLabel('Display name')).toBeDisabled();
 await page.getByRole('button',{name:'Pause game',exact:true}).click();
 await page.getByRole('button',{name:'End round',exact:true}).click();
 await expect(page.locator('.results')).toBeVisible();
 await page.getByRole('button',{name:'New player',exact:true}).click();
 await page.getByLabel('Display name').fill('SOLHunter');
 await page.getByRole('button',{name:'Create player',exact:true}).click();
 await page.getByRole('button',{name:'One more round',exact:false}).click();
 await page.evaluate(async()=>{const {useGame}=await import('/src/store/useGame.js');useGame.getState().recordPlay({score:5000,combo:10,smashed:2},5000,[{type:'win',value:5000}]);});
 await expect(page.locator('.ranking-row').first()).toContainText('SOLHunter');
 await page.reload();
 await expect(page.locator('.ranking-row')).toHaveCount(10);
 await expect(page.locator('.ranking-row:not([data-demo=true])')).toHaveCount(2);
 await expect(page.locator('.ranking-row.is-you')).toContainText('$5,000');
 await expect(page.locator('.activity-row')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/smash-competition-mobile.png',fullPage:true});
 await page.locator('.competition-panel>summary').click();
 await expect(page.locator('.ranking-list')).not.toBeVisible();
});

test('actual engine rewards, golden expiry, dodge and chain collapse',async({page})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'Let’s smash'})).toBeEnabled();
 const result=await page.evaluate(async()=>{
  const {Engine}=await import('/src/game/engine.js'),{useGame}=await import('/src/store/useGame.js');
  const canvas=document.createElement('canvas');let engine;
  await new Promise(resolve=>{engine=new Engine(canvas,resolve);});engine.destroy();
  useGame.getState().start();useGame.setState({sound:false,reducedMotion:true});
  const original=Math.random;Math.random=()=>.9;
  try{
   engine.reset();engine.blocks=[engine.block(0,505,true),engine.block(1,400,true)];
   const b=engine.blocks[0];b.hp=2;b.special='mystery';engine.attack(b.x,b.y);
   const golden=useGame.getState().goldenLeft, fallen=engine.blocks[1].target;
   const boosted=engine.blocks[1];boosted.hp=4;boosted.special=null;engine.elapsed+=.4;engine.attack(boosted.x,boosted.y);
   const dead=boosted.dead;
   engine.update(8.1);const expired=useGame.getState().goldenLeft;
   engine.blocks=[engine.block(5,505,true)];Math.random=()=>0;
   const angry=engine.blocks[0],hp=angry.hp;engine.elapsed+=.4;engine.attack(angry.x,angry.y);
   const dodge=angry.dodged&&angry.hp===hp&&angry.x!==400;
   engine.elapsed+=.4;engine.attack(angry.x,angry.y);const retry=angry.hp<hp;
   engine.blocks=[engine.block(0,505,true)];const jackpot=engine.blocks[0];jackpot.hp=1;jackpot.special='jackpot';engine.elapsed+=.4;engine.attack(jackpot.x,jackpot.y);
   const activity=useGame.getState().activity;return {golden,fallen,dead,expired,dodge,retry,jackpot:activity.some(e=>e.type==='jackpot'),score:useGame.getState().score};
  }finally{Math.random=original;engine.destroy();}
 });
 expect(result).toMatchObject({golden:8,fallen:505,dead:true,expired:0,dodge:true,retry:true,jackpot:true});
 expect(result.score).toBeGreaterThan(2500);
});

test('activity expires without another hit and invalid transport events are ignored',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{
  const {useGame}=await import('/src/store/useGame.js');
  const e={id:'expires',playerId:'local',name:'You',avatar:0,type:'combo',value:5,at:Date.now()-11000,source:'local'};
  useGame.getState().receiveActivity(e);useGame.getState().receiveActivity({...e,id:'invalid',value:NaN});
 });
 await expect(page.locator('.activity-row')).toHaveCount(1);
 await expect(page.locator('.activity-row')).toHaveCount(0,{timeout:4000});
});

test('music toggle, fictional marquee and interactive story preserve the game',async({page})=>{
 await page.goto('/');
 await expect(page.getByText('FICTIONAL PLAYERS')).toBeVisible();
 await page.getByRole('button',{name:'Pause demo parade',exact:true}).click();
 await expect(page.locator('.demo-ticker')).toHaveAttribute('data-paused','true');
 await page.getByRole('button',{name:'Enable music',exact:true}).click();
 await expect(page.getByRole('button',{name:'Mute music',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Story & how to play',exact:false}).click();
 await expect(page.getByRole('heading',{name:'The market went weird.'})).toBeVisible();
 await page.getByRole('button',{name:'Next chapter',exact:false}).click();
 await page.getByRole('button',{name:'Pop therapy',exact:true}).click();
 await expect(page.getByRole('button',{name:'Pop therapy',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Next chapter',exact:false}).click();
 await expect(page.locator('.story-tip')).toContainText('Golden Hammer');
 await page.getByRole('button',{name:'Next chapter',exact:false}).click();
 await page.getByRole('button',{name:'Back to the arcade',exact:false}).click();
 await page.getByRole('button',{name:'Let’s smash'}).click();
 await expect(page.locator('.play-hint')).toBeVisible();
 const hydration=await page.evaluate(async()=>{const {useGame}=await import('/src/store/useGame.js');return useGame.persist.hasHydrated();});
 expect(hydration).toBe(true);
 await page.reload();
 await expect(page.getByRole('button',{name:'Mute music',exact:true})).toBeVisible();
});

test('demo leaderboard rivals appear across periods without being saved as local players',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.ranking-row[data-demo=true]')).toHaveCount(10);
 await expect(page.locator('.podium .demo-badge')).toHaveCount(3);
 await expect(page.locator('.ranking-row').first()).toContainText('$1,800');
 await page.getByRole('button',{name:'Weekly',exact:true}).click();
 await expect(page.locator('.ranking-row').first()).toContainText('$9,000');
 await page.getByRole('button',{name:'All-time',exact:true}).click();
 await expect(page.locator('.ranking-row').first()).toContainText('$43,200');
 await page.locator('.player-details>summary').click();
 await expect(page.getByLabel('Local player').locator('option')).toHaveCount(1);
 await expect(page.locator('.activity-row')).toHaveCount(0);
});
