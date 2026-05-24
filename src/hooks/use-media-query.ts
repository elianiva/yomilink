import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia(query);
		setMatches(mql.matches);
		function onChange(e: MediaQueryListEvent) {
			setMatches(e.matches);
		}
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}
