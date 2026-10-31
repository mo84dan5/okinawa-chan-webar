import * as THREE from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {mixamoVRMRigMap} from './rig-map.js';
// Rest-pose retargeting follows pixiv/three-vrm's humanoidAnimation example (MIT).
export function retargetMotion(asset,vrm,name){
 asset.updateMatrixWorld(true);
 const source=asset.animations[0],tracks=[];
 if(!source)throw Error(`モーションがありません: ${name}`);
 const height=asset.getObjectByName('mixamorigHips').position.y;
 const scale=vrm.humanoid.normalizedRestPose.hips.position[1]/height;
 for(const track of source.tracks){
  const [sourceName,property]=track.name.split('.'),boneName=mixamoVRMRigMap[sourceName];
  const target=boneName&&vrm.humanoid.getNormalizedBoneNode(boneName),bone=asset.getObjectByName(sourceName);
  if(!target||!bone)continue;
  if(track instanceof THREE.QuaternionKeyframeTrack){
   const inverse=bone.getWorldQuaternion(new THREE.Quaternion()).invert(),parent=bone.parent.getWorldQuaternion(new THREE.Quaternion()),q=new THREE.Quaternion(),values=track.values.slice();
   for(let i=0;i<values.length;i+=4){q.fromArray(values,i).premultiply(parent).multiply(inverse).normalize().toArray(values,i);}
   tracks.push(new THREE.QuaternionKeyframeTrack(`${target.name}.${property}`,track.times,values));
  }
  if(boneName==='hips'&&property==='position'){
   const values=track.values.map((v,i)=>i%3===1?v*scale:0);
   tracks.push(new THREE.VectorKeyframeTrack(`${target.name}.position`,track.times,values));
  }
 }
 return new THREE.AnimationClip(name,source.duration,tracks);
}
export async function loadMotions(vrm){
 const entries=await Promise.all(['walk','run','sprint','jump'].map(async name=>[name,retargetMotion(await new FBXLoader().loadAsync(`./motions/${name}.fbx`),vrm,name)]));
 return Object.fromEntries(entries);
}
function idleClip(vrm){
 const tracks=[];
 for(const [side,sign] of [['left',1],['right',-1]]){
  const bone=vrm.humanoid.getNormalizedBoneNode(`${side}UpperArm`);
  if(bone)tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`,[0,1],Array(2).fill(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,-sign*1.28)).toArray()).flat()));
 }
 const hip=vrm.humanoid.getNormalizedBoneNode('hips');tracks.push(new THREE.VectorKeyframeTrack(`${hip.name}.position`,[0,1],[...hip.position.toArray(),...hip.position.toArray()]));
 return new THREE.AnimationClip('idle',1,tracks);
}
export function animationController(vrm,clips){
 const mixer=new THREE.AnimationMixer(vrm.scene),actions={};
 for(const [name,clip] of Object.entries({...clips,idle:idleClip(vrm)}))actions[name]=mixer.clipAction(clip);
 actions.jump.setLoop(THREE.LoopOnce,1);actions.jump.clampWhenFinished=true;
 let current='idle',jumping=false;actions.idle.play();
 mixer.addEventListener('finished',e=>{if(e.action===actions.jump)jumping=false;});
 function transition(name){if(name===current)return;const previous=actions[current],next=actions[name];next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();previous.crossFadeTo(next,.18,false);current=name;}
 return {
  get jumping(){return jumping;},get current(){return current;},
  jump(){if(jumping)return false;jumping=true;if(current==='jump')actions.jump.reset().play();else transition('jump');return true;},
  update(motion,delta){if(!jumping)transition(motion.gait??'idle');if(current!=='jump'&&current!=='idle')actions[current].setEffectiveTimeScale(Math.max(.45,Math.min(1.4,motion.speed/({walk:1,run:3,sprint:5.4}[current]))));mixer.update(delta);}
 };
}
