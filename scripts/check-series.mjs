import {execFileSync} from 'node:child_process';import {readFileSync} from 'node:fs';
const base='cb109c7e76387cad58568d4218f7e9eb6d0203f7';const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const commits=git('rev-list','--reverse',`${base}..HEAD`).split('\n').filter(Boolean);
if(commits.length!==100)throw new Error(`Expected 100 commits; found ${commits.length}`);
const entries=readFileSync('CHANGE_SERIES.md','utf8').split('\n').filter(s=>/^\d+\. /.test(s));
if(entries.length!==100||entries.some((s,i)=>!s.startsWith(`${i+1}. `)))throw new Error('Change log numbering is incomplete');
for(const sha of commits){const paths=git('diff-tree','--no-commit-id','--name-only','-r',sha).split('\n');if(!paths.some(p=>p&&p!=='CHANGE_SERIES.md'))throw new Error(`Log-only commit: ${sha}`)}
console.log('100 commits verified; each changes a substantive file and the numbered log.');
