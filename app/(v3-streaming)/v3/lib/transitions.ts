// GSAP animation presets for v3-streaming
// All durations in seconds for GSAP

export const hero = {
  crossfade: { duration: 0.6, ease: 'power2.inOut' },
  textEntrance: { duration: 0.4, ease: 'power2.out', stagger: 0.08, y: 10 },
  rotationInterval: 12, // seconds between hero rotations
}

export const card = {
  hoverScale: { duration: 0.2, ease: 'power2.out', scale: 1.03 },
  metadataIn: { duration: 0.2, ease: 'power2.out', y: 10 },
}

export const carousel = {
  scroll: { duration: 0.4, ease: 'power2.inOut' },
}

export const detail = {
  open: { duration: 0.35, ease: 'power2.out' },
  close: { duration: 0.3, ease: 'power2.in' },
  imageCrossfade: { duration: 0.25, ease: 'power1.inOut' },
  uiFadeIn: { duration: 0.3, delay: 0.25 },
  overlayFade: { duration: 0.3 },
}

export const pageEnter = {
  heroFade: { duration: 0.6, ease: 'power2.out' },
  carouselStagger: { duration: 0.5, ease: 'power2.out', stagger: 0.1, y: 30 },
}
