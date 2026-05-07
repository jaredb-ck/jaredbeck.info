import gsap from 'gsap'

/**
 * Animate cloud assets out — fade + shrink + slight drift.
 * Returns the timeline so callers can chain onComplete.
 */
export function animatePoolOut(
  elements: HTMLElement[],
): gsap.core.Timeline {
  const tl = gsap.timeline()
  if (elements.length === 0) return tl

  tl.to(elements, {
    opacity: 0,
    scale: 0.9,
    duration: 0.4,
    stagger: { each: 0.015, from: 'random' },
    ease: 'power2.in',
  })
  return tl
}

/**
 * Animate cloud assets in — fade up + scale from small.
 */
export function animatePoolIn(
  elements: HTMLElement[],
): gsap.core.Timeline {
  const tl = gsap.timeline()
  if (elements.length === 0) return tl

  gsap.set(elements, { opacity: 0, scale: 0.9 })
  tl.to(elements, {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    stagger: { each: 0.02, from: 'random' },
    ease: 'power2.out',
  })
  return tl
}

/**
 * Animate a single element from a source rect to a target rect.
 * Used for lightbox open (asset → center).
 */
export function animateRectTransition(
  element: HTMLElement,
  from: DOMRect,
  to: { x: number; y: number; width: number; height: number },
  duration: number = 0.4,
): gsap.core.Timeline {
  const tl = gsap.timeline()

  gsap.set(element, {
    position: 'fixed',
    left: from.left,
    top: from.top,
    width: from.width,
    height: from.height,
    zIndex: 90,
  })

  tl.to(element, {
    left: to.x,
    top: to.y,
    width: to.width,
    height: to.height,
    duration,
    ease: 'power3.inOut',
  })

  return tl
}

/**
 * Crossfade between two elements (used for lightbox image nav).
 */
export function crossfade(
  outEl: HTMLElement,
  inEl: HTMLElement,
  duration: number = 0.25,
): gsap.core.Timeline {
  const tl = gsap.timeline()

  gsap.set(inEl, { opacity: 0 })
  tl.to(outEl, { opacity: 0, duration }, 0)
  tl.to(inEl, { opacity: 1, duration }, 0)

  return tl
}
