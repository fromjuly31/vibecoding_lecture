const fs=require('fs'),assert=require('assert/strict'),{startBrowser}=require('./browser-qa.cjs');
(async()=>{const browser=await startBrowser({width:1600,height:600,scale:1.5});try{
 const catalog=JSON.parse(fs.readFileSync('assets/api/catalog.json','utf8'));
 for(const item of catalog){await browser.navigate(browser.url+'/assets/api/screens.html?api='+item.slug,'!!window.API_SCREEN_READY');await browser.evaluate('API_SCREEN_READY');
  const audit=await browser.evaluate(`({images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),overflow:[...document.querySelectorAll('#screen .panel,#screen .book-card,#screen .phone')].filter(e=>e.scrollHeight>e.clientHeight+2).map(e=>({class:e.className,extra:e.scrollHeight-e.clientHeight})),height:document.documentElement.scrollHeight})`);
  assert.equal(audit.images,true,item.slug+' images');assert.equal(audit.height,600,item.slug+' height');assert.deepEqual(audit.overflow,[],item.slug+' clipped content');
  await browser.screenshot('assets/api/'+item.slug+'.png');console.log(item.slug,JSON.stringify(audit));
 }assert.equal(browser.errors.length,0,browser.errors.join('\n'));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
