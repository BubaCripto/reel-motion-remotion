import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {prepareRenderFrameRate} from '../server/media-info.mjs';
const input=process.argv[2]||'projects/example.json';
const output=process.argv[3]||'out/reel.mp4';
const p=await prepareRenderFrameRate(JSON.parse(fs.readFileSync(input,'utf8')),process.cwd());
if(!Array.isArray(p.cues)||!p.cues.length)throw Error('O projeto não tem legendas.');
fs.mkdirSync(path.dirname(output),{recursive:true});
const args=['remotion','render','src/remotion/index.ts','ReelTypography',output,'--props',path.resolve(input),'--codec','h264'];
// Composition expects {project: ...}; supply a wrapper for Remotion CLI.
const wrapper=path.resolve('out/.render-props.json');fs.mkdirSync('out',{recursive:true});fs.writeFileSync(wrapper,JSON.stringify({project:p}));
args[args.indexOf('--props')+1]=wrapper;
const r=spawnSync('npx',args,{stdio:'inherit',shell:process.platform==='win32'});
process.exit(r.status??1);
