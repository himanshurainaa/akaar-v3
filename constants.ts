import type { FitOption } from './types';

export const SURPRISE_PROMPTS = [
  'Give me a cool new hairstyle',
  'Add stylish sunglasses',
  'Change the background to a futuristic cityscape',
  'Put a friendly robot in the background',
  'Make my t-shirt a vintage band shirt',
  'Add a leather jacket',
  'Change the lighting to a golden hour sunset',
  'Add a subtle, magical glow around me',
  'Put a cute cat on my shoulder',
  'Wear a classic fedora hat',
  'Change my shirt to a Hawaiian shirt',
  'Add a simple gold necklace',
];

export const BACKGROUND_SUGGESTIONS = [
  'a clean, white studio background',
  'a bustling city street at night with neon lights',
  'a serene beach at sunset',
  'a cozy, rustic coffee shop interior',
  'the top of a mountain with a beautiful view',
  'a futuristic cityscape',
];

export const FIT_OPTIONS: { id: FitOption; label: string }[] = [
  { id: 'slim', label: 'Slim' },
  { id: 'regular', label: 'Regular' },
  { id: 'loose', label: 'Loose' },
  { id: 'baggy', label: 'Baggy' },
  { id: 'oversized', label: 'Oversized' },
];
