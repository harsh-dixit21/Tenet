import test from 'node:test';
import assert from 'node:assert/strict';
import {renameSavedView, decodeViews, saveView, validFilters, viewsKey, type RegisterFilters} from '../src/lib/saved-views.ts';
const filters: RegisterFilters = {query:'Bank',status:'Verified',sort:'priority',bank:'All',from:'2026-01-01',to:'2027-01-01',activeOnly:true,pageSize:25};
test('saved views survive a versioned JSON round trip and copy the filters', () => {
  const input = {...filters}; const views = saveView([], '  Verified deposits  ', input);
  input.query = 'changed';
  assert.equal(views[0].filters.query, 'Bank');
  assert.equal(views[0].name, 'Verified deposits');
  assert.deepEqual(decodeViews(JSON.stringify({version:1,views})), views);
});
test('malformed, unsupported and invalid stored payloads fail safely', () => {
  for (const raw of [null,'{','null','[]','{"version":2,"views":[]}']) assert.deepEqual(decodeViews(raw), []);
  assert.deepEqual(decodeViews(JSON.stringify({version:1,views:[null,{name:'X',filters:{}}]})), []);
});
test('names are unique without case or surrounding space and capped at five', () => {
  const one = saveView([], 'One', filters);
  assert.throws(() => saveView(one, ' one ', filters), /already exists/);
  assert.throws(() => saveView([], ' ', filters), /view name/);
  assert.throws(() => saveView([], 'x'.repeat(41), filters), /view name/);
  const five = Array.from({length:5}, (_,i) => ({name:String(i),filters}));
  assert.throws(() => saveView(five, 'six', filters), /five views/);
  assert.equal(decodeViews(JSON.stringify({version:1,views:[...five,{name:'six',filters}]})).length, 5);
});
test('saved filters reject invalid dates, reversed ranges and unknown control values', () => {
  assert.ok(validFilters(filters));
  assert.ok(validFilters({...filters,from:'',to:''}));
  for (const override of [{from:'2026-02-30'},{from:'2028-01-01'},{sort:'unknown'},{status:'unknown'},{pageSize:0},{activeOnly:'true'},{bank:null},{query:'a'.repeat(201)}]) {
    assert.ok(!validFilters({...filters,...override}));
    assert.throws(() => saveView([], 'Bad', {...filters,...override} as RegisterFilters), /Check the filters/);
  }
});
test('account and screen keys cannot collide across delimiters', () => {
  assert.notEqual(viewsKey('user-a','Register'),viewsKey('user-b','Register'));
  assert.notEqual(viewsKey('demo','Register'),viewsKey('demo','Maturity'));
  assert.notEqual(viewsKey('a:b','c'),viewsKey('a','b:c'));
});
test('duplicate stored view names are ignored', () => {
  assert.equal(decodeViews(JSON.stringify({version:1,views:[{name:'One',filters},{name:' one ',filters}]})).length,1);
});

test('renaming keeps preset order and rejects collisions', () => {
  const views = saveView(saveView([], 'One', filters), 'Two', filters);
  assert.deepEqual(renameSavedView(views, 'One', 'New').map(view => view.name), ['New','Two']);
  assert.throws(() => renameSavedView(views, 'One', 'two'), /already exists/);
  assert.equal(views[0].name, 'One');
});
