import test from 'node:test';import assert from 'node:assert/strict';
import {generateVoice} from '../src/gemini.js';
import {speechPlayer} from '../src/speech.js';
test('voice direction requests emotional intensity 0.7, soft husky anime voice',async()=>{
 let body;await generateVoice({key:'dummy',text:'こんにちは',fetcher:async(_url,init)=>{body=JSON.parse(init.body);return {ok:true,json:async()=>({steps:[{type:'model_output',content:[{type:'audio',data:'AAAA'}]}]})};}});
 const content=body.input[0].content[0];assert.equal(content.text,'こんにちは');const style=content.annotations[0].style;
 for(const word of ['0.7/1.0','quiet','husky','anime','kawaii','moe'])assert.ok(style.includes(word),word);
});
test('playback gain is reduced after lip analyser and cleaned on stop',async()=>{
 const links=[];let gain;
 const node=name=>({connect:n=>links.push([name,n.name]),disconnect(){this.disconnected=true;},name});
 class AudioContext{state='running';destination={name:'output'};createAnalyser(){return node('analyser');}createGain(){gain={...node('gain'),gain:{value:1}};return gain;}createBufferSource(){return {...node('source'),start(){},stop(){}};}async decodeAudioData(){return {};}}
 globalThis.window={AudioContext};try{const player=speechPlayer();await player.play({data:'AAAA'});assert.deepEqual(links,[['source','analyser'],['analyser','gain'],['gain','output']]);assert.equal(gain.gain.value,.55);player.stop();assert.equal(gain.disconnected,true);}finally{delete globalThis.window;}
});
