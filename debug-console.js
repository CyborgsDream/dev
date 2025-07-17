(function(){
  const overlay=document.createElement('div');
  overlay.id='debug-console-overlay';
  overlay.style.cssText=
    'position:fixed;left:0;right:0;bottom:0;height:40vh;display:none;background:rgba(0,0,0,0.8);color:#0f0;font-family:monospace;font-size:12px;z-index:9999;padding:8px;box-sizing:border-box;flex-direction:column;';
  const logEl=document.createElement('div');
  logEl.style.cssText='flex:1;overflow-y:auto;white-space:pre-wrap;margin-bottom:4px;';
  const input=document.createElement('input');
  input.type='text';
  input.style.cssText='width:100%;background:#000;color:#0f0;border:1px solid #0f0;box-sizing:border-box;padding:4px;';
  overlay.appendChild(logEl);
  overlay.appendChild(input);
  document.addEventListener('DOMContentLoaded',()=>{
    document.body.appendChild(overlay);
    document.body.appendChild(btn);
  });
  let visible=false;
  function toggle(){
    visible=!visible;
    overlay.style.display=visible?'flex':'none';
    if(visible) input.focus();
  }
  const btn=document.createElement('button');
  btn.textContent='Console';
  btn.style.cssText='position:fixed;bottom:10px;right:10px;z-index:9999;background:#222;color:#0f0;border:1px solid #0f0;padding:4px;font-family:monospace;';
  btn.addEventListener('click',toggle);
  function log(...args){
    logEl.textContent+=args.join(' ')+"\n";
    logEl.scrollTop=logEl.scrollHeight;
  }
  const origLog=console.log;
  const origErr=console.error;
  console.log=function(...args){origLog.apply(console,args);log(...args);};
  console.error=function(...args){origErr.apply(console,args);log('ERROR:',...args);};
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      const code=input.value;input.value='';
      log('> '+code);
      try{const res=eval(code);if(res!==undefined)log(res);}catch(err){log('ERROR:',err);}
    }else if(e.key==='Escape'){toggle();}
  });
  window.debugConsoleToggle=toggle;
})();
