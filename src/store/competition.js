// Display-only rivals: never stored as players, winnings, or live activity.
const demoRivals = [
  ['SmashKing',0,1800,10,28], ['SOLHunter',13,1500,10,24],
  ['UglyWhale',17,1250,5,21], ['MoonBoy',18,1000,5,18],
  ['BlockCrusher',5,850,5,16], ['BonkBoss',6,700,5,14],
  ['SlimeTime',8,550,3,11], ['RageQuit',14,400,3,9],
  ['DizzyDegen',4,250,3,6], ['TinyTerror',10,100,2,3],
];
// Local calendar days; weeks start Monday, including across year boundaries.
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function addResult(days, playerId, {amount, combo, smashed}, date = new Date()) {
  const key = dayKey(date), day = days[key] || {}, previous = day[playerId] || {score:0, combo:1, smashed:0};
  return {...days, [key]: {...day, [playerId]: {score:previous.score+amount, combo:Math.max(previous.combo,combo), smashed:previous.smashed+smashed}}};
}
export function rankings(players, days, period, now = new Date(), includeDemo = false) {
  const today = dayKey(now), monday = new Date(now);
  monday.setDate(monday.getDate() - (monday.getDay()+6)%7);
  const from = period === 'daily' ? today : period === 'weekly' ? dayKey(monday) : '0000-00-00';
  const totals = new Map();
  for (const [day, entries] of Object.entries(days)) {
    if (day < from || day > today) continue;
    for (const [id, entry] of Object.entries(entries)) {
      if (!players[id] || !Number.isFinite(entry.score) || entry.score < 0) continue;
      const row = totals.get(id) || {...players[id], id, score:0, combo:1, smashed:0};
      row.score += entry.score; row.combo = Math.max(row.combo, entry.combo); row.smashed += entry.smashed;
      totals.set(id, row);
    }
  }
  if (includeDemo) {
    const factor = period === 'daily' ? 1 : period === 'weekly' ? 5 : 24;
    demoRivals.forEach(([name,avatar,score,combo,smashed],i)=>{
      const id=`demo-${i}`;
      totals.set(id,{id,name,avatar,score:score*factor,combo,smashed:smashed*factor,demo:true});
    });
  }
  return [...totals.values()].sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id)).map((row,i)=>({...row, rank:i+1}));
}
export function migrateCompetition(saved = {}) {
  if (saved.players && saved.days) return saved;
  let days = {};
  for (const r of saved.leaderboard || []) {
    const date = new Date(r.date);
    if (Number.isFinite(r.score) && r.score >= 0 && !Number.isNaN(+date))
      days = addResult(days, 'local', {amount:r.score, combo:r.combo || 1, smashed:r.smashed || 0}, date);
  }
  return {...saved, players:{local:{name:'You', avatar:0,highScore:saved.highScore||0,bestCombo:saved.bestCombo||1}}, playerId:'local', days};
}
// Shared event contract: a future verified transport can supply events here.
export function acceptActivity(event) {
  return event && typeof event.id === 'string' && typeof event.playerId === 'string'
    && typeof event.name === 'string' && event.name.length > 0 && event.name.length <= 20
    && Number.isInteger(event.avatar) && event.avatar >= 0 && event.avatar < 25
    && ['win','jackpot','combo','blocks','lucky','mystery','golden'].includes(event.type)
    && Number.isFinite(event.value) && event.value >= 0 && Number.isFinite(event.at)
    && ['local','multiplayer'].includes(event.source);
}
