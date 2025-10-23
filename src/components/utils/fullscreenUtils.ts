declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        platform: string;
        initData: string;
        // Add other WebApp properties you might need
      }
    }
  }
}

export const enterFullScreen = (element: HTMLElement | null) => {
  if (!element) return;
  const requestFullscreen =
    element.requestFullscreen ||
    (element as any).webkitRequestFullscreen || 
    (element as any).mozRequestFullScreen ||
    (element as any).msRequestFullscreen; 
  if (requestFullscreen) {
    requestFullscreen.call(element).catch((err: any) =>
      console.error("Error attempting to enable fullscreen mode:", err)
    );
  } else {
    const gameContainer = document.getElementById('unity-container');
    if (gameContainer) {
      gameContainer.style.height = `${window.innerHeight}px`;
    }
    console.warn("Fullscreen API is not supported in this browser.");
  }
};

export const lockOrientation = (
  orientation: "landscape-primary" | "portrait-primary"
) => {
  const screenOrientation =
    window.screen.orientation ||
    (window.screen as any).mozOrientation ||
    (window.screen as any).msOrientation;

  if (screenOrientation && 'lock' in screenOrientation) {
    (screenOrientation as any)
      .lock(orientation)
      .catch((err: any) =>
        console.error("Error locking orientation:", err.message)
      );
  } else {
    console.warn("Screen orientation lock is not supported.");
  }
};
export const isMobileDevice = (): boolean => {
  const userAgent =
    typeof window.navigator === "undefined" ? "" : window.navigator.userAgent;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(userAgent);
};

export const isIOS=():boolean=> {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}
export const isFullScreen = () => {
  return !!document.fullscreenElement || 
         !!(document as any).webkitFullscreenElement ||
         !!(document as any).msFullscreenElement;
};

export const detectDeviceType = () => {
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return "mobile";
  }
  return "desktop";
};

export const detectPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  const isIOS = /iphone|ipad|ipod|macintosh/.test(userAgent) && navigator.maxTouchPoints > 1;

  if (isIOS) return "ios";
  if (/android/.test(userAgent)) return "android";
  
  return "unknown";
};



export const detectTelegramBrowser = () => {
  if (typeof window === 'undefined' || !navigator) {
    return null;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const currentUrl = window.location.href.toLowerCase();

  // Check for Telegram WebApp (when opened inside Telegram app)
  const isTelegramWebApp = Boolean(window.Telegram?.WebApp);
  
  // Check for Telegram Web (browser version) or WebK
  const isTelegramWeb = 
    userAgent.includes('telegram') || 
    currentUrl.includes('web.telegram.org') ||
    currentUrl.includes('t.me') ||
    userAgent.includes('webk');  // WebK is often used in Telegram's web view


  // If either condition is true, we're in some form of Telegram
  if (isTelegramWebApp || isTelegramWeb) {
    // If we have WebApp access, use its platform info
    if (isTelegramWebApp && window.Telegram?.WebApp?.platform) {
      const platform = window.Telegram.WebApp.platform;
      const isMobile = ['android', 'ios', 'android_x', 'ios_x'].includes(platform);
      return isMobile ? "telegram_mobile" : "telegram_desktop";
    }
    
    // Fallback to user agent detection
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
    return isMobile ? "telegram_mobile" : "telegram_desktop";
  }

  return null;
};

export const Mobile = (): boolean => {
  const userAgent =
    typeof window.navigator === "undefined" ? "" : window.navigator.userAgent;
  return /Android|iPhone|iPod|Opera Mini|IEMobile/i.test(userAgent);
};

export const isPortrait = window.matchMedia("(orientation: portrait)").matches;

