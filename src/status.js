export function statusPresenter(element){
 let current,timer;
 return message=>{
  if(message===current)return;
  clearTimeout(timer);current=message;element.textContent=message;element.hidden=false;
  if(message.includes('左のスティックで歩こう'))timer=setTimeout(()=>{element.hidden=true;},5000);
 };
}
