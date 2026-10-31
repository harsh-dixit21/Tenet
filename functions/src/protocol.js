import {createHash} from 'node:crypto';
import {DomainError} from './domain.js';
export function commandFingerprint(value){const normalize=v=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,normalize(v[k])])):v;return createHash('sha256').update(JSON.stringify(normalize(value))).digest('hex');}
