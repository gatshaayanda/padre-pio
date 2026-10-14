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
  const [platformReady, setPlatformReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [nativePromptAvailable, setNativePromptAvailable] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      if (isStandalone()) return;
      event.preventDefault();
      promptRef.current = event as InstallPromptEvent;
      setNativePromptAvailable(true);
      setDismissed(false);
    };
    const onInstalled = () => {
      promptRef.current = null;
      setNativePromptAvailable(false);
      setInstalled(true);
      setDismissed(true);
      setHelpOpen(false);
      setEmbedded(false);
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
    setPlatform(detectPlatform());
    setEmbedded(isEmbeddedBrowser());
    setPlatformReady(true);
    if (isStandalone()) { setInstalled(true); setDismissed(true); }
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
    void register();

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function installOrExplain() {
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
      // Call prompt() directly in this button's click handler.
      promptRef.current = null;
      setNativePromptAvailable(false);
      void prompt.prompt().then(() => prompt.userChoice).then((choice) => {
        if (choice.outcome === "accepted") {
          setInstalled(true);
          setDismissed(true);
          setHelpOpen(false);
        } else {
          setHelpOpen(true);
        }
      }).catch(() => setHelpOpen(true));
      return;
    }
    setHelpOpen(true);
  }

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

  if (!platformReady) return null;

  return (
    <>
      {!installed && !dismissed && (
        <aside className="padreFloatingInstall" aria-label="Install Padre Pio Medical Centre">
          <div className="padreFloatingInstallCopy">
            <span className="padreFloatingInstallMark" aria-hidden="true">✚</span>
            <span>
              <strong>{nativePromptAvailable ? "Install Padre Pio" : platform === "ios" ? "Add Padre Pio to Home Screen" : "Keep Padre Pio close"}</strong>
              <small>{nativePromptAvailable ? "Tap Install to open the browser prompt." : "Optional quick access to the clinic."}</small>
            </span>
          </div>
          <button className="padreFloatingInstallAction" type="button" onClick={installOrExplain}>
            {nativePromptAvailable ? "Install" : platform === "ios" ? "How to add" : embedded ? "Open in browser" : "Install options"}
          </button>
          <button className="padreFloatingInstallDismiss" type="button" aria-label="Dismiss install prompt" onClick={() => setDismissed(true)}>×</button>
        </aside>
      )}

      {helpOpen && (
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
          <>
            <p>On iPhone or iPad, tap <strong>Share</strong>, choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>. If you cannot see the option, scroll the Share actions or check <strong>Edit Actions</strong>.</p>
            <p>If your current browser does not offer this option, open this same page in Safari and repeat the steps. This website cannot open the iOS installation sheet for you.</p>
          </>
        ) : platform === "android" ? (
          <p>Your browser has not provided a native install prompt in this visit. Open this page in Chrome and use its menu to choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, if offered. The native prompt will appear directly when the browser makes it available.</p>
        ) : (
          <p>When supported, your browser will show its native install prompt. If it is unavailable, use Chrome or Edge’s <strong>Install app</strong> option.</p>
        )}
        {!installed && <p className="padreInstallNote">Installation is optional. You can continue using this website normally.</p>}
        <button className="padreButton padreButtonPrimary" type="button" onClick={() => setHelpOpen(false)}>Continue on website</button>
      </section>
      </div>
      )}
    </>
  );
}
