export const isServer = (): boolean => typeof window === 'undefined'

export const getObserver = () => isServer()
  ? null
  : window.IntersectionObserver &&
    new window.IntersectionObserver((entries) => {
      entries.forEach(({ intersectionRatio, target, isIntersecting }) => {
        if (intersectionRatio <= 0 && !isIntersecting) {
          return
        }
        if (!target) {
          return
        }
        ;(target as any).__lazy_handler__ && (target as any).__lazy_handler__()
      })
    })

export const checkInView = (dom: Element | null | undefined): boolean => {
  if (!dom || isServer()) {
    return false
  }
  const rect = dom.getBoundingClientRect()
  if (!rect.left && !rect.right && !rect.top && !rect.bottom) {
    return false
  }
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  )
}

export const getScrollParentDom = (
  dom: Element,
  scrollX: boolean
): Element | Document | null => {
  let el = dom
  if (!el) {
    return null
  }
  while (
    el &&
    el.tagName !== 'HTML' &&
    el.tagName !== 'BOYD' &&
    el.nodeType === 1
  ) {
    const style = (window.getComputedStyle(el) as any)[
      `overflow${scrollX ? 'X' : 'Y'}`
    ]
    if (style === 'scroll' || style === 'auto') {
      if (el.tagName === 'HTML' || el.tagName === 'BODY') {
        return document
      }
      return el
    }
    el = el.parentNode as Element
  }
  return document
}

export const addEvent = (
  elm: Document | Element | null,
  type: string,
  listener: any
): void => {
  if (elm instanceof Element) {
    elm.addEventListener(type, listener, {
      capture: false,
      passive: true
    })
  }
}

export const offEvent = (
  elm: Document | Element | null,
  type: string,
  listener: any
): void => {
  if (elm instanceof Element) {
    ;(elm as any).removeEventListener(type, listener, {
      capture: false,
      passive: true
    })
  }
}

export const requestIdleCallback = isServer()
    ? null
    : (cb: any, { timeout } = { timeout: 1 }) => {
      if ((window as any).requestIdleCallback) {
        (window as any).requestIdleCallback(cb, { timeout })
      } else {
        const start = Date.now()
        setTimeout(function () {
          cb({
            didTimeout: false,
            timeRemaining: function () {
              return Math.max(0, 50 - (Date.now() - start))
            }
          })
        }, timeout)
      }
    }