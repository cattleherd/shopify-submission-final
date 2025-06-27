// src/components/LusionBackground.tsx (or .jsx)

// FIX: Correct import path for LusionScene.
// Assuming LusionScene.tsx is located at src/components/LusionScene.tsx
import LusionScene from "./LusionScene" 

export interface LusionBackgroundProps {
  index: number
  shouldPulse: boolean // ADDED: Prop for pulse control
  accentColor: string  // ADDED: Prop for the accent color
}

export default function LusionBackground({
  index,
  shouldPulse, // Destructure shouldPulse
  accentColor, // Destructure accentColor
}: LusionBackgroundProps) {
  return (
    // This div ensures the LusionScene is a fixed, full-viewport background layer.
    // '-z-10' places it behind other content.
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* 
        LusionScene stretches to fill this div.
        Pass all necessary props, including accentColor and shouldPulse.
      */}
      <LusionScene 
        index={index} 
        shouldPulse={shouldPulse} // Pass shouldPulse
        accentColor={accentColor} // Pass accentColor to affect all objects
        className="w-full h-full" // Ensure it fills the viewport
      />    
    </div>
  )
}