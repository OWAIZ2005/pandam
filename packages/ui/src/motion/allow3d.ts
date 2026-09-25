import { Platform } from 'react-native';

/**
 * Whether 3D tilts (rotateX / rotateY) are safe to render.
 *
 * On iOS (and some Android GPUs) a view rotated around X/Y becomes a real 3D
 * plane: half of it sinks BEHIND flat sibling views — the cream organic
 * shapes, other photos — and gets visibly sliced by them. Browsers flatten
 * each layer, so this only ever shows up on a phone. Native keeps every flat
 * rotation, spring and parallax; only the out-of-plane tilt is dropped.
 */
export const ALLOW_3D = Platform.OS === 'web';
