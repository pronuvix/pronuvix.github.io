const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
 const server = spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try {
  const base='http://127.0.0.1:8765';
  for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{} await new Promise(r=>setTimeout(r,200));}
  browser=await chromium.launch(); fs.mkdirSync('homepage-previews',{recursive:true});
  const failures=[];
  for(const lang of ['en','pt','fr','es']) for(const width of [360,768,1440]) for(const colorScheme of ['light','dark']){
   const page=await browser.newPage({viewport:{width,height:900},colorScheme});
   const key=lang+'-'+width+'-'+colorScheme; const errors=[];
   page.on('pageerror',e=>errors.push(e.message)); page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
   try {
    const response=await page.goto(base+'/zelunvo/'+(lang==='en'?'':lang+'/'));
    assert(response.ok()); await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:'homepage-previews/'+key+'.png',fullPage:true});
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('nav [aria-current=page]').count(),1);
    assert.equal(await page.locator('footer .footer-group').count(),3);
    assert.equal(await page.locator('a[href^="mailto:"]').count(),0);
    assert.equal(await page.locator('html').getAttribute('lang'),lang==='pt'?'pt-PT':lang);
    for(const selector of ['.privacy-visual','.finance-preview','.closing-cta','.hero-cta'])assert(await page.locator(selector).first().isVisible(),selector);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
    assert(await page.evaluate(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)),'Broken image');
    assert.equal(errors.length,0,errors.join('; '));
   }catch(e){failures.push(key+': '+e.message);}finally{await page.close();}
  }
  assert.equal(failures.length,0,failures.join('\n')); console.log('24 homepage configurations verified');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
