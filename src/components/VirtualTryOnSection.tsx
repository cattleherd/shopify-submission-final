import { useState, useEffect, useCallback } from 'react';
import {
  Product,
  useProductSearch,
  useErrorToast,
  Button,
} from '@shopify/shop-minis-react';

// Access API key from environment variables using Vite's import.meta.env
// REMINDER: STILL INSECURE FOR PRODUCTION IF CLIENT-SIDE ONLY!
// FOR PRODUCTION: ALWAYS proxy this request through a secure backend server/serverless function.
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface VirtualTryOnSectionProps {
  onBackToProducts: () => void;
}

// Default model image (self-hosted to avoid CORS issues)
// This image is now only for visual context in the UI, not API input.
const DEFAULT_BODY_IMAGE_URL = '/confident-woman.jpg'; // Ensure this path is correct for your project

/* ------------------------------------------------------------------ */
/* component                                                           */
/* ------------------------------------------------------------------ */
export default function VirtualTryOnSection({
}: VirtualTryOnSectionProps): JSX.Element {
  const [originalBodyImage] = useState<string>(DEFAULT_BODY_IMAGE_URL);
  const [selectedSweater, setSelectedSweater] = useState<Product | null>(null);
  const [generatedOutfitImage, setGeneratedOutfitImage] = useState<
    string | null
  >(null);
  const [isGeneratingOutfit, setIsGeneratingOutfit] = useState(false);
  // New state to provide specific feedback on why a sweater wasn't selected
  const [noSuitableSweaterReason, setNoSuitableSweaterReason] = useState<string | null>(null);

  const { showErrorToast } = useErrorToast();

 

  // Directly use 'sweater' as the query string
  const {
    products: sweaterSearchResults,
    loading: sweaterSearchLoading,
    error: sweaterSearchError // Capture potential search errors
  } = useProductSearch({ query: 'sweater' });

  /* ----------------------------------------- */
  /* product auto-select                        */
  /* ----------------------------------------- */
  useEffect(() => {
    // Reset states when search results change
    setSelectedSweater(null);
    setNoSuitableSweaterReason(null);

    if (sweaterSearchError) {
      console.error('VirtualTryOn: Product search error:', sweaterSearchError); // DEBUG LOG
      showErrorToast({ message: `Product search error: ${sweaterSearchError.message}.` });
      setNoSuitableSweaterReason(`Error fetching products: ${sweaterSearchError.message}`);
      return;
    }

    if (sweaterSearchResults && sweaterSearchResults.length > 0) {
      console.log('VirtualTryOn: Raw sweater search results:', sweaterSearchResults); // DEBUG LOG

      // Filter out products with titles that might mislead DALL·E
      const filteredSweaters = sweaterSearchResults.filter(product => {
        const titleLower = product.title.toLowerCase();
        const isExcluded =
          titleLower.includes('funko') ||
          titleLower.includes('pop') ||
          titleLower.includes('figurine') ||
          titleLower.includes('cartoon') ||
          titleLower.includes('toy') ||
          titleLower.includes('graphic');
        return !isExcluded;
      });

      console.log('VirtualTryOn: Filtered sweaters:', filteredSweaters); // DEBUG LOG

      if (filteredSweaters.length > 0) {
        setSelectedSweater(filteredSweaters[0]);
        console.log('VirtualTryOn: Selected sweater:', filteredSweaters[0].title); // DEBUG LOG
      } else {
        // No suitable sweaters after filtering
        setNoSuitableSweaterReason(
          'No suitable sweaters found after filtering out items like "funko", "toy", or "graphic" from titles.'
        );
        showErrorToast({ message: 'No suitable sweater found in search results after filtering.' });
      }
    } else if (!sweaterSearchLoading && !sweaterSearchError) {
      // If no results, not loading, and no error, means genuinely no products for "sweater"
      setNoSuitableSweaterReason('No sweater products found for the search query "sweater".');
    }
  }, [sweaterSearchResults, sweaterSearchLoading, sweaterSearchError, showErrorToast]);

  /* ----------------------------------------- */
  /* generation with DALL·E 3 (text-to-image)   */
  /* ----------------------------------------- */
  const generateOutfit = async () => {
    if (!selectedSweater) {
      showErrorToast({ message: 'Cannot generate outfit: No sweater selected or available.' });
      console.error('VirtualTryOn: Generation prevented: No sweater selected.'); // DEBUG LOG
      return;
    }
    if (!OPENAI_API_KEY) {
      showErrorToast({
        message: 'VITE_OPENAI_API_KEY missing from environment. Check your .env file.',
      });
      console.error('VirtualTryOn: Generation prevented: OPENAI_API_KEY missing.'); // DEBUG LOG
      return;
    }

    try {
      setIsGeneratingOutfit(true);
      setGeneratedOutfitImage(null);

      // Craft prompt for DALL·E 3 image generation
      // This prompt is engineered to ensure a realistic human, even if the sweater title is quirky.
      const prompt = `A photorealistic image of a woman brunette fair skin with her arms crossed wearing a stylish ${selectedSweater.title}. The person should be an adult, not a child, and clearly not a cartoon, figurine, or toy. The person should be shown from the waist up or full body. The background should be clean, modern, and minimalist, like a studio setting, with soft, natural lighting.`;
      console.log('VirtualTryOn: DALL-E prompt:', prompt); // DEBUG LOG

      const resp = await fetch(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard', 
            style: 'vivid',      
          }),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error?.message || `OpenAI API error: ${resp.status}`);
      }

      setGeneratedOutfitImage(data.data[0].url);
      showErrorToast({ message: 'Outfit generated successfully!' });
    } catch (err: any) {
      console.error('VirtualTryOn: Image generation failed:', err);
      showErrorToast({ message: err.message || 'Image generation failed.' });
    } finally {
      setIsGeneratingOutfit(false);
    }
  };

  // Derived state for the button's disabled status, making it clear why it might be disabled
  const isGenerateButtonDisabled = isGeneratingOutfit || !selectedSweater || !OPENAI_API_KEY;

  /* ----------------------------------------- */
  /* UI                                         */
  /* ----------------------------------------- */
  return (
    <div className="flex flex-col items-center justify-center w-full h-full
                 bg-white/20 backdrop-blur-lg ring-1 ring-white/10
                 rounded-xl shadow-xl p-8
                 max-w-5xl mx-auto my-auto overflow-auto relative">
      {/* Button to go back to the products carousel */}
    

      {/* Updated Main Heading */}
      {/* MAIN HEADING */}
      <h2
  className="
    text-4xl sm:text-5xl lg:text-6xl
    font-extrabold tracking-tight
    text-transparent bg-clip-text
    bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-300
    drop-shadow-lg
    mt-8 sm:mt-20 mb-6 text-center
  "
>
  Your&<br />Shopify Wrapped<br />Fashion Reveal!
</h2>

<p
  className="
    text-4xl sm:text-5xl lg:text-6xl
    font-extrabold tracking-tight
    text-transparent bg-clip-text
    bg-cyan-100 
    drop-shadow-lg
    mt-10 sm:mt-20 mb-12 text-center
  "
>
  We guessed your favorite item this year&mdash;here’s an inspired look for your&nbsp;Shopify Wrapped theme!
</p>

<div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full justify-items-center items-start">

  {/* 1 · MODEL PHOTO */}
  <div className="flex flex-col items-center p-6
                  bg-white/15 dark:bg-slate-900/25 backdrop-blur-md
                  ring-1 ring-white/10 rounded-2xl shadow-lg
                  transition hover:scale-[1.02] hover:ring-white/20
                  w-full max-w-sm">
    <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
      1&nbsp;·&nbsp;Your Style Muse
    </h3>

    <img
      src={originalBodyImage}
      alt="Original Full Body"
      className="max-w-full h-auto rounded-lg mb-4 object-contain max-h-[300px]"
    />

    <p className="text-sm text-slate-700 dark:text-slate-300 text-center leading-relaxed">
      This image is for visual context; we’ll generate a new look below.
    </p>
  </div>

  {/* 2 · SELECTED SWEATER */}
  <div className="flex flex-col items-center p-6
                  bg-white/15 dark:bg-slate-900/25 backdrop-blur-md
                  ring-1 ring-white/10 rounded-2xl shadow-lg
                  transition hover:scale-[1.02] hover:ring-white/20
                  w-full max-w-sm">

    <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
      2&nbsp;·&nbsp;Your Top Item
    </h3>

    {sweaterSearchLoading ? (
      <p className="text-sm text-blue-500">Unwrapping product insights…</p>
    ) : selectedSweater ? (
      <div className="flex items-center gap-3 p-3 bg-white/40 dark:bg-slate-800/40
                      rounded-lg ring-1 ring-white/10">
        <img
          src={selectedSweater.featuredImage?.url ?? 'https://via.placeholder.com/60'}
          alt={selectedSweater.title}
          className="w-14 h-14 object-cover rounded-md"
        />
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {selectedSweater.title}
        </span>
      </div>
    ) : (
      <p className="text-sm text-red-500 text-center leading-relaxed">
        {noSuitableSweaterReason || 'No suitable top item found.'}
      </p>
    )}
  </div>

  {/* 3 · GENERATED LOOK */}
  <div className="flex flex-col items-center p-6
                  bg-white/15 dark:bg-slate-900/25 backdrop-blur-md
                  ring-1 ring-white/10 rounded-2xl shadow-lg
                  transition hover:scale-[1.02] hover:ring-white/20
                  w-full max-w-sm">
    <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
      3&nbsp;·&nbsp;Your Wrapped Look
    </h3>

    {isGeneratingOutfit ? (
      <div className="w-48 h-48 bg-gray-200/40 dark:bg-slate-700/40
                      rounded-lg flex flex-col items-center justify-center text-slate-600 mb-4">
        <svg
          className="animate-spin h-10 w-10 text-cyan-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-2 text-sm">Unwrapping your style…</p>
      </div>
    ) : generatedOutfitImage ? (
      <img
        src={generatedOutfitImage}
        alt="Generated Outfit"
        className="max-w-full h-auto rounded-lg mb-4 object-contain max-h-[300px]"
      />
    ) : (
      <div className="w-48 h-48 bg-gray-200/40 dark:bg-slate-700/40
                      rounded-lg flex items-center justify-center text-slate-600 mb-4 text-center">
        Your generated look will appear&nbsp;here!
      </div>
    )}

    <Button
      onClick={generateOutfit}
      variant="primary"
      disabled={isGenerateButtonDisabled}
    >
      ✨ Reveal My Wrapped Look!
    </Button>
  </div>

</div> 
    </div>
  );
}