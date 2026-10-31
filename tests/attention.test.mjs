import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {gazeAngles,blinkClock,faceAttention} from '../src/attention.js';
import {lightScene,configureRenderer} from '../src/lighting.js';
test('camera is followed only in the forward 120 degree cone',()=>{
 for(const deg of [0,30,59.9,60]){const a=gazeAngles(new THREE.Vector3(Math.sin(deg*Math.PI/180),0,Math.cos(deg*Math.PI/180)));assert.equal(a.visible,true);assert.ok(Math.abs(a.yaw)<=Math.PI/4);}
 for(const deg of [60.1,90,180,-61])assert.equal(gazeAngles(new THREE.Vector3(Math.sin(deg*Math.PI/180),0,Math.cos(deg*Math.PI/180))).visible,false);
 assert.equal(gazeAngles(new THREE.Vector3(0,2,1)).visible,false);assert.equal(gazeAngles(new THREE.Vector3()).visible,false);
});
test('blink has a brief close-open cycle separated by seconds',()=>{
 const blink=blinkClock(()=>0);assert.equal(blink(2),0);assert.ok(blink(.08)>.9);assert.equal(blink(.2),0);assert.equal(blink(1),0);
});
test('face attention restores animation pose and does not change manual eye values',()=>{
 const root=new THREE.Group(),head=new THREE.Bone();root.add(head);const values={blink:.4,happy_eye:1};
 const manager={getValue:n=>values[n]??0,setValue:(n,v)=>values[n]=v};const vrm={humanoid:{getNormalizedBoneNode:()=>head},expressionManager:manager};
 const attention=faceAttention(vrm,root,()=>0);const camera=new THREE.PerspectiveCamera();camera.position.set(1,0,2);
 attention.apply(camera,2.08);assert.ok(head.quaternion.angleTo(new THREE.Quaternion())>0);assert.equal(values.blink,.4);attention.restore();assert.ok(head.quaternion.angleTo(new THREE.Quaternion())<1e-6);assert.equal(values.blink,.4);
});
test('neutral studio lighting uses standard color output without clipping exposure boost',()=>{
 const scene=new THREE.Scene();lightScene(scene);assert.equal(scene.children.length,2);assert.ok(scene.children.every(l=>l.color.getHex()===0xffffff));
 const renderer={};configureRenderer(renderer);assert.equal(renderer.outputColorSpace,THREE.SRGBColorSpace);assert.equal(renderer.toneMapping,THREE.NoToneMapping);assert.equal(renderer.toneMappingExposure,1);
});
