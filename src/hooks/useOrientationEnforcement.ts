import { useState, useEffect } from 'react';

interface UseOrientationEnforcementOptions {
  enableForMobile?: boolean;
  gameOrientation?: 'landscape-primary' | 'portrait-primary';
}

interface UseOrientationEnforcementReturn {
  isLandscape: boolean;
  isMobile: boolean;
  showRotationLockOverlay: boolean;
}

const useOrientationEnforcement = (
  options: UseOrientationEnforcementOptions = {}
): UseOrientationEnforcementReturn => {
  const { enableForMobile = true, gameOrientation } = options;

  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [IOS, setIOS] = useState(false);
  const [showRotationLockOverlay, setShowRotationLockOverlay] = useState(false);

  // Detect if the device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
      setIOS(IOS);
      setIsMobile(isMobileDevice);
    };

    checkIfMobile();
  }, []);

  // Detect orientation changes and show rotation lock overlay when needed
  useEffect(() => {
    // Only perform checkOrientation for iOS mobile devices
    if (!enableForMobile || !isMobile || !IOS) {
      setShowRotationLockOverlay(false);
      return;
    }

const checkOrientation = () => {
  const currentOrientation = screen.orientation?.type;
  // For reference: values can be 'landscape-primary', 'landscape-secondary', 'portrait-primary', 'portrait-secondary'
  setIsLandscape(currentOrientation?.startsWith('landscape') || false);

  if (gameOrientation === 'landscape-primary' && currentOrientation?.startsWith('portrait')) {
    setShowRotationLockOverlay(false);
  } else if (gameOrientation === 'portrait-primary' && currentOrientation?.startsWith('portrait')) {
    setShowRotationLockOverlay(false);
  } else {
    setShowRotationLockOverlay(true);
  }
};

    // Check initial orientation
    checkOrientation();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      // Use setTimeout to ensure the dimensions are updated after orientation change
      setTimeout(checkOrientation, 100);
    };

    const handleResize = () => {
      checkOrientation();
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile, IOS, enableForMobile, gameOrientation]);

  return {
    isLandscape,
    isMobile,
    showRotationLockOverlay
  };
};

export default useOrientationEnforcement;
