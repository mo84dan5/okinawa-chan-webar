import test from 'node:test';
import assert from 'node:assert/strict';
import {stickVector,advance,initialMotion} from '../src/movement.js';
test('deadzone stops and diagonal input is clamped',()=>{assert.equal(stickVector(2,2,60).strength,0);assert.ok(Math.abs(stickVector(100,100,60).strength-1)<1e-8);});
test('forward input moves away from camera, diagonals do not run faster',()=>{let a=initialMotion(),b=initialMotion();for(let i=0;i<60;i++){a=advance(a,{x:0,y:-1,strength:1},0,1/60);b=advance(b,{x:Math.SQRT1_2,y:-Math.SQRT1_2,strength:1},0,1/60);}assert.ok(a.z<-.5);assert.ok(Math.abs(Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))<1e-6);});
test('camera heading rotates movement and tracking loss stops immediately',()=>{const a=advance(initialMotion(),{x:0,y:-1,strength:1},Math.PI/2,.05);assert.ok(a.x<0);const b=advance(a,{x:1,y:0,strength:1},0,.05,false);assert.equal(b.x,a.x);assert.equal(b.speed,0);});
test('large frame gaps cannot teleport and release decelerates',()=>{let a=advance(initialMotion(),{x:0,y:-1,strength:1},0,5);assert.ok(Math.abs(a.z)<.06);for(let i=0;i<60;i++)a=advance(a,{x:0,y:0,strength:0},0,1/60);assert.ok(a.speed<.001);});
