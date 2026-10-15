import test from 'node:test';
import assert from 'node:assert/strict';
import { safeStorage } from '../src/store/storage.js';

test('failed storage reports once even when reporting triggers another save', async () => {
  let errors = 0;
  const storage = safeStorage(() => { throw new Error('Storage blocked'); }, () => {
    errors++;
    storage.setItem('game', 'error state');
  });
  assert.equal(storage.getItem('game'), null);
  storage.setItem('game', 'state');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(errors, 1);
});

test('unchanged persistent state is written once and failed writes can retry', () => {
  let writes = 0, failed = false;
  const storage = safeStorage(() => ({
    setItem() { writes++; if (failed) throw new Error('Quota'); },
    removeItem() {},
  }), () => {});
  storage.setItem('game', 'one');
  storage.setItem('game', 'one');
  assert.equal(writes, 1);
  failed = true;
  storage.setItem('game', 'two');
  failed = false;
  storage.setItem('game', 'two');
  storage.setItem('game', 'two');
  assert.equal(writes, 3);
});
