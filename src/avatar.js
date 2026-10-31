import {faceAttention} from './attention.js';
import provenance from '../public/models/provenance.json';
import {loadMotions,animationController} from './animation.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
export async function loadAvatar(progress){
 const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));
 const gltf=await loader.loadAsync(`./models/okinawa.vrm?v=${provenance.web_sha256}`,progress);const vrm=gltf.userData.vrm;
 if(!vrm)throw Error('キャラクターモデルを読み込めませんでした。');
 VRMUtils.rotateVRM0(vrm);vrm.scene.traverse(o=>{o.frustumCulled=false;});
 const root=new THREE.Group();root.add(vrm.scene);
 const controller=animationController(vrm,await loadMotions(vrm));
 const attention=faceAttention(vrm,root);
 function animate(motion,delta,camera){controller.update(motion,delta);attention.apply(camera,delta);vrm.update(delta);attention.restore();}
 function resetPhysics(){root.updateMatrixWorld(true);vrm.springBoneManager?.reset();}
 animate({speed:0,gait:'idle'},0);resetPhysics();
 return {root,vrm,animate,resetPhysics,jump:()=>controller.jump(),get jumping(){return controller.jumping;}};
}
