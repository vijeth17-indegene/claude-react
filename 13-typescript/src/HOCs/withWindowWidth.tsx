import { useEffect, useState } from "react";

export default function withWindowWidth<P extends { width: number }>(
  Component: React.ComponentType<P>
) {
  const Wrapped = function WithWindowWidth(props: Omit<P, "width">) {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
      const onResize = () => setWidth(window.innerWidth);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);

    return <Component {...(props as P)} width={width} />;
  };

  Wrapped.displayName = `withWindowWidth(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
}