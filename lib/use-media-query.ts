import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  // SSR hydration guard + media query subscription — setState is needed for both
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
    const mediaQueryList = window.matchMedia(query);
    const update = () => setMatches(mediaQueryList.matches);

    update();

    mediaQueryList.addEventListener("change", update);
    return () => mediaQueryList.removeEventListener("change", update);
  }, [query]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Return false during SSR and before mount to avoid hydration mismatch
  if (!mounted) return false;

  return matches;
}
