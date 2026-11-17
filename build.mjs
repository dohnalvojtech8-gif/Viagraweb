import {readFile,writeFile,mkdir} from 'node:fs/promises';
const html=await readFile('worker/page.html','utf8'),content=await readFile('worker/content.json','utf8');
await writeFile('worker/page.js','export default '+JSON.stringify(html)+';\n');await writeFile('worker/content.js','export default '+content+';\n');
const source=(await readFile('worker/index.js','utf8')).replace("import html from './page.js';",'const html='+JSON.stringify(html)+';').replace("import defaults from './content.js';",'const defaults='+content+';');await mkdir('dist/server',{recursive:true});await writeFile('dist/server/index.js',source);
