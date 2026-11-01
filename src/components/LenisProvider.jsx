'use client';

import { useEffect } from 'react';
import { ReactLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function LenisProvider({ children }) {
  const onScroll = () => ScrollTrigger.update();

  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false,
      }}
      onScroll={onScroll}
    >
      {children}
    </ReactLenis>
  );
}