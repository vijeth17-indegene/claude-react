import { createContext, useContext, useState, type ReactNode } from "react";

type TabsContextValue = {
    activeTab: string;
    setActiveTab: (id:string) => void;
}

type TabsProp = {
    defaultTab: string;
    children: ReactNode;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error("Tabs.Tab must be used inside <Tabs>");
    }
    return context;
}

export default function Tabs ({defaultTab, children}: TabsProp) {
    const [activeTab, setActiveTab] = useState(defaultTab);

    return (
        <TabsContext.Provider value={{activeTab, setActiveTab}} >
            <div className="tabs">{children}</div>
        </TabsContext.Provider>
    );
}

function List({children}: { children: ReactNode}) {
    return <div role="tablist" className="tabs-list">{children}</div>;
}

function Tab({id, children}: { id: string; children: ReactNode; }) {
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === id;

    return (
        <button
            onClick={() => setActiveTab(id)}
            aria-selected={isActive}
            className={isActive ? "tab active": "tab"}
        >
            {children}
        </button>
    );
}

function Panel({id, children}: {id: string; children: ReactNode}) {
    const { activeTab } = useTabsContext();
    if (activeTab !== id) return null;
    return <div className="panel">{children}</div>;
}

Tabs.List = List;
Tabs.Tab = Tab;
Tabs.Panel = Panel;
