import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateProject,replaceTranscript,cueTracks,parseSrt,type Cue} from '../src/lib/project.ts';

// Actual legacy project supplied in the bug report: four authored texts in `cues`.
const legacy=JSON.parse(readFileSync(new URL('./fixtures/30-dias-legacy.json',import.meta.url),'utf8'));
const generated=()=>parseSrt('1\n00:00:00,000 --> 00:00:01,800\n30 dias, 30 estratégias de trade.\n\n2\n00:00:02,500 --> 00:00:06,800\nEsse é o único indicador que eu usaria.');

test('generating captions preserves all four authored texts from 30 dias',()=>{
 const before=validateProject(legacy),snapshot=structuredClone(before);
 const after=replaceTranscript(before,generated());
 const tracks=cueTracks(after.cues);
 assert.equal(tracks.texts.length,4);
 assert.equal(tracks.captions.length,2);
 assert.deepEqual(tracks.texts,before.cues);
 assert.deepEqual(before,snapshot,'generation must not mutate the loaded project');
 assert.ok(tracks.texts.some(c=>c.text==='[#01]'));
 assert.ok(tracks.texts.some(c=>c.text==='[crossover]'));
 assert.ok(tracks.captions.every(c=>c.source==='transcript'&&c.track===1&&c.y===55));
});

test('regenerating replaces only previous captions, without duplicating or deleting texts',()=>{
 const first=replaceTranscript(validateProject(legacy),generated());
 const second=replaceTranscript(first,[{id:'new',start:0,end:1,text:'Revisado pela IA',source:'manual'}]);
 assert.equal(second.cues.length,5);
 assert.deepEqual(cueTracks(second.cues).texts,cueTracks(first.cues).texts);
 assert.equal(cueTracks(second.cues).captions[0].text,'Revisado pela IA');
 assert.equal(cueTracks(second.cues).captions[0].source,'transcript','AI must not control the destination track');
});

test('caption and authored text tracks survive saving and reloading JSON',()=>{
 const first=replaceTranscript(validateProject(legacy),generated());
 const reloaded=validateProject(JSON.parse(JSON.stringify(first)));
 assert.deepEqual(cueTracks(reloaded.cues),cueTracks(first.cues));
 assert.equal(cueTracks(reloaded.cues).texts.length,4);
 assert.equal(cueTracks(reloaded.cues).captions.length,2);
});

test('SRT and word aligned AI results share the same isolated destination',()=>{
 const before=validateProject(legacy);
 const wordCue:Cue={id:'whisper',start:1,end:2,text:'teste',words:[{id:'word',start:1,end:2,text:'teste',highlight:true}]};
 const fromWords=replaceTranscript(before,[wordCue]);
 assert.equal(cueTracks(fromWords.cues).captions[0].words?.[0].start,1);
 assert.deepEqual(cueTracks(fromWords.cues).texts,before.cues);
 const fromSrt=replaceTranscript(fromWords,generated());
 assert.deepEqual(cueTracks(fromSrt.cues).texts,before.cues);
 assert.equal(cueTracks(fromSrt.cues).captions.length,2);
});

test('transcription preserves independent media and prevents ID collisions with authored text',()=>{
 const before=validateProject(legacy);
 before.overlays=[{id:'logo',kind:'text',name:'Logo',text:'Marca',start:0,end:5,track:3,x:50,y:10,scale:1,rotation:0,opacity:1}];
 const after=replaceTranscript(before,[{id:before.cues[0].id,start:0,end:1,text:'Fala'}]);
 assert.deepEqual(after.overlays,before.overlays);
 assert.deepEqual(after.clips,before.clips);
 assert.deepEqual(cueTracks(after.cues).texts,before.cues);
 assert.equal(new Set(after.cues.map(c=>c.id)).size,after.cues.length);
});

test('invalid transcription is rejected while leaving the project intact',()=>{
 const before=validateProject(legacy),snapshot=structuredClone(before);
 assert.throws(()=>replaceTranscript(before,[{id:'bad',start:4,end:2,text:'errado'}]));
 assert.deepEqual(before,snapshot);
});
