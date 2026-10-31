import {configureRenderer,lightScene} from './lighting.js';
import {chatController} from './chat.js';
import {expressionPanel} from './expressions.js';
import './style.css';
import * as THREE from 'three';
import {loadAvatar} from './avatar.js';
import {joystick} from './joystick.js';
import {initialMotion,advance} from './movement.js';
import {loadEngine,arModule} from './ar.js';
window.THREE=THREE;
const $=id=>document.getElementById(id),stick=joystick($('stick'));
let faceView=false,avatar,motion=initialMotion(),mode='welcome',tracked=false,placed=false,hit=null,arCamera,XR8,resetPending=false,last=performance.now(),elapsed=0;
const chat=chatController();$('expressions-panel').addEventListener('input',()=>chat.stopSpeech(),true);$('expressions-panel').addEventListener('change',()=>chat.stopSpeech(),true);
const anchor=new THREE.Vector3(),direction=new THREE.Vector3();
const scene=new THREE.Scene();scene.background=new THREE.Color('#e8f2ed');scene.fog=new THREE.Fog('#e8f2ed',12,25);
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.01,50);
const renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));configureRenderer(renderer);
lightScene(scene);
const floor=new THREE.Mesh(new THREE.CircleGeometry(20,96),new THREE.MeshStandardMaterial({color:'#dcebe3',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);
const grid=new THREE.GridHelper(30,60,0x9dc4bc,0xc3dcd3);grid.position.y=-.004;scene.add(grid);
const halo=new THREE.Mesh(new THREE.RingGeometry(.48,.49,96),new THREE.MeshBasicMaterial({color:0x3ca79c,transparent:true,opacity:.5,side:THREE.DoubleSide}));halo.rotation.x=-Math.PI/2;halo.position.y=.002;scene.add(halo);
const reticle=new THREE.Mesh(new THREE.RingGeometry(.09,.105,48),new THREE.MeshBasicMaterial({color:0x50f5cf,side:THREE.DoubleSide}));reticle.rotation.x=-Math.PI/2;reticle.visible=false;
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(mode==='welcome'){const mobile=innerWidth<600;camera.position.set(mobile?0:1.5,mobile?1.25:1.15,mobile?3.9:4.2);camera.lookAt(mobile?0:-.7,mobile?.65:.85,0);if(avatar){avatar.root.position.set(mobile?0:.7,mobile?.75:0,0);avatar.root.scale.setScalar(mobile?.5:1);avatar.resetPhysics();}}}
window.addEventListener('resize',()=>{if(mode!=='ar')resize();else{$('scene').width=innerWidth;$('scene').height=innerHeight;}});resize();
function status(message){if($('status').textContent!==message)$('status').textContent=message;}
function tick(activeCamera){
 const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;elapsed+=dt;if(!avatar)return;chat.update(avatar.vrm.expressionManager,elapsed);
 if(mode==='welcome'){avatar.animate(initialMotion(),document.hidden?0:dt,activeCamera);return;}
 activeCamera.getWorldDirection(direction);const yaw=faceView?0:Math.atan2(-direction.x,-direction.z);
 motion=advance(motion,stick.read(),yaw,dt,(mode==='demo'||tracked&&placed)&&!document.hidden);
 const modelScale=Number($('size').value);avatar.root.position.set(anchor.x+motion.x*modelScale,anchor.y,anchor.z+motion.z*modelScale);avatar.root.rotation.y=motion.yaw;avatar.root.scale.setScalar(Number($('size').value));avatar.animate(motion,document.hidden?0:dt,activeCamera);$('jump').disabled=avatar.jumping||!(mode==='demo'||tracked&&placed)||document.hidden;$('gait').textContent=avatar.jumping?'ジャンプ':({idle:'停止',walk:'歩く',run:'走る',sprint:'全力で走る'}[motion.gait]);if(faceView&&mode==='demo'){const head=avatar.vrm.humanoid.getRawBoneNode('head').getWorldPosition(new THREE.Vector3());const closeOffset=new THREE.Vector3(0,.04,1.05*modelScale).applyAxisAngle(new THREE.Vector3(0,1,0),motion.yaw);camera.position.copy(head).add(closeOffset);camera.lookAt(head);}if(resetPending){avatar.resetPhysics();resetPending=false;}
}
renderer.setAnimationLoop(()=>{if(mode==='ar')return;tick(camera);renderer.render(scene,camera);});
function playing(){document.body.classList.add('playing');$('welcome').hidden=true;$('controls').hidden=false;stick.reset();}
$('jump').onclick=()=>{if(mode==='demo'||tracked&&placed)avatar?.jump();};
function showExpressions(show){$('expressions-panel').hidden=!show;$('expressions-toggle').setAttribute('aria-expanded',String(show));}
$('expressions-toggle').onclick=()=>showExpressions($('expressions-panel').hidden);$('expressions-close').onclick=()=>showExpressions(false);
$('face-view').onclick=()=>{faceView=!faceView;$('face-view').textContent=faceView?'全身へ戻す':'顔を近くで';if(!faceView){camera.position.set(0,1.6,3.3);camera.lookAt(0,.45,0);}};
$('demo').onclick=()=>{mode='demo';resetPending=true;playing();anchor.set(0,0,0);motion=initialMotion();camera.position.set(0,1.6,3.3);camera.lookAt(0,.45,0);$('mode').textContent='3D PLAY';status('3Dおためし · 左のスティックで歩こう');};
function fail(error){tracked=false;stick.reset();if(XR8)XR8.stop();$('error-text').textContent=error?.message||String(error);$('error').showModal();}
$('close-error').onclick=()=>location.reload();$('exit').onclick=()=>location.reload();
$('about').onclick=()=>$('credits').showModal();
function updateTracking(value){tracked=value;if(!value){stick.reset();hit=null;reticle.visible=false;$('place').disabled=true;}status(!value?'床をゆっくり映して、周囲を見回してください':placed?'左のスティックで歩こう':'床の目印に合わせて「ここに置く」');}
function updateAR(){
 if(!arCamera)return;tick(arCamera);
 if(!placed&&tracked){const hits=XR8.XrController.hitTest(.5,.65,['FEATURE_POINT']);hit=hits.find(h=>h.distance>.2&&h.distance<8)??null;reticle.visible=!!hit;$('place').disabled=!hit;if(hit)reticle.position.copy(hit.position);}
}
$('start').onclick=async()=>{
 $('start').disabled=true;status('ARエンジンを準備しています…');
 try{
  if(!window.isSecureContext)throw Error('ARはHTTPSで開いてください。');
  // iOS permission must be requested directly from the user's tap.
  if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'){const permission=await DeviceMotionEvent.requestPermission();if(permission!=='granted')throw Error('モーションへのアクセスが必要です。');}
  XR8=await loadEngine();await XR8.loadChunk('slam');mode='ar';faceView=false;$('face-view').hidden=true;playing();document.body.classList.add('ar');$('mode').textContent='6DoF · AR';renderer.setAnimationLoop(null);renderer.dispose();
  const canvas=document.createElement('canvas');canvas.id='scene';canvas.width=innerWidth;canvas.height=innerHeight;$('scene').replaceWith(canvas);
  XR8.XrController.configure({disableWorldTracking:false,scale:'absolute'});
  XR8.addCameraPipelineModules([XR8.GlTextureRenderer.pipelineModule(),XR8.Threejs.pipelineModule(),XR8.XrController.pipelineModule(),arModule({XR8,ready:({scene,camera,renderer})=>{arCamera=camera;configureRenderer(renderer);lightScene(scene);scene.add(avatar.root,reticle);avatar.root.visible=false;$('place').hidden=false;updateTracking(false);},update:updateAR,tracking:updateTracking,fail})]);
  await XR8.run({canvas});
 }catch(error){fail(error);}
};
$('place').onclick=()=>{if(!hit||!tracked)return;anchor.copy(hit.position);motion=initialMotion();placed=true;avatar.root.visible=true;reticle.visible=false;$('place').hidden=true;$('replace').hidden=false;resetPending=true;updateTracking(true);};
$('replace').onclick=()=>{placed=false;hit=null;stick.reset();avatar.root.visible=false;$('place').hidden=false;$('place').disabled=true;$('replace').hidden=true;updateTracking(tracked);};
$('size').onchange=()=>{resetPending=true;};
document.addEventListener('visibilitychange',()=>{stick.reset();last=performance.now();if(mode==='ar'){if(document.hidden){tracked=false;XR8.pause();}else{XR8.resume();updateTracking(false);}}});
try{avatar=await loadAvatar(e=>status(e.total?`キャラクターを読み込み中 ${Math.round(e.loaded/e.total*100)}%`:'キャラクターを読み込んでいます'));expressionPanel(avatar.vrm.expressionManager,$('expressions-panel'));scene.add(avatar.root);resize();$('start').disabled=false;$('demo').disabled=false;$('start').textContent='カメラで会いにいく ↗';status('準備できました ·「話す」で会話できます');}catch(error){status('読み込みに失敗しました。再読み込みしてください。');fail(error);}
