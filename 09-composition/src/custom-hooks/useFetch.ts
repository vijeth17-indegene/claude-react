import { useCallback, useEffect, useState } from "react";

export default function useFetch<T>(url: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if(!url) return;

        const controller = new AbortController();

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(url, { signal: controller.signal });
                if( !res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                setError(err instanceof Error ? err.message : "UNKNOWN Error");
                setLoading(false);
            } finally {
                setLoading(false);
            }
        }

        load();

        return () => controller.abort();
    }, [url, reloadKey]);

    const refetch = useCallback(() => setReloadKey(k => k + 1), []);

    return { data, loading, error, refetch };
}