import {loadMotions,animationController} from './animation.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
export async function loadAvatar(progress){
 const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));
 const gltf=await loader.loadAsync('./models/okinawa.vrm',progress);const vrm=gltf.userData.vrm;
 if(!vrm)throw Error('キャラクターモデルを読み込めませんでした。');
 VRMUtils.rotateVRM0(vrm);vrm.scene.traverse(o=>{o.frustumCulled=false;});
 const root=new THREE.Group();root.add(vrm.scene);
 const controller=animationController(vrm,await loadMotions(vrm));
 function animate(motion,delta){controller.update(motion,delta);vrm.update(delta);}
 function resetPhysics(){root.updateMatrixWorld(true);vrm.springBoneManager?.reset();}
 animate({speed:0,gait:'idle'},0);resetPhysics();
 return {root,vrm,animate,resetPhysics,jump:()=>controller.jump(),get jumping(){return controller.jumping;}};
}
