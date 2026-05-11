(function(){
    const loaded=new Set();
    function loadApp(name){
        const safe=name.toLowerCase().replace(/\s+/g,'');
        if(loaded.has(safe)){
            const type=window.appTypeMap && window.appTypeMap[name.toLowerCase()];
            if(type && window.openWindow) window.openWindow(type);
            return;
        }
        const script=document.createElement('script');
        const base=(window.ORBIT_BASE_PATH||'');
        script.src=`${base}app-js/${safe}.js`;
        script.onload=()=>loaded.add(safe);
        document.body.appendChild(script);
    }
    function createWindow(type){
        if(window.openWindow) return window.openWindow(type);
    }
    function closeWin(id){ if(window.closeWindow) window.closeWindow(id); }
    function minimizeWin(id){ if(window.minimizeWindow) window.minimizeWindow(id); }
    function maximizeWin(id){ if(window.maximizeWindow) window.maximizeWindow(id); }
    window.loadApp=loadApp;
    window.WinAPI={
        createWindow,
        closeWindow:closeWin,
        minimizeWindow:minimizeWin,
        maximizeWindow:maximizeWin
    };
})();
