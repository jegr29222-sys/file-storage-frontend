import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function useFileRowAnimations(files, selectedFiles, isTrash) {
  const rowRefs = useRef({});

  useGSAP(() => {
    const ctx = gsap.context(() => {
      files.forEach((file, index) => {
        const ref = rowRefs.current[file.id];
        if (!ref) return;

        const delay = index * 0.04;

        gsap.fromTo(ref,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            delay,
            ease: 'power2.out',
            overwrite: true,
          }
        );
      });
    }, rowRefs);

    return () => ctx.revert();
  }, [files, selectedFiles.size]);
}

export function usePageTransition() {
  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.main-content',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );

      gsap.fromTo('.sidebar',
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.6, delay: 0.1, ease: 'power2.out' }
      );

      gsap.fromTo('.toolbar',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'power2.out' }
      );

      gsap.fromTo('.files-list',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: 'power2.out' }
      );
    });

    return () => ctx.revert();
  }, []);
}

export function useScrollReveals() {
  useGSAP(() => {
    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray('.scroll-reveal');

      elements.forEach((el, index) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          onEnter: () => {
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              delay: index * 0.05,
              ease: 'power2.out',
            });
          },
          once: true,
        });
      });
    });

    return () => ctx.revert();
  }, []);
}