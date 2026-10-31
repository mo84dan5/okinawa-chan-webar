(()=>{
 const url=new URL(location.href);let key='';
 for(const name of ['api_key','gemini_api_key','key']){const value=url.searchParams.get(name);if(value&&!key)key=value.trim();url.searchParams.delete(name);}
 if(url.href!==location.href)history.replaceState(null,'',url.href);
 if(key){window.aiaoInitialKey=key;try{sessionStorage.setItem('aiao-gemini-key',key);}catch{}}
})();
