const files = import.meta.glob('../assets/*.png', { eager: true, query: '?url', import: 'default' });
const personalities = ['A little too excited','Cracks under pressure','Having a normal day','Absolutely electrified','Lost in the sauce','Unreasonably furious','Small but furious','Empty head, big feelings','A breath of bad air','One eye on the prize','Three times the trouble','Burnt out already','Saw that coming','Certified bad egg','Loud and not proud','Feeling a little green','Twice the attitude','Cannot unsee it','Head in the clouds','Rock bottom energy','A beautiful disaster','Emotionally unstable','Screams internally. And externally.','Ice cold meltdown','Toxic, but lovable'];
export const characters = Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([path, src], i) => ({ id: i, src, name: path.split('/').pop().replace(/^\d+_|\.png$/g, '').replaceAll('_', ' '), personality: personalities[i], rarity: i % 5, reaction: i % 5, hp: 3 + i % 3 }));
export async function loadSprites() {
  return Promise.all(characters.map(c => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Only remove the white backdrop connected to the edges, preserving white eyes and teeth.
      const { width: w, height: h } = canvas;
      const seen = new Uint8Array(w * h), queue = new Uint32Array(w * h);
      let tail = 0;
      const enqueue = p => {
        if (seen[p]) return;
        seen[p] = 1;
        queue[tail++] = p;
      };
      for (let x = 0; x < w; x++) { enqueue(x); enqueue((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { enqueue(y * w); enqueue(y * w + w - 1); }
      for (let q = 0; q < tail; q++) {
        const p = queue[q], k = p * 4;
        const r = data.data[k], g = data.data[k + 1], b = data.data[k + 2];
        if (Math.min(r, g, b) < 218 || Math.max(r, g, b) - Math.min(r, g, b) > 25) continue;
        data.data[k + 3] = 0;
        if (p % w) enqueue(p - 1);
        if (p % w < w - 1) enqueue(p + 1);
        if (p >= w) enqueue(p - w);
        if (p < w * (h - 1)) enqueue(p + w);
      }
      // Bake the muted palette once instead of filtering every sprite every frame.
      for (let k = 0; k < data.data.length; k += 4) {
        if (!data.data[k + 3]) continue;
        const gray = .213 * data.data[k] + .715 * data.data[k + 1] + .072 * data.data[k + 2];
        for (let channel = 0; channel < 3; channel++) {
          data.data[k + channel] = gray + .72 * (data.data[k + channel] - gray);
        }
      }
      ctx.putImageData(data,0,0); resolve(canvas);
    }; img.onerror = () => reject(new Error('A creature image could not load. Please refresh.')); img.src = c.src;
  })));
}
