import test from 'node:test';import assert from 'node:assert/strict';
import {statusPresenter} from '../src/status.js';
test('walking hints hide at 5 seconds in demo and AR without repeated tracking updates extending them',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const message of ['左のスティックで歩こう','3Dおためし · 左のスティックで歩こう']){
 const element={textContent:'',hidden:false},show=statusPresenter(element);show(message);t.mock.timers.tick(4999);show(message);assert.equal(element.hidden,false);t.mock.timers.tick(1);assert.equal(element.hidden,true);show(message);assert.equal(element.hidden,true);
 }
});
test('a new tracking instruction remains visible and a subsequent walking hint gets its own 5 seconds',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const element={textContent:'',hidden:false},show=statusPresenter(element);show('左のスティックで歩こう');t.mock.timers.tick(3000);show('床を映してください');t.mock.timers.tick(5000);assert.equal(element.hidden,false);assert.equal(element.textContent,'床を映してください');show('左のスティックで歩こう');t.mock.timers.tick(5000);assert.equal(element.hidden,true);
});
