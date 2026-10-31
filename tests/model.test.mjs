import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('web model retains repaired parts, humanoid, MToon and 22 spring chains',async()=>{const bytes=await readFile(new URL('../public/models/okinawa.vrm',import.meta.url));assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));assert.ok(gltf.nodes.some(n=>n.name==='Scalp_Repair'));assert.ok(gltf.nodes.some(n=>n.name==='Neck_Repair'));assert.equal(gltf.extensions.VRMC_springBone.springs.length,22);assert.ok(gltf.extensions.VRMC_vrm.humanoid.humanBones.head);assert.ok(gltf.materials.every(m=>m.extensions?.VRMC_materials_mtoon));for(const v of gltf.bufferViews)assert.ok((v.byteOffset??0)+v.byteLength<=gltf.buffers[0].byteLength);});
test('all 23 authored expressions have nonempty valid morph binds',async()=>{
 const b=await readFile(new URL('../public/models/okinawa.vrm',import.meta.url));const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 const all={...j.extensions.VRMC_vrm.expressions.preset,...j.extensions.VRMC_vrm.expressions.custom};
 for(const name of ['happy_eye','angry_eye','sad_eye','relaxed_eye','surprised_eye','blink','blink_L','blink_R','happy_mouth','angry_mouth','sad_mouth','relaxed_mouth','surprised_mouth','aa','ih','ou','ee','oh','brow_happy','brow_angry','brow_sad','brow_relaxed','brow_surprised']){
 const expression=all[name];assert.ok(expression?.morphTargetBinds?.length,name);for(const bind of expression.morphTargetBinds){assert.ok(j.meshes[j.nodes[bind.node].mesh].primitives.every(p=>p.targets[bind.index]),name);assert.equal(bind.weight,1);}
 }
});
