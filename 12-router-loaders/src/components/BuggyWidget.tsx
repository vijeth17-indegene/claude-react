import { useState } from "react";

export default function BuggyWidget() {
    const [shouldCrash, setShouldCrash] = useState(false);

    if(shouldCrash) throw new Error ("Widget exploded during render");

    return <button onClick={() => setShouldCrash(true)}>Break the widget</button>;
}