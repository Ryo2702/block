import {test,expect} from '@playwright/test';
test('play, collapse, reload, pause, results and saved progress',async({page})=>{
 test.setTimeout(45000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.screenshot({path:'/tmp/crypto-meme-smash-desktop.png',fullPage:true});await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Next round length').selectOption('30');await page.getByRole('button',{name:'Close dialog'}).click();await page.getByRole('button',{name:'Let’s smash'}).click();
 const canvas=page.locator('canvas');const rect=await canvas.boundingBox();
 const hit=async(y)=>{await canvas.click({position:{x:rect.width*.5,y:rect.height*y/600}});await page.waitForTimeout(360);};
 await hit(505);await hit(505);await expect(page.locator('.stats-bar>div').nth(2)).toContainText('01');
 await expect(page.locator('.combo-value')).toContainText('2×');
 await page.getByRole('button',{name:'Pop gun',exact:false}).click();
 for(let i=0;i<6;i++){await hit(505);}
 await expect(page.locator('.reload')).toContainText('0/6');await page.locator('.reload').click();await expect(page.locator('.reload')).toContainText('6/6',{timeout:3000});
 await page.getByRole('button',{name:'Pause game',exact:true}).click();await expect(page.getByText('Chaos on hold.')).toBeVisible();
 const time=await page.locator('.timer').textContent();await page.waitForTimeout(1200);await expect(page.locator('.timer')).toHaveText(time);
 await page.getByRole('button',{name:'Back to smashing'}).click();
 await expect(page.getByText('TIME’S UP. BEAUTIFUL MESS.')).toBeVisible({timeout:35000});
 await page.reload();await expect(page.locator('.stats-bar').last()).not.toContainText('NaN');
 await page.getByRole('button',{name:'Leaderboard',exact:true}).click();await expect(page.locator('.leaderboard>div')).toHaveCount(1);
 expect(errors).toEqual([]);
});
test('mobile controls, settings, gallery and unavailable wallet',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.getByRole('button',{name:'Let’s smash'})).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Connect wallet'}).click();await expect(page.getByText('No compatible Solana wallet detected.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Close wallet'}).click();
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Reduced motion').check();await page.getByLabel('Next round length').selectOption('30');await page.getByRole('button',{name:'Close dialog'}).click();
 await page.getByRole('button',{name:'Meet the misfits',exact:false}).click();await expect(page.locator('.character-grid article')).toHaveCount(25);await page.getByRole('button',{name:'Close dialog'}).click();
 await page.screenshot({path:'/tmp/crypto-meme-smash-mobile.png',fullPage:true});
});
test('wallet standard connection, account changes and disconnect',async({page})=>{
 await page.addInitScript(()=>{let change;const account={address:'SoLaNaTestPublicAddress123456789',chains:['solana:mainnet'],features:[],publicKey:new Uint8Array(32)};const wallet={version:'1.0.0',name:'Phantom',icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',chains:['solana:mainnet'],accounts:[],features:{'standard:connect':{version:'1.0.0',connect:async()=>({accounts:[account]})},'standard:disconnect':{version:'1.0.0',disconnect:async()=>{}},'standard:events':{version:'1.0.0',on:(event,cb)=>{change=cb;return()=>{};}}}};window.addEventListener('wallet-standard:app-ready',e=>e.detail.register(wallet));window.walletChange=()=>change({accounts:[]});});
 await page.goto('/');await page.getByRole('button',{name:'Connect wallet'}).click();await page.getByRole('button',{name:'Phantom',exact:true}).click();await expect(page.locator('.wallet-button')).toContainText('SoLa…6789');
 await page.locator('.wallet-button').click();await page.getByRole('button',{name:'Disconnect wallet'}).click();await expect(page.locator('.wallet-button')).toContainText('Connect wallet');
});

test('timer ends a round and events expire without user input',async({page})=>{
 test.setTimeout(45000);await page.goto('/');await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Next round length').selectOption('30');await page.getByRole('button',{name:'Close dialog'}).click();await page.getByRole('button',{name:'Let’s smash'}).click();await expect(page.locator('.event-toast')).toBeVisible({timeout:17000});await expect(page.locator('.event-toast')).not.toBeVisible({timeout:12000});await expect(page.getByText('TIME’S UP. BEAUTIFUL MESS.')).toBeVisible({timeout:15000});
});

test('Start and attacks work when storage is blocked and audio cannot initialize', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'QuotaExceededError'); };
    window.AudioContext = class { constructor() { throw new Error('Audio unavailable'); } };
    window.webkitAudioContext = undefined;
  });
  await page.goto('/');
  await page.getByRole('button', {name:'Let’s smash'}).click();
  await expect(page.locator('.play-hint')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Browser storage is unavailable');
  const canvas = page.locator('canvas');
  const rect = await canvas.boundingBox();
  for (let i = 0; i < 2; i++) {
    await canvas.click({position:{x:rect.width / 2,y:rect.height * 505 / 600}});
    await page.waitForTimeout(360);
  }
  await expect(page.locator('.stats-bar>div').nth(2)).toContainText('01');
  await expect(page.locator('.timer')).not.toHaveText('1:00');
  expect(errors).toEqual([]);
});

test('missing audio support does not block Start', async ({page}) => {
  await page.addInitScript(() => {window.AudioContext = undefined;window.webkitAudioContext = undefined;});
  await page.goto('/');
  await page.getByRole('button', {name:'Let’s smash'}).click();
  await expect(page.locator('.play-hint')).toBeVisible();
});
