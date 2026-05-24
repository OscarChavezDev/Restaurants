'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

type Animation = 'slide-up' | 'slide-left' | 'slide-right' | 'fade-in';

interface Props {
  children: React.ReactNode;
  animation?: Animation;
  delay?: number;
  className?: string;
  once?: boolean;
}

const ANIMATION_CLASS: Record<Animation, string> = {
  'slide-up': 'animate-slide-up',
  'slide-left': 'animate-slide-left',
  'slide-right': 'animate-slide-right',
  'fade-in': 'animate-fade-in',
};

export function AnimateOnScroll({
  children,
  animation = 'slide-up',
  delay = 0,
  className,
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={cn(visible ? ANIMATION_CLASS[animation] : 'opacity-0', className)}
      style={visible && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
