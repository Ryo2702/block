import gsap from 'gsap';
import { characters, loadSprites } from './characters';
import { EVENTS, hitTest, targets, multiplier, reward, money, specialBlock, specialReward } from './rules';
import { useGame } from '../store/useGame';
import { sound } from './audio';
export class Engine {
  constructor(canvas, onReady) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.blocks=[];this.particles=[];this.labels=[];this.sprites=[];this.elapsed=0;this.lastHit=-10;this.lastAttack=-10;this.eventAt=12;this.eventEnd=0;this.reloadEnd=0;this.id=0;this.hover=null;this.disposed=false;this.last=0;this.dirty=true;this.shake=0;this.swing={t:0,x:0,y:0,weapon:'hammer'};
    this.resize=()=>{const dpr=Math.min(devicePixelRatio||1,2);canvas.width=800*dpr;canvas.height=600*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);};this.resize();
    this.pointer=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*800,y:(e.clientY-r.top)/r.height*600};};
    this.down=e=>{const p=this.pointer(e);this.attack(p.x,p.y);};this.move=e=>{const p=this.pointer(e);this.hover=hitTest(this.blocks,p.x,p.y)?.id;this.dirty=true;};this.leave=()=>{this.hover=null;this.dirty=true;};
    canvas.addEventListener('pointerdown',this.down);canvas.addEventListener('pointermove',this.move);canvas.addEventListener('pointerleave',this.leave);
    this.unsubscribe=useGame.subscribe((s,p)=>{this.dirty=true;if(s.screen==='playing'&&p.screen!=='playing'&&p.screen!=='paused'){this.reset();} if(s.reloading&&!p.reloading) this.reloadEnd=this.elapsed+1.1;});
    loadSprites().then(s=>{if(this.disposed)return;this.sprites=s;this.reset();onReady(null);}).catch(e=>onReady(e.message));
    this.frame=requestAnimationFrame(t=>this.loop(t));
  }
  reset(){this.dirty=true;this.blocks.forEach(b=>gsap.killTweensOf(b));this.blocks=[];this.particles=[];this.labels=[];this.elapsed=0;this.lastHit=-10;this.lastAttack=-10;this.eventAt=12;this.eventEnd=0;this.reloadEnd=0;this.nextStack=0;this.goldenEnd=0;this.announcementEnd=0;this.spawn(true);}
  spawn(initial=false){const order=initial?[0,14,5,18]:Array.from({length:4},()=>Math.floor(Math.random()*25));this.blocks=order.map((n,i)=>this.block(n,505-i*105,initial));}
  block(n,y,settled=false,whale=false){const c=characters[n];return {id:this.id++,c,x:400+(Math.random()-.5)*12,y:settled?y:y-440,target:y,vy:0,w:whale?245:195,h:whale?208:170,hp:c.hp*(whale?2:1),maxHp:c.hp*(whale?2:1),rotation:0,sx:1,sy:1,flash:0,dead:false,state:'idle',special:specialBlock(),dodged:false,born:this.elapsed};}
  attack(x,y){const s=useGame.getState();if(s.screen!=='playing'||!this.sprites.length)return;if(this.elapsed-this.lastAttack<(s.weapon==='hammer'?.32:.19))return;if(s.weapon==='gun'&&(s.reloading||s.ammo===0)){if(!s.reloading)s.set({reloading:true});return;}
    this.lastAttack=this.elapsed;if(s.weapon==='gun')s.set({ammo:s.ammo-1});const b=hitTest(this.blocks,x,y);sound(s.weapon,s.sound);
    gsap.killTweensOf(this.swing);Object.assign(this.swing,{t:1,x,y,weapon:s.weapon});gsap.to(this.swing,{t:0,duration:.32,ease:'power2.out'});
    if(!b){s.set({hits:0,combo:1});this.labels.push({x,y,text:'MISS',life:.7,color:'#8c857d'});return;}
    if([5,6,13].includes(b.c.id)&&!b.dodged&&Math.random()<.18){
      b.dodged=true;b.x+=b.c.id%2?85:-85;b.returnAt=this.elapsed+1;
      s.set({hits:0,combo:1});this.labels.push({x:b.x,y:b.y-40,text:'NOT TODAY!',life:.8,color:'#9d6b57'});return;
    }
    const hits=this.elapsed-this.lastHit<2.8?s.hits+1:1,combo=multiplier(hits);this.lastHit=this.elapsed;
    const damage=Math.min(b.hp,(s.weapon==='hammer'?(s.goldenLeft?4:2):1)/(s.event?.armor||1));b.hp-=damage;b.state=b.hp<=0?'destroyed':'hit';b.flash=1;
    if(!s.reducedMotion){this.shake=s.weapon==='hammer'?5:2;gsap.killTweensOf(b);b.sx=1.2;b.sy=.8;b.rotation=(b.c.id-12)*.018;gsap.to(b,{sx:1,sy:1,rotation:0,flash:0,duration:.45,ease:'elastic.out(1,.35)'});}else{b.flash=0;}
    const result=reward({rarity:b.c.rarity,damage,combo,event:s.event,destroyed:b.hp<=0});
    const special=b.hp<=0?specialReward(b.special):{amount:0};
    result.amount+=special.amount;
    if(special.type){
      s.set({announcement:special.label});this.announcementEnd=this.elapsed+2.5;
      if(special.golden){this.goldenEnd=this.elapsed+8;s.set({goldenLeft:8});}
      if(special.type==='jackpot')sound('jackpot',s.sound);
    }
    this.labels.push({x:b.x+(Math.random()-.5)*90,y:b.y-35,text:'+'+money(result.amount),life:1.1,color:result.tier==='Legendary'?'#be851d':'#365d3e'});
    const patch={score:s.score+result.amount,hits,combo,bestCombo:Math.max(s.bestCombo,combo),roundBest:Math.max(s.roundBest,combo),recent:[{...result,name:b.c.name,id:this.id++},...s.recent].slice(0,4)};
    if(combo>s.combo)sound('combo',s.sound);else sound(result.tier==='Legendary'?'jackpot':'reward',s.sound);
    this.burst(x,y,b.hp<=0?24:10);
    if(b.hp<=0){b.dead=true;b.state='popping';patch.smashed=s.smashed+1;patch.stats={...s.stats,[b.c.id]:(s.stats[b.c.id]||0)+1};patch.unlocked=[...new Set([...s.unlocked,b.c.id])];sound('pop',s.sound);gsap.to(b,{sx:1.5,sy:1.5,flash:0,duration:.2});for(const t of targets(this.blocks)){const above=this.blocks.find(v=>v.id===t.id);above.target=t.y;above.state='falling';if(!s.reducedMotion){above.rotation=(above.c.id%2?1:-1)*.12;gsap.to(above,{rotation:0,duration:.5});}}if(!this.blocks.some(v=>!v.dead))this.nextStack=this.elapsed+.5;}
    const events=[];
    if(special.type)events.push({type:special.type,value:special.amount});
    else if(b.dead || result.amount>=1000)events.push({type:result.tier==='Legendary'?'jackpot':'win',value:result.amount});
    if(combo>s.combo && combo>=3)events.push({type:'combo',value:combo});
    if(patch.smashed && patch.smashed%20===0)events.push({type:'blocks',value:patch.smashed});
    s.recordPlay(patch,result.amount,events);
  }
  burst(x,y,count){if(useGame.getState().reducedMotion)return;count=Math.min(count,12);for(let i=0;i<count;i++)this.particles.push({x,y,vx:(Math.random()-.5)*310,vy:-50-Math.random()*230,life:.4+Math.random()*.4,size:3+Math.random()*6,color:['#b3c28e','#dba478','#d3bf85','#9e93af'][i%4]});}
  update(dt){const s=useGame.getState();if(s.screen!=='playing')return;this.elapsed+=dt;const remaining=Math.max(0,s.duration-this.elapsed);if(Math.ceil(remaining)!==s.time)s.set({time:Math.ceil(remaining)});if(remaining<=0){s.finish();return;}
    if(this.elapsed-this.lastHit>2.8&&s.hits)s.set({hits:0,combo:1});if(s.reloading&&this.elapsed>=this.reloadEnd){s.set({reloading:false,ammo:6});sound('reload',s.sound);}
    if(this.nextStack&&this.elapsed>=this.nextStack){this.nextStack=0;this.spawn();s.set({round:s.round+1});}
    if(this.elapsed>=this.eventAt){const event=EVENTS[Math.floor(Math.random()*EVENTS.length)];s.set({event,eventLeft:8});this.eventEnd=this.elapsed+8;this.eventAt=this.elapsed+18;if(event.whale){const live=this.blocks.filter(b=>!b.dead);this.blocks.push(this.block(17,505-live.length*105,false,true));}sound('combo',s.sound);}
    if(s.event){const left=Math.max(0,Math.ceil(this.eventEnd-this.elapsed));if(left!==s.eventLeft)s.set({eventLeft:left});if(!left)s.set({event:null});}
    const goldenLeft=Math.max(0,Math.ceil((this.goldenEnd||0)-this.elapsed));
    if(goldenLeft!==s.goldenLeft)s.set({goldenLeft});
    if(s.announcement && this.elapsed>=this.announcementEnd)s.set({announcement:null});
    dt=Math.min(dt,.04);
    for(const b of this.blocks){if(b.returnAt && this.elapsed>=b.returnAt){b.x=400;b.returnAt=0;}if(b.dead){b.death=(b.death||0)+dt;continue;}if(b.y<b.target){b.vy+=1800*dt;b.y+=b.vy*dt;b.state='falling';if(b.y>=b.target){b.y=b.target;b.vy=0;b.state='stunned';b.stunEnd=this.elapsed+.3;sound('fall',s.sound);if(!s.reducedMotion){b.sy=.86;b.sx=1.1;gsap.to(b,{sx:1,sy:1,duration:.3});}}}else if(b.state==='stunned'&&this.elapsed>b.stunEnd)b.state=b.hp<b.maxHp?'damaged':'idle';else if(b.state==='hit'&&!b.flash)b.state='damaged';}
    this.blocks=this.blocks.filter(b=>!b.dead||b.death<.2);
    for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=650*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
    for(const l of this.labels){if(!s.reducedMotion)l.y-=55*dt;l.life-=dt;}this.labels=this.labels.filter(l=>l.life>0);this.shake*=.8;
  }
  draw(){const c=this.ctx,s=useGame.getState();c.clearRect(0,0,800,600);c.save();if(!s.reducedMotion)c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);
    c.fillStyle='#d7ddc9';c.beginPath();c.ellipse(400,552,190,23,0,0,Math.PI*2);c.fill();c.fillStyle='#b4bca5';c.beginPath();c.roundRect(263,535,274,22,10);c.fill();c.fillStyle='#e5e6d7';c.beginPath();c.roundRect(252,522,296,23,10);c.fill();
    for(const b of this.blocks){if(!this.sprites[b.c.id])continue;c.save();c.translate(b.x,b.y);c.rotate(b.rotation);const idle=s.screen!=='paused'&&!s.reducedMotion?Math.sin(this.elapsed*2+b.c.id)*.012:0;c.scale(b.sx+idle,b.sy-idle);if(b.dead)c.globalAlpha=Math.max(0,1-(b.death||0)*5);
      if(this.hover===b.id&&!b.dead){b.state='targeted';c.strokeStyle='#6c8461';c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.roundRect(-b.w*.43,-b.h*.43,b.w*.86,b.h*.86,24);c.stroke();c.setLineDash([]);}
      c.drawImage(this.sprites[b.c.id],-b.w/2,-b.h/2,b.w,b.h);
      if(b.special&&!b.dead){
        c.fillStyle=b.special==='mystery'?'#e2d9e8':'#eee0af';c.strokeStyle='#95835e';c.lineWidth=1;
        c.beginPath();c.roundRect(48,-58,66,22,7);c.fill();c.stroke();c.fillStyle='#625d46';c.textAlign='center';c.font='bold 10px Arial';
        c.fillText(b.special==='jackpot'?'★ JACKPOT':b.special==='lucky'?'✦ LUCKY':'? MYSTERY',81,-43);
      }
      if(b.hp<b.maxHp&&!b.dead){c.fillStyle='#e8dfd1';c.beginPath();c.roundRect(-27,54,54,5,3);c.fill();c.fillStyle='#d48a69';c.beginPath();c.roundRect(-27,54,54*b.hp/b.maxHp,5,3);c.fill();}c.restore();}
    for(const p of this.particles){c.globalAlpha=Math.min(1,p.life*3);c.fillStyle=p.color;c.fillRect(p.x,p.y,p.size,p.size);}c.globalAlpha=1;
    for(const l of this.labels){c.globalAlpha=Math.min(1,l.life*3);c.font='900 31px Arial';c.textAlign='center';c.lineWidth=5;c.strokeStyle='#faf8ed';c.strokeText(l.text,l.x,l.y);c.fillStyle=l.color;c.fillText(l.text,l.x,l.y);}c.globalAlpha=1;
    const w=this.swing;if(w.t>0){c.save();c.translate(w.x+35,w.y-20);c.rotate(w.weapon==='hammer'?-w.t*1.5:-.15*w.t);if(w.weapon==='hammer'){c.fillStyle='#c19b72';c.strokeStyle='#685946';c.lineWidth=3;c.beginPath();c.roundRect(-8,-20,19,100,6);c.fill();c.stroke();c.fillStyle=s.goldenLeft?'#c7a252':'#8b9b9d';c.beginPath();c.roundRect(-44,-39,85,45,11);c.fill();c.stroke();c.fillStyle='#bac6c2';c.fillRect(-32,-31,55,8);}else{c.fillStyle='#bca5c7';c.beginPath();c.roundRect(-5,5,22,40,7);c.fill();c.fillStyle='#7e9991';c.beginPath();c.roundRect(-45,-20,83,35,12);c.fill();c.fillStyle='#f8d77a';c.beginPath();c.arc(-58-w.t*60,-5,9,0,Math.PI*2);c.fill();}c.restore();}c.restore();
  }
  loop(t) {
    if (this.disposed) return;
    const dt = this.last ? (t - this.last) / 1000 : 0;
    this.last = t;
    const playing = useGame.getState().screen === 'playing';
    if (playing) this.update(dt);
    if (playing || this.dirty) { this.draw(); this.dirty = false; }
    this.frame = requestAnimationFrame(time => this.loop(time));
  }
  destroy(){this.disposed=true;cancelAnimationFrame(this.frame);this.unsubscribe();this.canvas.removeEventListener('pointerdown',this.down);this.canvas.removeEventListener('pointermove',this.move);this.canvas.removeEventListener('pointerleave',this.leave);gsap.killTweensOf(this.swing);this.blocks.forEach(b=>gsap.killTweensOf(b));}
}
