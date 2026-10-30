import {cp,mkdir} from 'node:fs/promises';
await mkdir('public/engine',{recursive:true});
await cp('node_modules/@8thwall/engine-binary/dist','public/engine',{recursive:true});
