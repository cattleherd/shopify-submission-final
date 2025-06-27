// App.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  usePopularProducts,
  Product,
  Button
} from '@shopify/shop-minis-react';

import PopularProductsWrapped from './components/PopularProductsWrapped';
import LusionBackground from './components/LusionBackground';
import VirtualTryOnSection from './components/VirtualTryOnSection'; // Make sure this component exists

/* ———————————————————————————————————————————————— */
/* constants                                                           */
/* ———————————————————————————————————————————————— */
const ACCENTS = ['#4060ff', '#20ffa0', '#ff4060', '#ffcc00'];

const INTRO_SLIDE_DURATION = 4000; // Duration for the intro slide
const TEXT_PHASE_MS = 3000;
const PRODUCT_PHASE_MS = 5000;
const PRODUCT_CYCLE_TOTAL_MS = TEXT_PHASE_MS + PRODUCT_PHASE_MS + 500; // buffer for product slides

/* ———————————————————————————————————————————————— */
/* component                                                            */
/* ———————————————————————————————————————————————— */
export default function App(): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // Fetch up to 12 products
  const { products, loading, error } = usePopularProducts({ first: 12 });
  const autoRef = useRef<NodeJS.Timeout | null>(null);

  // New state to control whether the Virtual Try-On section is active
  const [showVirtualTryOn, setShowVirtualTryOn] = useState<boolean>(false);

  // *** DEBUGGING: Log current showVirtualTryOn state ***
  useEffect(() => {
    console.log('Current showVirtualTryOn state:', showVirtualTryOn);
  }, [showVirtualTryOn]);


  /* ------------------------------------------------------------------ */
  /* derived state                                                      */
  /* ------------------------------------------------------------------ */
  const actualProductCount = products?.length ?? 0;

  // Total conceptual slides for the carousel:
  // 1 (Intro) + actualProductCount (products) + 1 (Final "That's a wrap!")
  const effectiveTotalCarouselSlides = actualProductCount > 0 ? actualProductCount + 2 : 0;

  // Each conceptual slide gets its own step in the color cycle.
  const accentColor = ACCENTS[currentIndex % ACCENTS.length];

  // Determine if the LusionScene should pulse. This will be passed as a 'pulse' numeric value.
  const shouldPulse =
    !loading &&
    !error &&
    actualProductCount > 0 &&
    (currentIndex === 0 || // Intro slide (index 0)
     currentIndex === 1 || // First product slide (index 1, corresponds to product 0)
     currentIndex === actualProductCount || // Last actual product slide (index = actualProductCount, corresponds to product actualProductCount-1)
     currentIndex === effectiveTotalCarouselSlides - 1); // The very last conceptual slide ('That's a wrap!')

  /* ------------------------------------------------------------------ */
  /* navigation handlers                                                */
  /* ------------------------------------------------------------------ */
  const next = useCallback(() => {
    if (autoRef.current) clearTimeout(autoRef.current); // Clear any auto-advance timer

    if (effectiveTotalCarouselSlides > 0) {
      setCurrentIndex((prevIndex) => {
        // *** DEBUGGING: Log carousel progression ***
        console.log('Carousel Logic: prevIndex =', prevIndex, 'effectiveTotalCarouselSlides =', effectiveTotalCarouselSlides);

        // Check if we are moving past the very last carousel slide ("That's a wrap!").
        if (prevIndex + 1 >= effectiveTotalCarouselSlides) {
          // *** DEBUGGING: Log when Virtual Try-On is triggered ***
          console.log('Carousel finished cycling. Triggering Virtual Try-On.');
          setShowVirtualTryOn(true); // Transition to the Virtual Try-On mode
          return prevIndex; // Keep the index on the last slide, as carousel is now "done"
                            // (or you could reset to 0 here if you want carousel to restart from intro next time it's visible)
        }
        return prevIndex + 1; // Otherwise, just move to the next slide in the carousel
      });
    } else {
        // *** DEBUGGING: Log if no slides are available ***
        console.log('No effective carousel slides to advance.');
    }
  }, [effectiveTotalCarouselSlides]);

  const prev = useCallback(() => {
    if (autoRef.current) clearTimeout(autoRef.current); // Clear any auto-advance timer
    if (effectiveTotalCarouselSlides > 0) {
      setCurrentIndex((i) => (i - 1 + effectiveTotalCarouselSlides) % effectiveTotalCarouselSlides);
    }
  }, [effectiveTotalCarouselSlides]);

  // Handler to go back from Virtual Try-On to the carousel
  const handleBackToProducts = useCallback(() => {
    setShowVirtualTryOn(false); // Hide the Virtual Try-On section
    setCurrentIndex(0); // Reset the carousel to its intro slide
  }, []);

  /* ------------------------------------------------------------------ */
  /* auto-advance logic                                                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    // If the Virtual Try-On section is currently being shown, stop the carousel's auto-advance.
    if (showVirtualTryOn) {
      if (autoRef.current) clearTimeout(autoRef.current);
      console.log('Virtual Try-On is active, stopping carousel auto-advance.'); // DEBUGGING
      return;
    }

    // Only auto-advance if products are loaded and there are slides in the carousel.
    if (loading || error || actualProductCount === 0) {
      setCurrentIndex(0); // Reset to intro if no products or error
      console.log('Carousel: Products not loaded/error, or no products. Resetting index to 0.'); // DEBUGGING
      return;
    }

    // Determine the delay for the current slide.
    let delay = PRODUCT_CYCLE_TOTAL_MS;
    if (currentIndex === 0) {
      delay = INTRO_SLIDE_DURATION;
    }

    // Clear any existing timer to prevent multiple timers running.
    if (autoRef.current) clearTimeout(autoRef.current);

    // Set a new timer to call the `next` function after the calculated delay.
    // The `next` function now handles the transition to the Virtual Try-On if it's the last slide.
    console.log(`Carousel: Setting auto-advance timer for ${delay}ms from index ${currentIndex}.`); // DEBUGGING
    autoRef.current = setTimeout(next, delay);

    // Cleanup function: This runs when the component unmounts or when the dependencies change.
    // It's crucial to clear the timer to prevent memory leaks and unexpected behavior.
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
      console.log('Carousel: Clearing auto-advance timer.'); // DEBUGGING
    };
  }, [currentIndex, actualProductCount, effectiveTotalCarouselSlides, loading, error, next, showVirtualTryOn]);

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    // The main container provides relative positioning context and fills screen height
    <div className="relative w-full min-h-screen overflow-hidden">
      {/*
        3-D background layer:
        LusionBackground now handles its own fixed positioning and z-index internally (-z-10).
        Crucially, we pass shouldPulse and accentColor here.
        The `index` prop is passed down but is not directly used for color/pulse logic within LusionBackground,
        as color and pulse values are already derived and passed as direct props based on `currentIndex`.
        `roughness` is an assumed default value required by LusionBackground's interface.
      */}
      <div className="absolute inset-0 z-0">
        <LusionBackground
        index={currentIndex}
        shouldPulse={shouldPulse}
        accentColor={accentColor} // Pass accentColor to the background wrapper
      />
      </div>
      {/*
        Foreground content: Conditionally render carousel or Virtual Try-On
      */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
        {/* Toggle Button for Virtual Try-On (always visible for manual switch) */}
        <Button
          onClick={() => setShowVirtualTryOn(!showVirtualTryOn)}
          variant="primary"
          className="absolute top-4 right-4 z-20" // Ensure this button is always on top
        >
          {showVirtualTryOn ? 'Back to Products' : 'Virtual Try-On'}
        </Button>

        {showVirtualTryOn ? (
          // Render the test h1 when showVirtualTryOn is true
          <div className="text-white text-4xl"><h1>hello</h1></div> // Added some basic styling to make it visible
        ) : (
          // Otherwise, render the Popular Products Carousel
          <PopularProductsWrapped
            products={products as Product[] | undefined}
            loading={loading}
            error={error}
            currentIndex={currentIndex}
            onNext={next}
            onPrev={prev}
            accentColor={accentColor}
            // PopularProductsWrapped calculates TOTAL_SLIDES internally, so no new prop needed here.
          />
        )}
      </div>
    </div>
  );
}