export async function loadEngine(){
 if(window.XR8)return window.XR8;
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='./engine/xr.js';script.dataset.preloadChunks='slam';script.async=true;
  const timer=setTimeout(()=>reject(Error('ARエンジンの読み込みがタイムアウトしました。通信状態を確認してください。')),45000);
  window.addEventListener('xrloaded',()=>{clearTimeout(timer);resolve(window.XR8);},{once:true});
  script.onerror=()=>{clearTimeout(timer);reject(Error('ARエンジンを読み込めませんでした。ページを再読み込みしてください。'));};document.head.append(script);
 });
}
export function arModule({XR8,ready,update,tracking,fail}){
 return {name:'okinawa-world',onStart:()=>{const scene=XR8.Threejs.xrScene();scene.camera.position.set(0,1.5,0);XR8.XrController.updateCameraProjectionMatrix({origin:scene.camera.position,facing:scene.camera.quaternion});ready(scene);},onUpdate:({processCpuResult})=>{const reality=processCpuResult?.reality;if(reality)tracking(reality.trackingStatus==='NORMAL');update();},onException:error=>fail(error),onCameraStatusChange:({status})=>{if(status==='failed')fail(Error('カメラを開始できません。Safari / Chromeのカメラ許可を確認してください。'));},listeners:[{event:'reality.trackingstatus',process:({detail})=>tracking(detail.status==='NORMAL')}]};
}
