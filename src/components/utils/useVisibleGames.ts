import { useEffect, useState, useCallback, useRef } from 'react';

interface VisibleGameEntry {
  gameSlug: string;
  isVisible: boolean;
  element: Element;
}

/**
 * Hook to track which games are currently visible in the viewport
 * Uses Intersection Observer for efficient visibility detection
 */
export function useVisibleGames() {
  const [visibleGames, setVisibleGames] = useState<Set<string>>(new Set());
  const [allTrackedGames, setAllTrackedGames] = useState<Map<string, VisibleGameEntry>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Initialize Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const updates = new Map<string, boolean>();
        
        entries.forEach((entry) => {
          const gameSlug = entry.target.getAttribute('data-game-slug');
          if (gameSlug) {
            updates.set(gameSlug, entry.isIntersecting);
          }
        });

        // Update visibility state
        setVisibleGames(prev => {
          const newVisible = new Set(prev);
          updates.forEach((isVisible, gameSlug) => {
            if (isVisible) {
              newVisible.add(gameSlug);
            } else {
              newVisible.delete(gameSlug);
            }
          });
          return newVisible;
        });

        // Update tracked games
        setAllTrackedGames(prev => {
          const newTracked = new Map(prev);
          updates.forEach((isVisible, gameSlug) => {
            const existing = newTracked.get(gameSlug);
            if (existing) {
              newTracked.set(gameSlug, { ...existing, isVisible });
            }
          });
          return newTracked;
        });
      },
      {
        // Start observing when element is 100px away from viewport
        rootMargin: '100px',
        // Trigger when any part of the element is visible
        threshold: 0.1
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Function to register a game element for visibility tracking
  const registerGame = useCallback((gameSlug: string, element: Element) => {
    if (!observerRef.current || !element) return;

    // Add data attribute for identification
    element.setAttribute('data-game-slug', gameSlug);
    
    // Start observing
    observerRef.current.observe(element);
    
    // Track the game
    setAllTrackedGames(prev => new Map(prev).set(gameSlug, {
      gameSlug,
      isVisible: false,
      element
    }));
  }, []);

  // Function to unregister a game element
  const unregisterGame = useCallback((gameSlug: string) => {
    if (!observerRef.current) return;

    const tracked = allTrackedGames.get(gameSlug);
    if (tracked) {
      observerRef.current.unobserve(tracked.element);
      setAllTrackedGames(prev => {
        const newTracked = new Map(prev);
        newTracked.delete(gameSlug);
        return newTracked;
      });
      
      setVisibleGames(prev => {
        const newVisible = new Set(prev);
        newVisible.delete(gameSlug);
        return newVisible;
      });
    }
  }, [allTrackedGames]);

  // Get visibility status of a specific game
  const isGameVisible = useCallback((gameSlug: string) => {
    return visibleGames.has(gameSlug);
  }, [visibleGames]);

  // Get all visible game slugs as array
  const getVisibleGameSlugs = useCallback(() => {
    return Array.from(visibleGames);
  }, [visibleGames]);

  // Get games that are not visible (for background preloading)
  const getInvisibleGameSlugs = useCallback(() => {
    const allSlugs = Array.from(allTrackedGames.keys());
    return allSlugs.filter(slug => !visibleGames.has(slug));
  }, [allTrackedGames, visibleGames]);

  return {
    // State
    visibleGames: Array.from(visibleGames),
    visibleCount: visibleGames.size,
    totalTracked: allTrackedGames.size,
    
    // Actions
    registerGame,
    unregisterGame,
    
    // Queries
    isGameVisible,
    getVisibleGameSlugs,
    getInvisibleGameSlugs,
  };
}

/**
 * Hook for individual game components to register themselves for visibility tracking
 */
export function useGameVisibility(gameSlug: string) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === elementRef.current) {
            setIsVisible(entry.isIntersecting);
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(elementRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    elementRef,
    isVisible
  };
}

/**
 * Hook that combines visibility tracking with intelligent preloading
 */
export function useVisibilityBasedPreloading() {
  const { visibleGames, getVisibleGameSlugs, getInvisibleGameSlugs } = useVisibleGames();
  
  // This will be used by the intelligent preloader
  const getPreloadingStrategy = useCallback(() => {
    const visible = getVisibleGameSlugs();
    const invisible = getInvisibleGameSlugs();
    
    return {
      highPriority: visible, // Currently visible games
      mediumPriority: invisible.slice(0, 12), // Next 12 games
      lowPriority: invisible.slice(12), // Remaining games
    };
  }, [getVisibleGameSlugs, getInvisibleGameSlugs]);

  return {
    visibleGames,
    getPreloadingStrategy,
  };
}
