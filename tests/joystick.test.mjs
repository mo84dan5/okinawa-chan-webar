import test from 'node:test';import assert from 'node:assert/strict';import {joystick} from '../src/joystick.js';
test('stick releases on cancellation, blur and hidden page; second pointer is ignored',()=>{
 globalThis.window=new EventTarget();globalThis.document=new EventTarget();const target=new EventTarget(),knob={style:{transform:''}};target.querySelector=()=>knob;target.style={setProperty(){}};target.setPointerCapture=()=>{};target.getBoundingClientRect=()=>({left:0,top:0,width:144,height:144});const stick=joystick(target);
 const send=(type,x=115,id=1)=>{const event=new Event(type);Object.assign(event,{clientX:x,clientY:72,pointerId:id});target.dispatchEvent(event);};
 send('pointerdown');assert.ok(stick.read().strength>.5);send('pointerdown',30,2);send('pointermove',30,2);assert.ok(stick.read().x>0);send('pointercancel');assert.equal(stick.read().strength,0);send('pointerdown');window.dispatchEvent(new Event('blur'));assert.equal(stick.read().strength,0);send('pointerdown');document.dispatchEvent(new Event('visibilitychange'));assert.equal(stick.read().strength,0);
});
