"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton({ variant = "button" }: { variant?: "button" | "card" | "header" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    
    if (isIOSDevice && !isInStandaloneMode) {
      // Check if user has dismissed the prompt before
      const hasSeenIOSPrompt = localStorage.getItem("ios_pwa_prompt_seen");
      if (!hasSeenIOSPrompt) {
        // Delay showing the prompt
        setTimeout(() => setShowIOSPrompt(true), 5000);
      }
      setIsInstallable(true);
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }
    
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("Error installing PWA:", error);
    }
  };

  const dismissIOSPrompt = () => {
    localStorage.setItem("ios_pwa_prompt_seen", "true");
    setShowIOSPrompt(false);
  };

  // Don't show if already installed
  if (isInstalled) {
    if (variant === "card") {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-left">
            <p className="font-bold text-emerald-500 text-sm">App Installed</p>
            <p className="text-xs text-muted-foreground">MrCash is ready to use</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Don't show if not installable (on desktop/unsupported browsers)
  if (!isInstallable) return null;

  // Header variant - compact button
  if (variant === "header") {
    return (
      <>
        <Button
          onClick={handleInstallClick}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground"
          title="Install App"
        >
          <Download className="w-4 h-4" />
        </Button>
        
        {/* iOS Install Modal */}
        {showIOSPrompt && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">Install MrCash</h3>
                    <button onClick={dismissIOSPrompt} className="text-muted-foreground hover:text-foreground p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add to your home screen for the best experience
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">1</span>
                  <span>{"Tap the Share button in your browser"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</span>
                  <span>{"Scroll and tap \"Add to Home Screen\""}</span>
                </div>
              </div>
              <Button
                onClick={dismissIOSPrompt}
                className="w-full mt-4 h-11 rounded-xl brand-gradient text-white font-medium"
              >
                Got it
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Card variant for sidebar/profile
  if (variant === "card") {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:bg-secondary/80 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-foreground text-sm">Install App</p>
            <p className="text-xs text-muted-foreground">Add MrCash to your device</p>
          </div>
        </button>
        
        {/* iOS Install Modal */}
        {showIOSPrompt && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">Install MrCash</h3>
                    <button onClick={dismissIOSPrompt} className="text-muted-foreground hover:text-foreground p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add to your home screen for the best experience
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">1</span>
                  <span>{"Tap the Share button in your browser"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</span>
                  <span>{"Scroll and tap \"Add to Home Screen\""}</span>
                </div>
              </div>
              <Button
                onClick={dismissIOSPrompt}
                className="w-full mt-4 h-11 rounded-xl brand-gradient text-white font-medium"
              >
                Got it
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Default button variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl brand-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-lg glow-primary"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
      
      {/* iOS Install Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Install MrCash</h3>
                  <button onClick={dismissIOSPrompt} className="text-muted-foreground hover:text-foreground p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Add to your home screen for the best experience
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">1</span>
                <span>{"Tap the Share button in your browser"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</span>
                <span>{"Scroll and tap \"Add to Home Screen\""}</span>
              </div>
            </div>
            <Button
              onClick={dismissIOSPrompt}
              className="w-full mt-4 h-11 rounded-xl brand-gradient text-white font-medium"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
