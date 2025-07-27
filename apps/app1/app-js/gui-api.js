(function(){
    function loadApp(name){
        const script=document.createElement('script');
        script.src=`app-js/${name}.js`;
        document.body.appendChild(script);
    }
    function createWindow(type){
        if(window.openWindow) window.openWindow(type);
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
