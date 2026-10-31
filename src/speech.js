export function mouthLevel(samples){let sum=0;for(const x of samples)sum+=x*x;return Math.max(0,Math.min(1,(Math.sqrt(sum/Math.max(1,samples.length))-.012)*7));}
export function speechPlayer(){
 let context,analyser,gain,source,utterance,speaking=false,mode='',saved=null,manager=null,level=0,generation=0;
 const mouthKeys=['happy_mouth','angry_mouth','sad_mouth','relaxed_mouth','surprised_mouth','aa','ih','ou','ee','oh'];
 function restore(){if(manager&&saved)for(const [name,value] of saved)manager.setValue(name,value);saved=null;level=0;}
 function stop(){generation++;if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}if(utterance){utterance.onstart=null;utterance.onend=null;utterance.onerror=null;speechSynthesis.cancel();utterance=null;}analyser?.disconnect();analyser=null;gain?.disconnect();gain=null;speaking=false;restore();}
 async function unlock(){context??=new (window.AudioContext||window.webkitAudioContext)();if(context.state!=='running')await context.resume();}
 return {
  unlock,stop,get speaking(){return speaking;},get level(){return level;},
  async play(audio){stop();const token=generation;await unlock();const bytes=Uint8Array.from(atob(audio.data),c=>c.charCodeAt(0));let buffer;
   const mime=audio.mime_type??audio.mimeType??'audio/wav';
   if(/audio\/(L16|pcm)/i.test(mime)){const rate=Number(mime.match(/rate=(\d+)/)?.[1]??24000);buffer=context.createBuffer(1,bytes.length/2,rate);const view=new DataView(bytes.buffer),channel=buffer.getChannelData(0);for(let i=0;i<channel.length;i++)channel[i]=view.getInt16(i*2,true)/32768;}
   else buffer=await context.decodeAudioData(bytes.buffer);
   if(token!==generation)return;analyser=context.createAnalyser();analyser.fftSize=256;source=context.createBufferSource();source.buffer=buffer;source.connect(analyser);gain=context.createGain();gain.gain.value=.55;analyser.connect(gain);gain.connect(context.destination);source.onended=()=>{speaking=false;restore();source?.disconnect();source=null;analyser?.disconnect();analyser=null;gain?.disconnect();gain=null;};speaking=true;mode='audio';source.start();
  },
  device(text){stop();if(!('speechSynthesis' in window))throw Error('この端末では読み上げを利用できません。');utterance=new SpeechSynthesisUtterance(text);utterance.lang='ja-JP';utterance.rate=1;utterance.volume=.55;const voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ja'));if(voice)utterance.voice=voice;utterance.onstart=()=>{speaking=true;};utterance.onend=utterance.onerror=()=>{speaking=false;restore();utterance=null;};mode='device';speechSynthesis.speak(utterance);},
  update(expressionManager,time){manager=expressionManager;if(!speaking){restore();return;}
   if(!saved)saved=mouthKeys.map(name=>[name,manager.getValue(name)??0]);
   let target;if(mode==='audio'){const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);target=mouthLevel(samples);}else target=.15+.5*Math.max(0,Math.sin(time*18))*Math.max(0,Math.sin(time*3.7));
   level+=(target-level)*.45;for(const name of mouthKeys)manager.setValue(name,0);manager.setValue('aa',level*.85);manager.setValue('oh',level*.15);
  }
 };
}
