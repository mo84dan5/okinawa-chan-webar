export const expressionGroups={
 eyes:[['happy_eye','笑顔'],['angry_eye','怒り'],['sad_eye','悲しい'],['relaxed_eye','穏やか'],['surprised_eye','驚き'],['blink','まばたき'],['blink_L','左目を閉じる'],['blink_R','右目を閉じる']],
 mouth:[['happy_mouth','笑顔'],['angry_mouth','怒り'],['sad_mouth','悲しい'],['relaxed_mouth','穏やか'],['surprised_mouth','驚き'],['aa','あ'],['ih','い'],['ou','う'],['ee','え'],['oh','お']],
 brows:[['brow_happy','笑顔'],['brow_angry','怒り'],['brow_sad','悲しい'],['brow_relaxed','穏やか'],['brow_surprised','驚き']]
};
export function setExpression(manager,group,name,strength){
 const poses=expressionGroups[group];if(!poses)throw Error('Unknown expression group');
 for(const [key] of poses)manager.setValue(key,key===name?Math.max(0,Math.min(1,Number(strength)||0)):0);
}
export function expressionPanel(manager,panel){
 for(const [group,poses] of Object.entries(expressionGroups)){
  const select=panel.querySelector(`[data-pose="${group}"]`),slider=panel.querySelector(`[data-strength="${group}"]`),output=panel.querySelector(`[data-value="${group}"]`);
  for(const [key,label] of poses){const option=document.createElement('option');option.value=key;option.textContent=label;select.append(option);}
  const apply=()=>{setExpression(manager,group,select.value,slider.value);output.textContent=`${Math.round(slider.value*100)}%`;};
  select.onchange=apply;slider.oninput=apply;
 }
 panel.querySelector('[data-reset]').onclick=()=>{
  for(const group of Object.keys(expressionGroups)){setExpression(manager,group,'',0);panel.querySelector(`[data-pose="${group}"]`).value='';panel.querySelector(`[data-strength="${group}"]`).value=1;panel.querySelector(`[data-value="${group}"]`).textContent='100%';}
 };
}
