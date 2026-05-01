import { useEffect } from 'react';

/**
 * Tags the document root for responsive density (narrow / short / landscape,
 * from visual viewport) and syncs optional CSS vars (keyboard inset, etc.).
 */
export function useViewportShell() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;

      root.dataset.vpNarrow = w < 380 ? 'true' : 'false';
      root.dataset.vpShort = h < 620 ? 'true' : 'false';
      // Width > height (e.g. landscape); used with [data-vp-landscape] in CSS.
      root.dataset.vpLandscape = w > h ? 'true' : 'false';

      if (vv) {
        const kb = Math.max(
          0,
          window.innerHeight - vv.height - Math.max(0, vv.offsetTop),
        );
        root.style.setProperty('--keyboard-inset', `${kb}px`);
      } else {
        root.style.setProperty('--keyboard-inset', '0px');
      }
    };

    apply();
    window.addEventListener('resize', apply);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    return () => {
      window.removeEventListener('resize', apply);
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
    };
  }, []);
}
