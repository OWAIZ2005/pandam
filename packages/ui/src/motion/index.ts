/**
 * Motion & depth toolkit. Reanimated-only ("3D-ish" via perspective + rotate
 * transforms and warm layered shadows) — no WebGL, so it runs in Expo Go and
 * on web. Every piece honours the OS reduced-motion setting.
 *
 * Press feedback lives in `components/Press.tsx` (`lift` prop); this module
 * adds the moments Press does not cover.
 */
export { useMotionOK } from './useMotionOK';
export { TiltCard, type TiltCardProps } from './TiltCard';
export { FloatingObject, type FloatingObjectProps } from './FloatingObject';
export { Reveal, type RevealProps } from './Reveal';
export { ConnectingPair, type ConnectingPairProps } from './ConnectingPair';
