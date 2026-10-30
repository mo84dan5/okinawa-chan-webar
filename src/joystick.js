import {stickVector} from './movement.js';
export function joystick(element){
 let pointer=null,value={x:0,y:0,strength:0};const knob=element.querySelector('.knob');
 const update=e=>{const r=element.getBoundingClientRect(),radius=r.width*.32;value=stickVector(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2,radius);knob.style.transform=`translate(${value.x*value.strength*radius}px,${value.y*value.strength*radius}px) scale(${1-value.strength*.12},${1+value.strength*.08})`;element.style.setProperty('--pull',value.strength);};
 const reset=()=>{pointer=null;value={x:0,y:0,strength:0};knob.style.transform='';element.style.setProperty('--pull',0);};
 element.addEventListener('pointerdown',e=>{if(pointer!==null)return;pointer=e.pointerId;element.setPointerCapture(pointer);update(e);});
 element.addEventListener('pointermove',e=>{if(e.pointerId===pointer)update(e);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,e=>{if(e.pointerId===pointer)reset();});
 window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
 return {read:()=>value,reset};
}
