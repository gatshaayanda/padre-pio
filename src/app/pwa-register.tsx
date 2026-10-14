"use client";

import { useEffect, useRef, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallWindow = Window & {
  __padrePioInstallPrompt?: Event;
  __padrePioPwaListenerReady?: boolean;
};

type Platform = "ios" | "android" | "desktop";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function isEmbeddedBrowser() {
  const ua = navigator.userAgent || "";
  return /WhatsApp|Instagram|FBAN|FBAV|Messenger|Line\/|Twitter|TikTok|Snapchat/i.test(ua) ||
    (/Android/i.test(ua) && /; wv\)/i.test(ua));
}

export default function PwaRegister() {
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installed, setInstalled] = useState(false);
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      if (isStandalone()) return;
      event.preventDefault();
      promptRef.current = event as InstallPromptEvent;
    };
    const onInstalled = () => {
      promptRef.current = null;
      setInstalled(true);
      setHelpOpen(false);
      setEmbedded(false);
    };
    const onInstallClick = () => {
      setPlatform(detectPlatform());
      if (isStandalone()) {
        setInstalled(true);
        setHelpOpen(true);
        return;
      }
      if (isEmbeddedBrowser()) {
        setEmbedded(true);
        setHelpOpen(true);
        return;
      }
      setEmbedded(false);
      const prompt = promptRef.current;
      if (prompt) {
        // Call prompt() directly during the user's click gesture.
        promptRef.current = null;
        void prompt.prompt().then(() => prompt.userChoice).then(() => {
          setHelpOpen(false);
        }).catch(() => {
          setHelpOpen(true);
        });
        return;
      }
      // The native event is browser-controlled; use guidance only when unavailable.
      setHelpOpen(true);
    };
    const register = async () => {
      if (!("serviceWorker" in navigator)) return;
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        // The website remains usable if service-worker registration is unavailable.
      }
    };

    const installWindow = window as InstallWindow;
    if (isStandalone()) setInstalled(true);
    // Adopt an event captured before React hydrated, then mark the regular
    // listener as ready so the early listener does not swallow later events.
    const earlyPrompt = installWindow.__padrePioInstallPrompt;
    if (earlyPrompt) {
      delete installWindow.__padrePioInstallPrompt;
      onBeforeInstall(earlyPrompt);
    }
    installWindow.__padrePioPwaListenerReady = true;
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("padre-pio-install", onInstallClick);
    void register();

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("padre-pio-install", onInstallClick);
    };
  }, []);

  function openInBrowser() {
    const url = window.location.href;
    if (detectPlatform() === "android") {
      window.location.href = "intent://" + url.replace(/^https?:\/\//, "") +
        "#Intent;scheme=https;package=com.android.chrome;end";
      return;
    }
    // Some embedded browsers allow opening the current page in a full browser;
    // where they do not, the on-screen instructions remain available.
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!helpOpen) return null;

  return (
    <div className="padreInstallBackdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setHelpOpen(false);
    }}>
      <section className="padreInstallDialog" role="dialog" aria-modal="true" aria-labelledby="padre-install-title">
        <button className="padreInstallClose" type="button" aria-label="Close installation help" onClick={() => setHelpOpen(false)}>×</button>
        <span className="padreEyebrow">OPTIONAL · KEEP IT CLOSE</span>
        <h2 id="padre-install-title">{installed ? "Padre Pio is already installed" : embedded ? "Open Padre Pio in your browser" : "Add Padre Pio to your home screen"}</h2>
        {installed ? (
          <p>Open Padre Pio from your device’s home screen or app list. You can also continue using this website here.</p>
        ) : embedded ? (
          <>
            <p>This in-app browser may not support installation. Open this page in Chrome or your device browser, then tap Install again.</p>
            <button className="padreButton padreButtonPrimary" type="button" onClick={openInBrowser}>Open in browser ↗</button>
            <p className="padreInstallNote">If the button does not open your browser, use this app’s menu and choose Open in browser. You can still use the website without installing it.</p>
          </>
        ) : platform === "ios" ? (
          <p>In Safari, tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>. Installation is not required to use the website.</p>
        ) : platform === "android" ? (
          <p>Chrome has not provided a native install prompt in this visit. Check that you are using Chrome, then try again; if the prompt is still unavailable, open Chrome’s menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, if offered.</p>
        ) : (
          <p>When supported, your browser will show its native install prompt. If it is unavailable, use Chrome or Edge’s <strong>Install app</strong> option.</p>
        )}
        {!installed && !embedded && <p className="padreInstallNote">You can keep using this website without installing it.</p>}
        <button className="padreButton padreButtonPrimary" type="button" onClick={() => setHelpOpen(false)}>Continue on website</button>
      </section>
    </div>
  );
}
