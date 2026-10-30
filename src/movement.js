export const initialMotion=()=>({x:0,z:0,yaw:0,speed:0,phase:0});
export function stickVector(dx,dy,radius){
 const length=Math.hypot(dx,dy),raw=Math.min(1,length/radius);
 if(raw<.12)return {x:0,y:0,strength:0};
 return {x:dx/length,y:dy/length,strength:(raw-.12)/.88};
}
export function advance(state,input,cameraYaw,delta,enabled=true){
 const dt=Math.max(0,Math.min(.05,delta));
 if(!enabled)return {...state,speed:0};
 const speed=state.speed+(input.strength*.85-state.speed)*(1-Math.exp(-12*dt));
 const dx=input.x*Math.cos(cameraYaw)+input.y*Math.sin(cameraYaw);
 const dz=-input.x*Math.sin(cameraYaw)+input.y*Math.cos(cameraYaw);
 const target=input.strength?Math.atan2(dx,dz):state.yaw;
 const angle=Math.atan2(Math.sin(target-state.yaw),Math.cos(target-state.yaw));
 const yaw=state.yaw+angle*(1-Math.exp(-14*dt));
 return {x:state.x+(input.strength?dx:Math.sin(yaw))*speed*dt,z:state.z+(input.strength?dz:Math.cos(yaw))*speed*dt,yaw,speed,phase:state.phase+speed*dt/.62*Math.PI*2};
}
