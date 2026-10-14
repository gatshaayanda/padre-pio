"use client";

import { useEffect, useRef, useState } from "react";
import { X, WifiOff } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaRegister() {
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const nav = navigator as Navigator & { standalone?: boolean };
    const ios = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setPlatform(ios ? "ios" : /Android/i.test(ua) ? "android" : "other");
    setOffline(!navigator.onLine);

    const onPrompt = (event: Event) => {
      if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true) return;
      event.preventDefault();
      promptRef.current = event as InstallPromptEvent;
    };
    const onInstall = () => {
      if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true) return;
      const early = window as Window & { __padrePioInstallPrompt?: Event; __padrePioPwaListenerReady?: boolean };
      const captured = promptRef.current || early.__padrePioInstallPrompt as InstallPromptEvent | undefined;
      if (captured) {
        promptRef.current = captured;
        void captured.prompt().then(async () => {
          await captured.userChoice.catch(() => undefined);
        }).catch(() => {
          setHelpOpen(true);
        }).finally(() => {
          promptRef.current = null;
          delete early.__padrePioInstallPrompt;
        });
      } else {
        setHelpOpen(true);
      }
    };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    const onInstalled = () => setHelpOpen(false);
    const early = window as Window & { __padrePioInstallPrompt?: Event; __padrePioPwaListenerReady?: boolean };
    const earlyPrompt = early.__padrePioInstallPrompt;
    early.__padrePioPwaListenerReady = true;
    if (earlyPrompt) {
      promptRef.current = earlyPrompt as InstallPromptEvent;
      delete early.__padrePioInstallPrompt;
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("padre-pio-open-install", onInstall);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("padre-pio-open-install", onInstall);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return (
    <>
      {offline && <div className="offlineBanner" role="status"><WifiOff size={16} aria-hidden="true" /> You’re offline. You can still view the saved public page; appointment requests need a connection.</div>}
      {helpOpen && (
        <div className="installDialogBackdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setHelpOpen(false); }}>
          <section className="installDialog" role="dialog" aria-modal="true" aria-labelledby="install-dialog-title">
            <div className="installDialogHead"><div><span className="kicker">PADRE PIO · OPTIONAL</span><h2 id="install-dialog-title">Keep us close.</h2></div><button className="installDialogClose" type="button" onClick={() => setHelpOpen(false)} aria-label="Close installation help"><X size={18} aria-hidden="true" /></button></div>
            <p>Installation depends on your browser. You can keep using this website without installing it.</p>
            <div className="installSteps">
              {platform === "ios" ? <ol><li>Open this page in Safari.</li><li>Tap Share.</li><li>Choose “Add to Home Screen”.</li></ol> : platform === "android" ? <ol><li>Open this page in Chrome.</li><li>Open the browser menu.</li><li>Choose “Install app” if it is offered.</li></ol> : <ol><li>Open your browser menu.</li><li>Look for “Install app” or “Create shortcut”.</li><li>If no install option appears, continue using the website.</li></ol>}
            </div>
            <button className="button buttonDark" type="button" onClick={() => setHelpOpen(false)}>Continue to website</button>
          </section>
        </div>
      )}
    </>
  );
}