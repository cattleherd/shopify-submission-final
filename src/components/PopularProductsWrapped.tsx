// PopularProductsWrapped.tsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductCard, Product } from '@shopify/shop-minis-react'

interface Props {
  products?: Product[] | null
  loading: boolean
  error: Error | null
  currentIndex: number
  onNext: () => void
  onPrev: () => void
  accentColor: string 
}

export default function PopularProductsWrapped({
  products,
  loading,
  error,
  currentIndex,
  onNext,
  onPrev,
  accentColor,
}: Props) {
  /* ------------------------------------------------------------------ */
  /* Product list and slide counts                                       */
  /* ------------------------------------------------------------------ */
  const list: Product[] = products ?? []

  const conceptualProductSlides = list.length;
  const TOTAL_SLIDES = conceptualProductSlides > 0 ? conceptualProductSlides + 2 : 0;

  const isIntro = conceptualProductSlides > 0 && currentIndex === 0;
  const isFinal = conceptualProductSlides > 0 && currentIndex === conceptualProductSlides + 1;

  /* ------------------------------------------------------------------ */
  /* phase timer (text → product)                                        */
  /* ------------------------------------------------------------------ */
  const [phase, setPhase] = useState<'text' | 'product'>('text')
  const timer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    if (loading || error || list.length === 0 || isIntro || isFinal) {
      setPhase('text')
      return
    }

    setPhase('text')
    timer.current = setTimeout(() => setPhase('product'), 3000)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [currentIndex, loading, error, list.length, isIntro, isFinal])

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */
  const currentProduct = (!isIntro && !isFinal && list.length > 0) ? list[currentIndex - 1] : null;

  const seasonNames = [
    'Spring', 'Summer', 'Fall', 'Winter', 
    
  ]

  const month = (!isIntro && !isFinal && list.length > 0 && (currentIndex - 1) < seasonNames.length)
    ? seasonNames[currentIndex - 1]
    : '';


  const prev = () => { if (timer.current) clearTimeout(timer.current); setPhase('text'); onPrev() }
  const next = () => { if (timer.current) clearTimeout(timer.current); setPhase('text'); onNext() }

  const slide = {
    initial: { x: 200, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -200, opacity: 0 },
    transition: { type: 'spring', stiffness: 260, damping: 30 },
  }

  /* ------------------------------------------------------------------ */
  /* pick content                                                        */
  /* ------------------------------------------------------------------ */
  let content: React.ReactNode
  let key: string

  if (loading) {
    content = <Loader />
    key = 'loading'
  } else if (error) {
    content = <ErrorBlock msg={error.message} />
    key = 'error'
  } else if (list.length === 0) {
    content = <EmptyBlock />
    key = 'empty'
  } else if (isIntro) {
    content = <IntroSlide accentColor={accentColor} />
    key = 'intro'
  } else if (isFinal) {
    content = <FinalSlide accentColor={accentColor} />
    key = 'final'
  } else if (phase === 'text') {
    content = (
      <HeaderSlide accentColor={accentColor} month={month} />
    )
    key = `text-${currentProduct?.id || 'def'}-${currentIndex}`
  } else {
    content = (
      <ProductSlide currentProduct={currentProduct!} />
    )
    key = `prod-${currentProduct?.id || 'def'}-${currentIndex}`
  }

  /* ------------------------------------------------------------------ */
  /* wrapper                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="relative z-10 pointer-events-none flex flex-col items-center justify-center h-screen w-screen px-6 py-12">
      {/* Inner content container: no longer sets min-height, uses flex-grow to fill space */}
      <div className="relative w-full max-w-xl pointer-events-auto flex flex-col flex-grow items-center justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          {/* Ensure the motion.div also takes full height/width of its parent */}
          <motion.div key={key} {...slide} className="absolute inset-0 flex flex-col justify-center items-center h-full w-full">
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* small helper blocks                                                 */
/* ------------------------------------------------------------------ */
const Loader = () => (
  <div className="h-full flex flex-col items-center justify-center text-indigo-100 text-center">
    <h2 className="text-3xl font-bold">Fetching exciting products…</h2>
    <p className="mt-1 text-sm opacity-80">Please wait a moment.</p>
  </div>
)

const ErrorBlock = ({ msg }: { msg: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-red-300 text-center">
    <h2 className="text-3xl font-bold">Oops! Error loading products.</h2>
    <p className="mt-1 text-sm opacity-80">{msg}</p>
  </div>
)

const EmptyBlock = () => (
  <div className="h-full flex flex-col items-center justify-center text-indigo-100 text-center">
    <h2 className="text-3xl font-bold">No Products Found</h2>
    <p className="mt-1 text-sm opacity-80">
      It looks like you haven’t made any top purchases yet.
    </p>
  </div>
)

const IntroSlide = ({ accentColor }: { accentColor: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h1
      className="
        text-7xl sm:text-6xl md:text-7xl font-extrabold uppercase
        tracking-tight drop-shadow-lg text-transparent bg-clip-text
      "
      style={{
        backgroundImage: `linear-gradient(135deg, ${accentColor}, #ffffff 50%, ${accentColor})`,
      }}
    >
      This is your <br />
      <span style={{ color: accentColor }}>Shopify Wrapped</span>
    </h1>
  </div>
);

const FinalSlide = ({ accentColor }: { accentColor: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h2
      className="
        text-5xl sm:text-6xl md:text-7xl font-extrabold uppercase
        tracking-tight drop-shadow-lg text-transparent bg-clip-text
      "
      style={{
        backgroundImage: `linear-gradient(135deg, ${accentColor}, #ffffff 50%, ${accentColor})`,
      }}
    >
      That’s a wrap! <br /> See you next year 🎉
    </h2>
  </div>
);

const HeaderSlide = ({ accentColor, month }: { accentColor: string; month: string }) => (
  <div className="h-full flex flex-col items-center justify-center">
    <div className="relative py-8 px-4 w-full max-w-md overflow-hidden">
      <span
        aria-hidden
        className="absolute inset-0 -skew-y-6"
        style={{ background: `linear-gradient(90deg, ${accentColor}66, ${accentColor}33, transparent)` }}
      />
      <span
        aria-hidden
        className="absolute inset-0 skew-y-3"
        style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }}
      />
      <h2
        className="
          relative z-10 text-center uppercase font-extrabold select-none
          text-transparent bg-clip-text break-words
          text-5xl sm:text-5xl md:text-6xl lg:text-7xl
          leading-snug
          drop-shadow-lg
        "
        style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, #ffffff 50%, ${accentColor})` }}
      >
        Your
        Top
        Pick
        for<br />
        <span style={{ color: accentColor, fontSize: 70}}>{month}</span>
      </h2>
    </div>
  </div>
)

const ProductSlide = ({ currentProduct }: { currentProduct: Product }) => (
  <div className="flex flex-col items-center h-full w-full px-4">
    <div className="relative w-full h-[80%] md:h-[70%] rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative h-full flex items-center justify-center p-4">
        <ProductCard product={currentProduct} variant="compact" />
      </div>
    </div>
  </div>
)