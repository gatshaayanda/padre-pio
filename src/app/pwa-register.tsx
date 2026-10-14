"use client";

import { useEffect, useRef, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaRegister() {
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    function detectPlatform(): "ios" | "android" | "desktop" {
      const ua = navigator.userAgent || "";
      if (/iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
      if (/Android/i.test(ua)) return "android";
      return "desktop";
    }

    const onBeforeInstall = (event: Event) => {
      if (isStandalone()) return;
      event.preventDefault();
      promptRef.current = event as InstallPromptEvent;
    };
    const onInstalled = () => {
      promptRef.current = null;
      setInstalled(true);
      setHelpOpen(false);
    };
    const onInstallClick = () => {
      setPlatform(detectPlatform());
      if (isStandalone()) {
        setInstalled(true);
        setHelpOpen(true);
        return;
      }
      const prompt = promptRef.current;
      if (prompt) {
        promptRef.current = null;
        void prompt.prompt().then(() => prompt.userChoice).then(() => {
          setHelpOpen(false);
        }).catch(() => {
          setHelpOpen(true);
        });
        return;
      }
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

    if (isStandalone()) setInstalled(true);
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

  if (!helpOpen) return null;

  return (
    <div className="padreInstallBackdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setHelpOpen(false);
    }}>
      <section className="padreInstallDialog" role="dialog" aria-modal="true" aria-labelledby="padre-install-title">
        <button className="padreInstallClose" type="button" aria-label="Close installation help" onClick={() => setHelpOpen(false)}>×</button>
        <span className="padreEyebrow">OPTIONAL · KEEP IT CLOSE</span>
        <h2 id="padre-install-title">{installed ? "Padre Pio is already installed" : "Add Padre Pio to your home screen"}</h2>
        {installed ? (
          <p>Open Padre Pio from your device’s home screen or app list. You can also continue using this website here.</p>
        ) : platform === "ios" ? (
          <p>In Safari, tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.</p>
        ) : platform === "android" ? (
          <p>In Chrome, open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, if offered.</p>
        ) : (
          <p>In Chrome or Edge, use the browser’s <strong>Install app</strong> option when it is available.</p>
        )}
        {!installed && <p className="padreInstallNote">You can keep using this website without installing it.</p>}
        <button className="padreButton padreButtonPrimary" type="button" onClick={() => setHelpOpen(false)}>Continue on website</button>
      </section>
    </div>
  );
}
