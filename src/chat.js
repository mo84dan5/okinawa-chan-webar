import {generateReply,generateVoice} from './gemini.js';
import {speechPlayer} from './speech.js';
export function keyUrl(href,key){
 const url=new URL(href);
 for(const name of ['api_key','gemini_api_key','key'])url.searchParams.delete(name);
 url.searchParams.set('api_key',key);
 return url.href;
}
export function chatController(){
 const $=id=>document.getElementById(id),voice=speechPlayer(),history=[];
 let key=window.aiaoInitialKey??'',request=null,turn=0,lastReply='',audio=null,wasSpeaking=false;
 delete window.aiaoInitialKey;
 try{key||=sessionStorage.getItem('aiao-gemini-key')??'';}catch{}
 function notice(text){$('chat-status').textContent=text;}
 function keyStatus(){$('key-copy').disabled=!key;$('key-copy-status').textContent='';$('key-status').textContent=key?'APIキー設定済み（このタブのみ）':'APIキー未設定';}
 function add(role,text){const p=document.createElement('p');p.className=role;p.textContent=text;$('chat-messages').append(p);while($('chat-messages').children.length>30)$('chat-messages').firstChild.remove();p.scrollIntoView({block:'nearest'});}
 function stop(){turn++;request?.abort();request=null;voice.stop();wasSpeaking=false;$('chat-send').disabled=false;notice('停止しました');}
 function openSettings(){keyStatus();$('api-key').value='';$('settings').showModal();}
 $('settings-open').onclick=openSettings;
 $('settings-close').onclick=()=>{$('api-key').value='';$('settings').close();};
 $('settings').addEventListener('close',()=>{$('api-key').value='';});
 $('settings-form').onsubmit=e=>{e.preventDefault();const next=$('api-key').value.trim();if(next){stop();key=next;try{sessionStorage.setItem('aiao-gemini-key',key);}catch{}}$('api-key').value='';keyStatus();$('settings').close();notice(key?'話しかけてみてください':'設定からAPIキーを入力してください');};
 $('key-copy').onclick=async()=>{
  if(!key)return;
  try{await navigator.clipboard.writeText(keyUrl(location.href,key));$('key-copy-status').textContent='APIキー付きURLをコピーしました';}
  catch{$('key-copy-status').textContent='コピーできませんでした。ブラウザのクリップボード権限を確認してください。';}
 };
 $('key-clear').onclick=()=>{stop();key='';$('api-key').value='';try{sessionStorage.removeItem('aiao-gemini-key');}catch{}keyStatus();};
 $('chat-toggle').onclick=()=>{const show=$('chat-panel').hidden;$('chat-panel').hidden=!show;$('chat-toggle').setAttribute('aria-expanded',String(show));if(show)$('chat-input').focus();};
 $('chat-close').onclick=()=>{$('chat-panel').hidden=true;$('chat-toggle').setAttribute('aria-expanded','false');};
 $('chat-stop').onclick=stop;
 $('chat-clear').onclick=()=>{stop();history.length=0;lastReply='';audio=null;$('chat-messages').replaceChildren();$('chat-replay').disabled=true;notice('会話を消去しました');};
 async function replay(){if(!lastReply)return;try{await voice.unlock();if(audio)await voice.play(audio);else voice.device(lastReply);notice('読み上げ中');}catch{notice('音声を再生できませんでした。端末の音声設定を確認してください。');}}
 $('chat-replay').onclick=replay;
 $('chat-form').onsubmit=async e=>{
  e.preventDefault();const text=$('chat-input').value.trim();if(!text||request)return;if(!key){notice('設定からAPIキーを入力してください');openSettings();return;}
  stop();const token=turn;request=new AbortController();const controller=request,signal=controller.signal;$('chat-send').disabled=true;$('chat-input').value='';audio=null;lastReply='';$('chat-replay').disabled=true;add('user',text);notice('考えています…');
  const speechMode=$('voice-mode').value;
  if(speechMode!=='off')voice.unlock().catch(()=>{});
  const timer=setTimeout(()=>controller.abort(),60000);
  try{
   const result=await generateReply({key,text,history,model:$('gemini-model').value,signal});if(token!==turn)return;
   lastReply=result.text;history.push({role:'user',parts:[{text}]},{role:'model',parts:[{text:lastReply}]});if(history.length>12)history.splice(0,history.length-12);add('assistant',lastReply);
   $('token-usage').textContent=result.usage?.totalTokenCount?`今回のテキスト: ${result.usage.totalTokenCount} tokens`:'利用量はGoogle AI Studioで確認できます';
   if(speechMode==='off'){notice('返答しました');return;}
   $('chat-replay').disabled=false;
   if(speechMode==='device'){voice.device(lastReply);notice('端末の音声で読み上げ中');return;}
   notice('音声を準備しています…');
   try{audio=await generateVoice({key,text:lastReply,signal});if(token!==turn)return;await voice.play(audio);notice('読み上げ中');}
   catch(error){if(signal.aborted||token!==turn)throw error;audio=null;notice('Gemini音声を利用できないため、端末の音声で読み上げます');voice.device(lastReply);}
  }catch(error){if(token===turn)notice(error.name==='AbortError'?'通信を中止しました。もう一度送信できます。':error.message);}
  finally{clearTimeout(timer);if(token===turn){request=null;$('chat-send').disabled=false;}}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 keyStatus();notice(key?'話しかけてみてください':'☰ 設定でAPIキーを入力すると会話できます');
 return {update(manager,time){voice.update(manager,time);$('speech-level').value=voice.level;if(wasSpeaking&&!voice.speaking)notice('話しかけてみてください');wasSpeaking=voice.speaking;},stopSpeech:()=>voice.stop()};
}
