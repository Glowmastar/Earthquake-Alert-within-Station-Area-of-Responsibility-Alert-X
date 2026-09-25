import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {isMainModule} from '../server/src/main-module.js';

test('CLI entry-point detection accepts the current platform path format',()=>{
 assert.equal(isMainModule(import.meta.url,fileURLToPath(import.meta.url)),true);
 assert.equal(isMainModule(import.meta.url,fileURLToPath(new URL('./logic.test.ts',import.meta.url))),false);
 assert.equal(isMainModule(import.meta.url,''),false);
});
