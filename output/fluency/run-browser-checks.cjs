const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname, '../../dist');
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.pdf':'application/pdf'};
const server = http.createServer((req,res) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname)); }
  catch { res.writeHead(400).end(); return; }
  if (file !== root && !file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
    const data=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(data);
  } catch {res.writeHead(404).end();}
});
async function run(file,base) {
  const code=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[path.join(__dirname,file)],{stdio:'inherit',env:{...process.env,FLUENCY_TEST_URL:base}});
    child.on('error',reject);child.on('exit',resolve);
  });
  if(code !== 0) process.exitCode=1;
}
server.listen(0,'127.0.0.1',async()=>{
  try {
    const base=`http://127.0.0.1:${server.address().port}`;
    await run('browser-verify.cjs',base);
    await run('accessibility.cjs',base);
  } catch(error) {console.error(error);process.exitCode=1;}
  finally {server.close();}
});
