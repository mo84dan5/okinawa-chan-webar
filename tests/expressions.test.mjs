import test from 'node:test';import assert from 'node:assert/strict';
import {expressionGroups,setExpression} from '../src/expressions.js';
test('23 poses, group switching clears previous pose without clearing other facial regions',()=>{
 assert.equal(Object.values(expressionGroups).flat().length,23);const values={},manager={setValue:(n,v)=>values[n]=v};
 setExpression(manager,'eyes','blink',.5);setExpression(manager,'mouth','aa',.7);assert.equal(values.blink,.5);
 setExpression(manager,'eyes','happy_eye',2);assert.equal(values.blink,0);assert.equal(values.happy_eye,1);assert.equal(values.aa,.7);
 setExpression(manager,'eyes','',0);assert.equal(values.happy_eye,0);
});
