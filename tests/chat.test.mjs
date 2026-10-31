import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
import {generateReply,generateVoice} from '../src/gemini.js';
import {mouthLevel} from '../src/speech.js';
test('query key is removed before app starts, unrelated parameters survive, storage failure is tolerated',()=>{
 for(const fail of [false,true]){let replaced;const window={};vm.runInNewContext(fs.readFileSync(new URL('../public/key-bootstrap.js',import.meta.url),'utf8'),{URL,window,location:{href:'https://example.com/?api_key=secret&mode=demo#hi'},history:{replaceState:(_s,_t,u)=>replaced=u},sessionStorage:{setItem(){if(fail)throw Error();}},});assert.equal(window.aiaoInitialKey,'secret');assert.equal(new URL(replaced).searchParams.has('api_key'),false);assert.equal(new URL(replaced).searchParams.get('mode'),'demo');}
});
test('Gemini sends key in header, bounds response and rejects errors without reflecting secrets',async()=>{
 let request;const fetcher=async(url,init)=>{request={url,init};return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'こんにちは！'}]}}],usageMetadata:{totalTokenCount:9}})}};
 const r=await generateReply({key:'secret',text:'やあ',history:[],fetcher});assert.equal(r.text,'こんにちは！');assert.equal(request.init.headers['x-goog-api-key'],'secret');assert.ok(!request.url.includes('secret'));assert.ok(JSON.parse(request.init.body).generationConfig.maxOutputTokens<=1024);
 await assert.rejects(generateReply({key:'secret',text:'やあ',history:[],fetcher:async()=>({ok:false,status:403})}),/キー/);
});
test('Gemini TTS extracts audio blocks and never returns empty speech',async()=>{
 const r=await generateVoice({key:'x',text:'こんにちは',fetcher:async()=>({ok:true,json:async()=>({steps:[{type:'model_output',content:[{type:'audio',data:'AAAA',mime_type:'audio/wav'}]}]})})});assert.equal(r.data,'AAAA');
 await assert.rejects(generateVoice({key:'x',text:'hi',fetcher:async()=>({ok:true,json:async()=>({steps:[]})})}),/音声/);
});
test('lip envelope closes at silence and stays bounded on loud samples',()=>{assert.equal(mouthLevel(new Float32Array(128)),0);assert.ok(mouthLevel(new Float32Array(128).fill(.1))>0);assert.ok(mouthLevel(new Float32Array(128).fill(1))<=1);});
test('speech cancellation closes lips and restores the manually selected mouth',async()=>{
 const {speechPlayer}=await import('../src/speech.js');let utterance;globalThis.window={speechSynthesis:{}};globalThis.speechSynthesis={getVoices:()=>[],speak:u=>{utterance=u;u.onstart();},cancel:()=>{}};globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 try{const player=speechPlayer(),values={happy_mouth:.6,aa:0};const manager={getValue:n=>values[n]??0,setValue:(n,v)=>values[n]=v};player.device('こんにちは');player.update(manager,.1);assert.equal(values.happy_mouth,0);assert.ok(values.aa>0);player.stop();assert.equal(values.happy_mouth,.6);assert.equal(values.aa,0);assert.equal(player.speaking,false);}
 finally{delete globalThis.window;delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;}
});

test('copy URL replaces key aliases, safely encodes key and preserves page options',async()=>{
 const {keyUrl}=await import('../src/chat.js');const url=new URL(keyUrl('https://example.com/app/?key=old&gemini_api_key=old&mode=ar#view','dummy +/&?'));
 assert.equal(url.searchParams.get('api_key'),'dummy +/&?');assert.equal(url.searchParams.has('key'),false);assert.equal(url.searchParams.has('gemini_api_key'),false);assert.equal(url.searchParams.get('mode'),'ar');assert.equal(url.hash,'#view');
});
