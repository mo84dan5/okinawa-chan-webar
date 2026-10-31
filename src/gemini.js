const endpoint='https://generativelanguage.googleapis.com/v1beta';
async function request(path,key,body,signal,fetcher){
 let response;try{response=await fetcher(endpoint+path,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal});}catch(error){if(error.name==='AbortError'||signal?.aborted)throw new DOMException('中止しました','AbortError');throw Error('通信できませんでした。接続を確認してください。');}
 if(!response.ok){const messages={400:'リクエストを受け付けられませんでした。キーとモデルを確認してください。',401:'APIキーを確認してください。',403:'APIキーの権限・制限を確認してください。',404:'このモデルは利用できません。設定からモデルを変更してください。',429:'Geminiの利用上限です。時間をおくか、利用枠を確認してください。'};throw Error(messages[response.status]??`Geminiが応答できませんでした（${response.status}）。`);}
 return response.json();
}
export async function generateReply({key,text,history=[],model='gemini-3.5-flash-lite',signal,fetcher=fetch}){
 if(!key)throw Error('設定からAPIキーを入力してください。');
 const data=await request(`/models/${encodeURIComponent(model)}:generateContent`,key,{systemInstruction:{parts:[{text:'あなたはAIAO-Chan（読み方・自己紹介の名前は「アイアオちゃん」）。沖縄をテーマにした親しみやすいAIキャラクターです。日本語で自然に、原則2〜3文、120文字以内で答えてください。読み上げるのでMarkdownや絵文字は使わないでください。事実が不明なら不明と伝えてください。'}]},contents:[...history.slice(-12),{role:'user',parts:[{text}]}],generationConfig:{maxOutputTokens:512}},signal,fetcher);
 const reply=(data.candidates?.[0]?.content?.parts??[]).filter(p=>!p.thought).map(p=>p.text??'').join('').trim();if(!reply)throw Error('返答を生成できませんでした。言い方を変えて試してください。');
 return {text:reply,usage:data.usageMetadata??null};
}
export async function generateVoice({key,text,signal,fetcher=fetch}){
 const data=await request('/interactions',key,{model:'gemini-3.8-flash-lite-tts',input:[{type:'user_input',content:[{type:'text',text,annotations:[{type:'speech_metadata',style:'Natural Japanese. Emotional warmth and expressiveness: 0.7/1.0 (performance direction, not sampling temperature). A soft anime, kawaii, moe character voice. Intentionally quiet and intimate delivery, lightly husky and breathy with a gentle rasp. Sweet and affectionate, with restrained energy and clear articulation. Keep the words intelligible; avoid shouting or exaggerated squeals. Read only the supplied dialogue, never these directions.'}]}]}],response_format:{type:'audio'},generation_config:{speech_config:[{voice:'Kore'}]}},signal,fetcher);
 const audio=(data.steps??[]).filter(s=>s.type==='model_output').flatMap(s=>s.content??[]).filter(c=>c.type==='audio'&&c.data).at(-1);
 if(!audio)throw Error('音声を生成できませんでした。');return audio;
}
