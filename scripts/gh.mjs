// Pin this app's GitHub commands to the requested account without storing a token.
import {execFileSync,spawnSync} from 'node:child_process';
const token=execFileSync('gh',['auth','token','--hostname','github.com','--user','mo84dan5'],{encoding:'utf8'}).trim();
const child=spawnSync('gh',process.argv.slice(2),{stdio:'inherit',env:{...process.env,GH_TOKEN:token}});
process.exit(child.status??1);
