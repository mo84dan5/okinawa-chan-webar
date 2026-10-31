import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const css=postcss.parse(readFileSync(new URL('../src/style.css',import.meta.url),'utf8'));
function touchAction(selector){
 let value;css.walkRules(rule=>{if(rule.selectors.includes(selector))rule.walkDecls('touch-action',decl=>{value=decl.value;});});return value;
}
test('buttons disable double-tap zoom while allowing pan and pinch gestures',()=>{
 assert.equal(touchAction('button'),'manipulation');
});
test('scene and movement stick keep their dedicated gesture handling',()=>{
 assert.equal(touchAction('#scene'),'none');assert.equal(touchAction('.stick'),'none');
});
