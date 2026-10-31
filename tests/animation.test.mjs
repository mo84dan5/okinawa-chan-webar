import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {retargetMotion,animationController} from '../src/animation.js';
import {mixamoVRMRigMap} from '../src/rig-map.js';
function fixture(){const scene=new THREE.Group(),bones={};for(const name of new Set(Object.values(mixamoVRMRigMap))){const bone=new THREE.Bone();bone.name=name;scene.add(bone);bones[name]=bone;}bones.hips.position.y=1;return {scene,humanoid:{getNormalizedBoneNode:n=>bones[n],normalizedRestPose:{hips:{position:[0,1,0]}}}};}
test('four actual FBX clips retarget finite rotations and in-place hips',()=>{
 for(const name of ['walk','run','sprint','jump']){
 const buffer=fs.readFileSync(new URL(`../public/motions/${name}.fbx`,import.meta.url));
 const source=new FBXLoader().parse(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
 const clip=retargetMotion(source,fixture(),name);assert.ok(clip.duration>.4);assert.ok(clip.tracks.length>40);
 for(const track of clip.tracks){assert.ok(Array.from(track.values).every(Number.isFinite));if(track.name==='hips.position')for(let i=0;i<track.values.length;i+=3){assert.equal(track.values[i],0);assert.equal(track.values[i+2],0);}}
 }
});
test('jump is one shot, rejects repeats and resumes locomotion',()=>{
 const vrm=fixture();const clips=Object.fromEntries(['walk','run','sprint','jump'].map(name=>[name,new THREE.AnimationClip(name,1,[new THREE.VectorKeyframeTrack('hips.position',[0,1],[0,1,0,0,1,0])])]));
 const controller=animationController(vrm,clips);assert.equal(controller.jump(),true);assert.equal(controller.jump(),false);
 controller.update({gait:'run',speed:3},.5);assert.equal(controller.jumping,true);
 controller.update({gait:'run',speed:3},.6);controller.update({gait:'run',speed:3},.1);assert.equal(controller.jumping,false);assert.equal(controller.current,'run');assert.equal(controller.jump(),true);
});
