import test from 'node:test';import assert from 'node:assert/strict';
import {generateReply,generateVoice} from '../src/gemini.js';
test('search grounding is opt-in at API boundary and returns source metadata',async()=>{
 for(const grounding of [true,false]){let body;const metadata={groundingChunks:[{web:{uri:'https://example.com',title:'Source'}}],searchEntryPoint:{renderedContent:'<div>Search</div>'}};
 const result=await generateReply({key:'dummy',text:'ニュース',grounding,fetcher:async(_,init)=>{body=JSON.parse(init.body);return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'回答'}]},groundingMetadata:metadata}]})};}});
 assert.deepEqual(body.tools,grounding?[{google_search:{}}]:undefined);assert.deepEqual(result.grounding,metadata);}
});
test('Leda is the default Gemini voice',async()=>{let body;await generateVoice({key:'dummy',text:'やあ',fetcher:async(_,init)=>{body=JSON.parse(init.body);return {ok:true,json:async()=>({steps:[{type:'model_output',content:[{type:'audio',data:'AAAA'}]}]})};}});assert.equal(body.generation_config.speech_config[0].voice,'Leda');});
test('valid send closes chat immediately; reply stays available without reopening',async()=>{
 const {chatController}=await import('../src/chat.js');const nodes=new Map();
 function node(){return {value:'',hidden:false,children:[],attrs:{},textContent:'',checked:true,append(n){this.children.push(n);},setAttribute(k,v){this.attrs[k]=v;},addEventListener(){},focus(){},blur(){},scrollIntoView(){},replaceChildren(){this.children=[];}};}
 const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 const originalFetch=globalThis.fetch;let resolve;
 globalThis.document={getElementById:get,createElement:node,addEventListener(){}};globalThis.window={aiaoInitialKey:'dummy'};
 globalThis.fetch=()=>new Promise(r=>resolve=r);
 try{chatController();get('chat-input').value='こんにちは';get('voice-mode').value='off';const pending=get('chat-form').onsubmit({preventDefault(){}});assert.equal(get('chat-panel').hidden,true);assert.equal(get('chat-toggle').attrs['aria-expanded'],'false');resolve({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'こんにちは！'}]}}]})});await pending;assert.equal(get('chat-panel').hidden,true);assert.equal(get('chat-messages').children.at(-1).textContent,'こんにちは！');}
 finally{globalThis.fetch=originalFetch;delete globalThis.document;delete globalThis.window;}
});
test('source links reject active script URLs',async()=>{const {safeSource}=await import('../src/grounding.js');assert.equal(safeSource('javascript:alert(1)'),null);assert.equal(safeSource('data:text/html,hi'),null);assert.equal(safeSource('https://example.com/a'),'https://example.com/a');});
