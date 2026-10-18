const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function startBrowser({width=1600,height=900,scale=1,port=8137,debugPort=9237}={}){
 const root=process.cwd(),errors=[],requests=[];
 const server=http.createServer((req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))throw Error('Invalid path');const type={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.pdf':'application/pdf'}[path.extname(file)]||'application/octet-stream';res.setHeader('Content-Type',type);res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end('Not found');}});
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 const browser=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port='+debugPort,'--user-data-dir='+path.join(root,'.qa','api-browser-profile'),'--window-size='+width+','+height,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let ws,id=0;const pending=new Map();
 function cdp(method,params={}){return new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});}
 async function close(){if(ws?.readyState===1){try{await cdp('Browser.close');}catch{}ws.close();}browser.kill();server.close();}
 try{
  let page;for(let i=0;i<80;i++){await sleep(100);try{page=(await(await fetch('http://127.0.0.1:'+debugPort+'/json/list')).json()).find(p=>p.type==='page');if(page)break;}catch{}}
  if(!page)throw Error('Chrome startup failed');ws=new WebSocket(page.webSocketDebuggerUrl);ws.addEventListener('close',()=>{for(const p of pending.values())p.reject(Error('Browser connection closed'));pending.clear()});
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);});
  await new Promise(resolve=>ws.addEventListener('open',resolve));await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Network.enable');await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:scale,mobile:false});
  async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
  async function until(expression){for(let i=0;i<120;i++){try{if(await evaluate(expression))return;}catch{}await sleep(60);}throw Error('Timed out: '+expression);}
  async function navigate(url,ready='document.readyState==="complete"'){await cdp('Page.navigate',{url});await until('location.href==='+JSON.stringify(url)+'&&('+ready+')');}
  async function screenshot(file){const r=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(file,Buffer.from(r.data,'base64'));}
  return{cdp,evaluate,until,navigate,screenshot,close,errors,requests,url:'http://127.0.0.1:'+port};
 }catch(e){await close();throw e;}
}
module.exports={startBrowser,sleep};
