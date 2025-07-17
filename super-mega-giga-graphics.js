(function(global){
  const config = {
    name: 'SuperMegaGigaGraphics',
    version: '1.0.0',
    description: 'Ultra-modern, pixel-perfect, resolution-agnostic HTML5 Canvas graphics engine for indie games and apps.',
    author: 'Sophie Loopmaker & Team',
    defaultResolution: 'hi-res',
    resolutions: [
      { name: 'low-res', width: 320, height: 200, scale: 1, aspect: '16:10' },
      { name: 'midres', width: 640, height: 400, scale: 2, aspect: '16:10' },
      { name: 'hi-res', width: 960, height: 600, scale: 3, aspect: '16:10' },
      { name: 'super-hi-res', width: 1280, height: 800, scale: 4, aspect: '16:10' },
      { name: 'mega-hi-res', width: 1600, height: 1000, scale: 5, aspect: '16:10' },
      { name: 'giga-hi-res', width: 1920, height: 1200, scale: 6, aspect: '16:10' },
      { name: 'super-mega-giga-hi-res', width: 2560, height: 1600, scale: 8, aspect: '16:10' },
      { name: '240p', width: 426, height: 240, scale: 1, aspect: '16:9' },
      { name: '480p', width: 854, height: 480, scale: 2, aspect: '16:9' },
      { name: '720p', width: 1280, height: 720, scale: 3, aspect: '16:9' },
      { name: '1080p', width: 1920, height: 1080, scale: 4, aspect: '16:9' }
    ],
    canvas: {
      autoFit: true,
      pixelPerfect: true,
      backgroundColor: '#181820',
      smoothing: false,
      scalingMode: 'integer',
      allowHiDPIScaling: true,
      centered: true,
      defaultFont: 'Orbitron, monospace'
    },
    storage: {
      type: 'localStorage',
      autosave: true,
      fields: ['lastResolution', 'settings', 'canvasData']
    },
    ui: {
      showResolutionSelector: true,
      resolutionSelectorStyle: 'dropdown',
      customCSS: ''
    }
  };

  let canvas, ctx;
  let currentResolution = config.resolutions.find(r => r.name === config.defaultResolution);

  function initCanvas(resolutionName, containerId) {
    setResolution(resolutionName || config.defaultResolution);
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    applyCanvasSettings();
    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) container.appendChild(canvas);
    } else {
      document.body.appendChild(canvas);
    }
    resizeToFitScreen();
    return ctx;
  }

  function applyCanvasSettings() {
    if (!canvas) return;
    canvas.width = currentResolution.width;
    canvas.height = currentResolution.height;
    canvas.style.imageRendering = config.canvas.pixelPerfect ? 'pixelated' : 'auto';
    canvas.style.backgroundColor = config.canvas.backgroundColor;
  }

  function setResolution(name) {
    const res = config.resolutions.find(r => r.name === name);
    if (res) {
      currentResolution = res;
      if (canvas) {
        applyCanvasSettings();
        resizeToFitScreen();
      }
    }
  }

  function clear() {
    if (ctx) {
      ctx.fillStyle = config.canvas.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function drawImage(image, x, y, width, height) {
    if (ctx) {
      ctx.imageSmoothingEnabled = config.canvas.smoothing;
      ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    }
  }

  function drawRect(x, y, width, height, color) {
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    }
  }

  function drawText(text, x, y, fontSize, color, fontFamily) {
    if (ctx) {
      ctx.imageSmoothingEnabled = config.canvas.smoothing;
      ctx.font = `${fontSize || 16}px ${fontFamily || config.canvas.defaultFont}`;
      ctx.fillStyle = color || '#fff';
      ctx.textBaseline = 'top';
      ctx.fillText(text, Math.round(x), Math.round(y));
    }
  }

  function resizeToFitScreen() {
    if (!canvas || !config.canvas.autoFit) return;
    const scale = currentResolution.scale;
    canvas.style.width = currentResolution.width * scale + 'px';
    canvas.style.height = currentResolution.height * scale + 'px';
    if (config.canvas.centered) {
      canvas.style.display = 'block';
      canvas.style.margin = '0 auto';
    }
  }

  function getCurrentResolution() {
    return currentResolution;
  }

  function saveScreenshot(format) {
    if (!canvas) return null;
    const type = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return canvas.toDataURL(type);
  }

  const api = {
    initCanvas,
    setResolution,
    clear,
    drawImage,
    drawRect,
    drawText,
    resizeToFitScreen,
    getCurrentResolution,
    saveScreenshot
  };

  global.SuperMegaGigaGraphics = Object.assign(api, { config });
})(this);

