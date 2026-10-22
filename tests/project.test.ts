import test from 'node:test';
import assert from 'node:assert/strict';
import {initialProject,parseSrt,normalizeWords,splitWords,validateProject,durationFrames,animatedValue,textTokens} from '../src/lib/project.ts';

test('SRT preserves original timestamps',()=>{
 const s='1\n00:00:00,300 --> 00:00:01,800\nComente [BALEIA] agora\n\n2\n00:00:02,000 --> 00:00:03,750\nPara receber o link';
 const cues=parseSrt(s);assert.equal(cues.length,2);assert.equal(cues[0].start,.3);assert.equal(cues[0].end,1.8);assert.equal(cues[1].start,2);assert.equal(cues[1].end,3.75);
});
test('bracket highlights are parsed as one word',()=>{
 const t=textTokens('comente [BALEIA] para o link');assert.equal(t.length,5);assert.deepEqual(t[1],{text:'BALEIA',highlight:true});
});
test('word timing does not exceed cue boundaries',()=>{
 const c={id:'cue-1',text:'uma frase de teste',start:1,end:3};const words=splitWords(c);
 assert.equal(words[0].start,1);assert.equal(words.at(-1)?.end,3);assert.ok(words.every(w=>w.start<w.end));assert.deepEqual(normalizeWords({...c,words}).map(w=>w.id),words.map(w=>w.id));
});
test('older v5 projects migrate without losing cues',()=>{
 const p=validateProject({name:'V5',fps:30,width:1080,height:1920,cues:[{id:'1',start:0,end:2,text:'teste'}]});
 assert.deepEqual(p.clips,[]);assert.deepEqual(p.overlays,[]);assert.equal(p.cues[0].text,'teste');
});
test('duration includes overlays and videos',()=>{
 const p={...initialProject,cues:[],videoDuration:0,clips:[],overlays:[{id:'a',kind:'shape' as const,name:'Forma',start:10,end:12,track:3,x:50,y:50,scale:1,rotation:0,opacity:1}]};
 assert.equal(durationFrames(p),360);
});
test('keyframe interpolation is smooth and bounded',()=>{
 const frames=[{time:0,x:0},{time:2,x:100}];assert.equal(animatedValue(frames,-1,'x',50),0);assert.equal(animatedValue(frames,1,'x',50),50);assert.equal(animatedValue(frames,3,'x',50),100);
});
