import * as THREE from 'three';
import {expressionGroups} from './expressions.js';
export function gazeAngles(direction){
 const distance=direction.length();
 const visible=distance>1e-5&&direction.z/distance>=.5-1e-9;
 if(!visible)return {visible:false,yaw:0,pitch:0};
 return {visible:true,yaw:THREE.MathUtils.clamp(Math.atan2(direction.x,direction.z),-Math.PI/4,Math.PI/4),pitch:THREE.MathUtils.clamp(-Math.atan2(direction.y,Math.hypot(direction.x,direction.z)),-Math.PI/9,Math.PI/9)};
}
export function blinkClock(random=Math.random){
 let wait=2+random()*4,phase=-1;
 return delta=>{
  if(phase<0){wait-=delta;if(wait>0)return 0;phase=Math.max(0,-wait);}
  else phase+=delta;
  if(phase>=.24){phase=-1;wait=2+random()*4;return 0;}
  return phase<.08?phase/.08:1-(phase-.08)/.16;
 };
}
export function faceAttention(vrm,root,random=Math.random){
 const head=vrm.humanoid.getNormalizedBoneNode('head'),manager=vrm.expressionManager,blink=blinkClock(random);
 const base=new THREE.Quaternion(),offset=new THREE.Quaternion(),world=new THREE.Vector3(),origin=new THREE.Vector3(),inverse=new THREE.Quaternion();
 let yaw=0,pitch=0,manualBlink=0,applied=false;
 return {
  apply(camera,delta){
   if(!head)return;root.updateWorldMatrix(true,true);head.getWorldPosition(origin);
   let target={yaw:0,pitch:0};
   if(camera){camera.getWorldPosition(world);root.getWorldQuaternion(inverse).invert();world.sub(origin).applyQuaternion(inverse);target=gazeAngles(world);}
   const amount=1-Math.exp(-8*delta);yaw+=(target.yaw-yaw)*amount;pitch+=(target.pitch-pitch)*amount;
   base.copy(head.quaternion);offset.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));head.quaternion.multiply(offset);
   manualBlink=manager?.getValue('blink')??0;
   const automatic=blink(delta),manualEyes=expressionGroups.eyes.some(([name])=>(manager?.getValue(name)??0)>.001);
   if(!manualEyes)manager?.setValue('blink',automatic);applied=true;
  },
  // Restore inputs after VRM updates: rendered raw bones/morphs retain this frame's output.
  restore(){if(!applied)return;head.quaternion.copy(base);manager?.setValue('blink',manualBlink);applied=false;}
 };
}
