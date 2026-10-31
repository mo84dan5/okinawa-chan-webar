import * as THREE from 'three';
// Keep the exported Blender MToon material profile; use neutral studio illumination.
export function configureRenderer(renderer){renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;}
export function lightScene(target){target.add(new THREE.HemisphereLight(0xffffff,0xd9d9d9,.8));const sun=new THREE.DirectionalLight(0xffffff,1);sun.position.set(2,5,3);target.add(sun);}
