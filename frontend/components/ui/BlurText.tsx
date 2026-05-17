'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'motion/react';

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
}

export default function BlurText({
  text,
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
}: BlurTextProps) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  const animatedCount = useRef(0);

  const defaultFrom =
    direction === 'top'
      ? { filter: 'blur(10px)', opacity: 0, transform: 'translate3d(0,-50px,0)' }
      : { filter: 'blur(10px)', opacity: 0, transform: 'translate3d(0,50px,0)' };

  const defaultTo = {
    filter: ['blur(5px)', 'blur(0px)'],
    opacity: [0.5, 1],
    transform: [
      direction === 'top' ? 'translate3d(0,5px,0)' : 'translate3d(0,-5px,0)',
      'translate3d(0,0,0)',
    ],
  };

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    observer.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.current?.unobserve(ref.current!);
        }
      },
      { threshold: 0.1 }
    );
    observer.current.observe(ref.current);
    return () => observer.current?.disconnect();
  }, []);

  return (
    <p ref={ref} className={`flex flex-wrap ${className}`}>
      {elements.map((element, index) => (
        <motion.span
          key={index}
          initial={defaultFrom}
          animate={inView ? defaultTo : defaultFrom}
          transition={{
            duration: 0.3,
            delay: index * (delay / 1000),
            ease: 'easeOut',
          }}
          className="inline-block mr-1"
        >
          {element === ' ' ? '\u00A0' : element}
          {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </p>
  );
}
