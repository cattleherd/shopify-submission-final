// App.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  usePopularProducts,
  Product,
  Button
} from '@shopify/shop-minis-react';

import PopularProductsWrapped from './components/PopularProductsWrapped';
import LusionBackground from './components/LusionBackground';
import VirtualTryOnSection from './components/VirtualTryOnSection';

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
  // FIX: Change 'first: 12' to 'first: 4' to limit to 4 products for 4 seasons.
  const { products, loading, error } = usePopularProducts({ first: 4 }); 
  const autoRef = useRef<NodeJS.Timeout | null>(null);

  const [showVirtualTryOn, setShowVirtualTryOn] = useState<boolean>(false);

  useEffect(() => {
    console.log('App State: showVirtualTryOn changed to:', showVirtualTryOn);
    if (showVirtualTryOn) {
      console.log('App: Virtual Try-On is now active. Carousel should be hidden.');
    }
  }, [showVirtualTryOn]);


  /* ------------------------------------------------------------------ */
  /* derived state                                                      */
  /* ------------------------------------------------------------------ */
  const actualProductCount = products?.length ?? 0;

  // Total conceptual slides for the carousel:
  // 1 (Intro) + actualProductCount (products) + 1 (Final "That's a wrap!")
  // With `first: 4`, actualProductCount will be 4, so this becomes 1 + 4 + 1 = 6.
  const effectiveTotalCarouselSlides = actualProductCount > 0 ? actualProductCount + 2 : 0;
  console.log(`App Render: currentIndex=${currentIndex}, actualProductCount=${actualProductCount}, effectiveTotalCarouselSlides=${effectiveTotalCarouselSlides}, showVirtualTryOn=${showVirtualTryOn}`);


  const accentColor = ACCENTS[currentIndex % ACCENTS.length];

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
    if (autoRef.current) clearTimeout(autoRef.current);
    console.log('App Next: Attempting to advance.');


    if (effectiveTotalCarouselSlides > 0) {
      setCurrentIndex((prevIndex) => {
        console.log(`App Next: Inside setCurrentIndex. prevIndex=${prevIndex}, effectiveTotalCarouselSlides=${effectiveTotalCarouselSlides}`);

        // If we are about to go past the last conceptual slide (index 5)
        if (prevIndex + 1 >= effectiveTotalCarouselSlides) {
          console.log('App Next: Reached end of carousel. Triggering Virtual Try-On.');
          setShowVirtualTryOn(true);
          // Crucially, stay on the last slide (index 5) when VTO is triggered.
          // This ensures the carousel doesn't try to render an out-of-bounds index.
          return prevIndex; 
        }
        console.log('App Next: Advancing to next slide:', prevIndex + 1);
        return prevIndex + 1;
      });
    } else {
        console.log('App Carousel Logic: No effective carousel slides to advance in next().');
    }
  }, [effectiveTotalCarouselSlides]);

  const prev = useCallback(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    if (effectiveTotalCarouselSlides > 0) {
      setCurrentIndex((i) => (i - 1 + effectiveTotalCarouselSlides) % effectiveTotalCarouselSlides);
    }
  }, [effectiveTotalCarouselSlides]);

  const handleBackToProducts = useCallback(() => {
    console.log('App: "Back to Products" action triggered. Transitioning back to carousel & resetting index to 0.');
    setShowVirtualTryOn(false);
    setCurrentIndex(0);
  }, []);

  /* ------------------------------------------------------------------ */
  /* auto-advance logic                                                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (showVirtualTryOn) {
      if (autoRef.current) clearTimeout(autoRef.current);
      console.log('App Carousel Auto: Virtual Try-On is active, stopping carousel auto-advance.');
      return;
    }

    if (loading || error || actualProductCount === 0) {
      setCurrentIndex(0);
      console.log('App Carousel Auto: Products not loaded/error, or no products. Resetting index to 0.');
      return;
    }

    // REMOVED THE FOLLOWING BLOCK:
    // This previously stopped auto-advance on the last slide, preventing 'next' from being called to trigger VTO.
    /*
    if (currentIndex === effectiveTotalCarouselSlides - 1) {
      if (autoRef.current) clearTimeout(autoRef.current);
      console.log('App Carousel: Reached final slide, stopping auto-advance for now.');
      return;
    }
    */

    let delay = PRODUCT_CYCLE_TOTAL_MS;
    if (currentIndex === 0) {
      delay = INTRO_SLIDE_DURATION;
    }

    if (autoRef.current) clearTimeout(autoRef.current);

    console.log(`App Carousel Auto: Setting auto-advance timer for ${delay}ms from index ${currentIndex}.`);
    autoRef.current = setTimeout(next, delay);

    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
      console.log('App Carousel Auto: Clearing auto-advance timer on cleanup.');
    };
  }, [currentIndex, actualProductCount, effectiveTotalCarouselSlides, loading, error, next, showVirtualTryOn]);

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <LusionBackground
          index={currentIndex}
          shouldPulse={shouldPulse}
          accentColor={accentColor}
        />
      </div>
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">

        {showVirtualTryOn ? (
          // Ensure onBackToProducts is passed, as per previous discussion
          <VirtualTryOnSection onBackToProducts={handleBackToProducts} />
        ) : (
          <PopularProductsWrapped
            products={products as Product[] | undefined}
            loading={loading}
            error={error}
            currentIndex={currentIndex}
            onNext={next}
            onPrev={prev}
            accentColor={accentColor}
          />
        )}
      </div>
    </div>
  );
}