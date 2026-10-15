export const TIERS = [
  { name: 'Common', min: 1, max: 25, weight: 65, color: '#779779' },
  { name: 'Uncommon', min: 26, max: 100, weight: 24, color: '#4e9790' },
  { name: 'Rare', min: 101, max: 500, weight: 8, color: '#8794c1' },
  { name: 'Epic', min: 501, max: 2500, weight: 2.7, color: '#ae82a6' },
  { name: 'Legendary', min: 2501, max: 10000, weight: .3, color: '#c19a42' },
];
export const EVENTS = [
  { name: 'Bull run', label: 'Rewards are doubled. Go wild.', factor: 2, icon: '↗', color: '#dfe9ce' },
  { name: 'Bear market', label: 'Half the rewards. Keep your cool.', factor: .5, icon: '↘', color: '#e1dfed' },
  { name: 'Green candle', label: 'Every smash pays a $100 bonus.', factor: 1, bonus: 100, icon: '↑', color: '#dce8ce' },
  { name: 'Red candle', label: 'Thicker skin. Half attack damage.', factor: 1, armor: 2, icon: '↓', color: '#f1d9cf' },
  { name: 'Whale alert', label: 'A big misfit joins the stack.', factor: 1, whale: true, icon: '◉', color: '#d7e6ee' },
  { name: 'Moon shot', label: 'Legendary odds are out of orbit.', factor: 1, moon: true, icon: '✦', color: '#ece3bd' },
];
export function multiplier(hits) { return hits >= 20 ? 10 : hits >= 10 ? 5 : hits >= 5 ? 3 : hits >= 2 ? 2 : 1; }
export function reward({ rarity = 0, damage = 1, combo = 1, event = null, destroyed = false }, random = Math.random) {
  const weights = TIERS.map((t, i) => t.weight * (i > 1 ? 1 + rarity * .25 + (event?.moon ? 12 : 0) : 1));
  let roll = random() * weights.reduce((a, b) => a + b, 0);
  let tier = TIERS[0];
  for (let i = 0; i < weights.length; i++) { roll -= weights[i]; if (roll < 0) { tier = TIERS[i]; break; } }
  const base = tier.min + Math.floor(random() * (tier.max - tier.min + 1));
  return { tier: tier.name, amount: Math.max(1, Math.round(base * Math.min(1, damage / 2) * combo * (event?.factor ?? 1)) + (destroyed ? event?.bonus ?? 0 : 0)) };
}
export function hitTest(blocks, x, y) { return [...blocks].reverse().find(b => !b.dead && Math.abs(x - b.x) < b.w * .43 && Math.abs(y - b.y) < b.h * .43); }
export function targets(blocks, floor = 505) { return blocks.filter(b => !b.dead).map((b, i) => ({ id: b.id, y: floor - i * 105 })); }
export const money = n => '$' + Math.round(n).toLocaleString('en-US');

export function specialBlock(roll = Math.random()) {
  return roll < .025 ? 'jackpot' : roll < .085 ? 'lucky' : roll < .16 ? 'mystery' : null;
}
export function specialReward(kind, roll = Math.random()) {
  if (kind === 'jackpot') return {amount:2500, label:'JACKPOT SMASH', type:'jackpot'};
  if (kind === 'lucky') return {amount:250, label:'LUCKY BLOCK', type:'lucky'};
  if (kind === 'mystery') return roll < .5
    ? {amount:500, label:'MYSTERY +$500', type:'mystery'}
    : {amount:0, label:'GOLDEN HAMMER', type:'golden', golden:true};
  return {amount:0};
}
