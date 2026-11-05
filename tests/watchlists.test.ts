import test from 'node:test';
import assert from 'node:assert/strict';
import {readWatchlists, createWatchlist, toggleWatched, renameWatchlist, deleteWatchlist, watchlistKey} from '../src/lib/watchlists.ts';

test('watchlist lifecycle preserves membership and input immutability', () => {
  const empty = createWatchlist([], '  Important  ');
  const watched = toggleWatched(empty, 'Important', 'FDR-001');
  assert.deepEqual(empty[0].ids, []);
  assert.deepEqual(watched[0].ids, ['FDR-001']);
  const renamed = renameWatchlist(watched, 'Important', 'Renewals');
  assert.deepEqual(renamed[0], {name:'Renewals', ids:['FDR-001']});
  assert.deepEqual(toggleWatched(renamed, 'Renewals', 'FDR-001')[0].ids, []);
  assert.deepEqual(deleteWatchlist(renamed, 'Renewals'), []);
});
test('invalid storage and duplicate names cannot break the register', () => {
  for (const raw of [null,'{','null','{"version":2,"lists":[]}']) assert.deepEqual(readWatchlists(raw), []);
  assert.deepEqual(readWatchlists(JSON.stringify({version:1,lists:[null,{name:'Bad',ids:[123]}]})), []);
  const lists = createWatchlist([], 'Important');
  assert.throws(() => createWatchlist(lists, 'important'), /already exists/);
  assert.throws(() => createWatchlist([], ' '), /name/);
  assert.throws(() => renameWatchlist(lists, 'missing', 'New'), /removed/);
  assert.throws(() => toggleWatched(lists, 'missing', 'FDR-1'), /existing/);
  assert.throws(() => toggleWatched(lists, 'Important', '../bad'), /Invalid/);
});
test('watchlists round trip and enforce capacity boundaries', () => {
  const lists = [{name:'One',ids:['FDR-1','FDR-1']}];
  assert.deepEqual(readWatchlists(JSON.stringify({version:1,lists})), [{name:'One',ids:['FDR-1']}]);
  const five = Array.from({length:5}, (_,i) => ({name:String(i),ids:[]}));
  assert.throws(() => createWatchlist(five,'Six'), /five/);
  const full = [{name:'Full',ids:Array.from({length:500},(_,i) => `FDR-${i}`)}];
  assert.throws(() => toggleWatched(full,'Full','FDR-501'), /500/);
  assert.equal(toggleWatched(full,'Full','FDR-0')[0].ids.length,499);
  assert.notEqual(watchlistKey('a'),watchlistKey('b'));
});
