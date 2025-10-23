import { useEffect, useState, useRef } from "react";

interface SpriteAnimationProps {
  spriteSheetImage: string;
  frameWidth: number;
  frameHeight: number;
  fps?: number;
  totalFrames?: number;
  rows?: number;
  cols?: number;
  delay?: number;
  onClick?: () => void;
  classes?: string;
  thumbnail?: boolean;
  enableLazyLoading?: boolean;
}

// Simple global cache to prevent duplicate downloads
const imageCache = new Map<string, HTMLImageElement>();

// Preloading queue management
class SpritePreloader {
  private loadingQueue: Array<{ url: string; priority: 'high' | 'medium' | 'low' }> = [];
  private isProcessing = false;
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  async preload(spriteSheetImage: string, priority: 'high' | 'medium' | 'low' = 'medium') {
    const url = `https://d1mr0h2b9az9mp.cloudfront.net/${spriteSheetImage}`;

    // Return existing promise if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Return cached image if available
    if (imageCache.has(url)) {
      return Promise.resolve(imageCache.get(url)!);
    }

    // Add to queue
    this.loadingQueue.push({ url, priority });
    this.processQueue();

    // Create and store promise
    const promise = this.loadImage(url);
    this.loadingPromises.set(url, promise);

    return promise;
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Sort by priority: high -> medium -> low
    this.loadingQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process in batches to avoid overwhelming browser
    while (this.loadingQueue.length > 0) {
      const batch = this.loadingQueue.splice(0, 3); // Max 3 concurrent
      await Promise.allSettled(
        batch.map(({ url }) => this.loadingPromises.get(url))
      );

      // Small delay between batches
      if (this.loadingQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessing = false;
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        imageCache.set(url, image);
        this.loadingPromises.delete(url);
        resolve(image);
      };
      image.onerror = () => {
        this.loadingPromises.delete(url);
        reject(new Error(`Failed to load: ${url}`));
      };
      image.src = url;
    });
  }

  preloadVisible(gameIds: string[]) {
    gameIds.forEach(id =>
      this.preload(`game_thumbnail_sprites/${id}.png`, 'high')
    );
  }

  preloadUpcoming(gameIds: string[]) {
    setTimeout(() => {
      gameIds.forEach(id =>
        this.preload(`game_thumbnail_sprites/${id}.png`, 'medium')
      );
    }, 1000);
  }

  preloadBackground(gameIds: string[]) {
    setTimeout(() => {
      gameIds.forEach(id =>
        this.preload(`game_thumbnail_sprites/${id}.png`, 'low')
      );
    }, 3000);
  }
}

const spritePreloader = new SpritePreloader();

export function SpriteAnimation({
  spriteSheetImage,
  frameWidth,
  frameHeight,
  fps = 20,
  totalFrames = 50,
  rows = 6,
  cols = 9,
  delay = 0,
  onClick,
  classes,
  children,
  thumbnail = false,
  enableLazyLoading = false
}: SpriteAnimationProps & { children?: React.ReactNode }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!enableLazyLoading);

  const containerRef = useRef<HTMLDivElement>(null);

  const TOTAL_FRAMES = totalFrames;
  const ROWS = rows;
  const COLS = cols;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading || !containerRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0.1
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [enableLazyLoading]);

  // Smart image loading with preloader
  useEffect(() => {
    if (!isInView) return;

    const imageUrl = `https://d1mr0h2b9az9mp.cloudfront.net/${spriteSheetImage}`;

    // Check cache first
    if (imageCache.has(imageUrl)) {
      setIsImageLoaded(true);
      return;
    }

    // Use preloader for intelligent loading
    spritePreloader.preload(spriteSheetImage, 'high')
      .then(() => setIsImageLoaded(true))
      .catch(error => {
        console.error(`Failed to load sprite: ${spriteSheetImage}`, error);
      });
  }, [isInView, spriteSheetImage]);

  useEffect(() => {
    if (!isImageLoaded) return;

    let intervalId: NodeJS.Timeout;

    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev + 1 === TOTAL_FRAMES) {
            setIsPlaying(false);
            return prev;
          }
          return (prev + 1) % TOTAL_FRAMES;
        });
      }, 1000 / fps);
    } else {
      intervalId = setTimeout(() => {
        setCurrentFrame(0); // Reset to the first frame
        setIsPlaying(true); // Restart animation
      }, delay);
    }

    return () => clearInterval(intervalId);
  }, [fps, TOTAL_FRAMES, isPlaying, delay, isImageLoaded]);

  const row = Math.floor(currentFrame / COLS);
  const col = currentFrame % COLS;

  const spriteSheet = require(`../../assets/${spriteSheetImage}`);

  return (
    <div
      ref={containerRef}
      className={`relative ${onClick ? "cursor-pointer" : ""} ${classes}`}
      onClick={() => {
        if (onClick) onClick();
      }}
      style={{
        width: frameWidth,
        height: frameHeight,
        position: "relative",
      }}
    >
      {/* Local thumbnail - shows immediately */}
      {thumbnail && (
        <img
          src={spriteSheet}
          alt="Sprite Animation Thumbnail"
          style={{
            width: frameWidth,
            height: frameHeight,
            position: isImageLoaded ? "absolute" : "relative",
            transform: "translate(8px, 8px)",
            zIndex: isImageLoaded ? -1 : 1,
            opacity: isImageLoaded ? 0 : 1,
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* CDN sprite sheet - only loads when in view */}
      {isInView && isImageLoaded && (
        <div
          style={{
            width: frameWidth,
            height: frameHeight,
            backgroundImage: `url(https://d1mr0h2b9az9mp.cloudfront.net/${spriteSheetImage})`,
            backgroundPosition: `-${col * frameWidth}px -${row * frameHeight}px`,
            backgroundSize: `${frameWidth * COLS}px ${frameHeight * ROWS}px`,
            imageRendering: "pixelated",
            position: "relative",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Export preloader for use in other components
export { spritePreloader };