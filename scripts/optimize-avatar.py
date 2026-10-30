# Run with: uv run --with pillow python scripts/optimize-avatar.py SOURCE.vrm
import struct,json,io,hashlib,sys
from pathlib import Path
from PIL import Image
b=Path(sys.argv[1]).read_bytes();jl=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+jl]);data=b[28+jl:];replacements={};sizes=[]
for image in j['images']:
 index=image['bufferView'];view=j['bufferViews'][index];start=view.get('byteOffset',0);im=Image.open(io.BytesIO(data[start:start+view['byteLength']]));old=im.size;im.thumbnail((1024,1024),Image.Resampling.LANCZOS);out=io.BytesIO();im.save(out,format='PNG');replacements[index]=out.getvalue();image['mimeType']='image/png';sizes.append({'before':old,'after':im.size})
compact=bytearray()
for index,view in enumerate(j['bufferViews']):
 while len(compact)%4:compact.append(0)
 start=view.get('byteOffset',0);blob=replacements.get(index,data[start:start+view['byteLength']]);view['byteOffset']=len(compact);view['byteLength']=len(blob);compact.extend(blob)
j['buffers'][0]['byteLength']=len(compact)
while len(compact)%4:compact.append(0)
js=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode();js+=b' '*((-len(js))%4)
result=struct.pack('<III',0x46546c67,2,28+len(js)+len(compact))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(compact),0x004e4942)+compact
folder=Path(__file__).resolve().parents[1]/'public/models';(folder/'okinawa.vrm').write_bytes(result)
(folder/'provenance.json').write_text(json.dumps({'source_sha256':hashlib.sha256(b).hexdigest(),'web_sha256':hashlib.sha256(result).hexdigest(),'optimization':'Textures reduced to 1024px. Geometry, UV, alpha, MToon, rig and springs preserved. Original kept outside repository.','images':sizes,'bytes':len(result)},indent=2));print(len(b),len(result))
