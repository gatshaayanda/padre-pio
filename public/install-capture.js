(function () {
  window.addEventListener("beforeinstallprompt", function (event) {
    var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (standalone || window.__padrePioPwaListenerReady === true) return;
    event.preventDefault();
    window.__padrePioInstallPrompt = event;
  });
})();