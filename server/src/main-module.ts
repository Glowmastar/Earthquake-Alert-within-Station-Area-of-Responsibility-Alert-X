import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function isMainModule(moduleUrl:string,entryPath=process.argv[1]){
 return Boolean(entryPath)&&resolve(fileURLToPath(moduleUrl))===resolve(entryPath);
}
