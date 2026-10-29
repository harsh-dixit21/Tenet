"use client";

// Adapted from the supplied FloatingDock; keeps pointer magnification and adds keyboard support.
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { type LucideIcon } from 'lucide-react';
import { AnimatedGroup } from '@/components/motion-primitives/animated-group';

type DockItem = { title: string; icon: LucideIcon; onSelect: () => void };
export function FloatingDock({ items, active }: { items: DockItem[]; active: number }) {
  const mouseX = useMotionValue(Infinity);
  return <div className="dock-position"><AnimatedGroup preset="slide"><nav aria-label="Main navigation" className="floating-dock" onPointerMove={e => { if (e.pointerType === 'mouse') mouseX.set(e.clientX); }} onPointerLeave={() => mouseX.set(Infinity)}>
    {items.map((item, i) => <DockIcon key={item.title} item={item} active={active === i} mouseX={mouseX} />)}
  </nav></AnimatedGroup></div>;
}

function DockIcon({ item, active, mouseX }: { item: DockItem; active: boolean; mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduced = useReducedMotion();
  const distance = useTransform(mouseX, value => {
    const bounds = ref.current?.getBoundingClientRect();
    return bounds ? value - bounds.x - bounds.width / 2 : Infinity;
  });
  const magnification = useTransform(distance, [-100, 0, 100], [1, 1.23, 1]);
  const scale = useSpring(magnification, { mass: 0.1, stiffness: 160, damping: 14 });
  const Icon = item.icon;
  return <motion.button ref={ref} type="button" className="dock-item" aria-label={item.title} aria-current={active ? 'step' : undefined} onClick={item.onSelect} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ scale: reduced ? 1 : scale }}>
    <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
    <span className="dock-mobile-label">{item.title}</span>
    <AnimatePresence>{(hovered || focused) && <motion.span aria-hidden="true" className="dock-tooltip" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }}>{item.title}</motion.span>}</AnimatePresence>
  </motion.button>;
}
