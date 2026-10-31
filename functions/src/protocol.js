import {createHash} from 'node:crypto';
import {DomainError} from './domain.js';
export function commandFingerprint(value){const normalize=v=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,normalize(v[k])])):v;return createHash('sha256').update(JSON.stringify(normalize(value))).digest('hex');}
export function canonicalBase64(value){if(typeof value!=='string'||!value||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw new DomainError('invalid-argument','Invalid base64 document content.');const bytes=Buffer.from(value,'base64');if(bytes.toString('base64')!==value)throw new DomainError('invalid-argument','Document encoding must be canonical base64.');return bytes;}
export const documentChecksum=bytes=>createHash('sha256').update(bytes).digest('hex');
export function assertPayloadSize(value,max=2*1024*1024){if(Buffer.byteLength(JSON.stringify(value??{}),'utf8')>max)throw new DomainError('invalid-argument','Request exceeds the supported payload size.');}
export function alertIds(ids){if(!Array.isArray(ids)||ids.length>2000||ids.some(id=>typeof id!=='string'||!id.trim()||id.length>2000))throw new DomainError('invalid-argument','Invalid alert IDs.');return [...new Set(ids)];}
