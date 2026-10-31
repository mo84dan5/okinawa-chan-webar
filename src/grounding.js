export function safeSource(uri){try{const url=new URL(uri);return url.protocol==='https:'?url.href:null;}catch{return null;}}
export function appendGrounding(answer,metadata){
 if(!metadata)return;
 const sources=metadata.groundingChunks??[];
 const box=document.createElement('span');box.className='grounding-sources';
 for(const [index,chunk] of sources.entries()){
  const href=safeSource(chunk.web?.uri);if(!href)continue;
  const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=`[${index+1}] ${chunk.web.title||'参照元'}`;box.append(link);
 }
 for(const support of metadata.groundingSupports??[]){
  if(!support.segment?.text)continue;
  const indices=(support.groundingChunkIndices??[]).filter(i=>safeSource(sources[i]?.web?.uri));if(!indices.length)continue;
  const citation=document.createElement('small');citation.textContent=`${support.segment.text} — ${indices.map(i=>`[${i+1}]`).join(' ')}`;box.append(citation);
 }
 if(metadata.searchEntryPoint?.renderedContent){
  const frame=document.createElement('iframe');frame.title='Google Search suggestions';frame.setAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox');frame.referrerPolicy='no-referrer';
  frame.srcdoc=`<meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:"><base target="_blank">${metadata.searchEntryPoint.renderedContent}`;box.append(frame);
 }
 if(box.childNodes.length)answer.append(box);
}
