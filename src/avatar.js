import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
export async function loadAvatar(progress){
 const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));
 const gltf=await loader.loadAsync('./models/okinawa.vrm',progress);const vrm=gltf.userData.vrm;
 if(!vrm)throw Error('キャラクターモデルを読み込めませんでした。');
 VRMUtils.rotateVRM0(vrm);vrm.scene.traverse(o=>{o.frustumCulled=false;});
 const root=new THREE.Group();root.add(vrm.scene);const baseHip=vrm.humanoid.getNormalizedBoneNode('hips').position.clone();
 const rotation=(name,x=0,y=0,z=0)=>{const bone=vrm.humanoid.getNormalizedBoneNode(name);if(bone)bone.rotation.set(x,y,z);};
 function animate(motion,delta,time){
  const blend=Math.min(1,motion.speed/.45),wave=Math.sin(motion.phase),lift=Math.cos(2*motion.phase);
  vrm.humanoid.resetNormalizedPose();
  for(const [side,sign] of [['left',1],['right',-1]]){
   rotation(side+'UpperArm',-.22*wave*sign*blend,0,sign*-1.28);
   rotation(side+'LowerArm',-.15-.18*blend);
   rotation(side+'UpperLeg',.42*wave*sign*blend);
   rotation(side+'LowerLeg',Math.max(0,-wave*sign)*.65*blend);
   rotation(side+'Foot',-.12*wave*sign*blend);
  }
  rotation('spine',0,0,.025*wave*blend);rotation('chest',.02+Math.sin(time*1.6)*.008,0,-.025*wave*blend);
  const hip=vrm.humanoid.getNormalizedBoneNode('hips');hip.position.copy(baseHip);hip.position.y+=.012*(1-lift)*blend;
  vrm.update(delta);
 }
 function resetPhysics(){root.updateMatrixWorld(true);vrm.springBoneManager?.reset();}
 animate({speed:0,phase:0},0,0);resetPhysics();
 return {root,vrm,animate,resetPhysics};
}
