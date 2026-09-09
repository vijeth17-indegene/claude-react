import { useState, useEffect } from "react";

type WindowWidthProps = {
  children: (width: number) => React.ReactNode;
};

export default function WindowWidth({ children }: WindowWidthProps) {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
      const onResize = () => setWidth(window.innerWidth);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);

    return <>{children(width)}</>
}