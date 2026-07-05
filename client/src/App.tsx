import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useState, useEffect, useCallback } from "react";
import Home from "./pages/Home";
import AIAssistant from "./pages/AIAssistant";
import Donors from "./pages/Donors";
import BloodBanks from "./pages/BloodBanks";
import Camps from "./pages/Camps";
import DocScan from "./pages/DocScan";

const tabs = [
  { id: "home", label: "Home" },
  { id: "assistant", label: "AI Assistant" },
  { id: "donors", label: "Donors" },
  { id: "banks", label: "Blood Banks" },
  { id: "camps", label: "Camps" },
  { id: "scan", label: "Doc Scan" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function App() {
  const getInitialTab = (): TabId => {
    const hash = window.location.hash.replace("#", "");
    if (hash && tabs.some(t => t.id === hash)) return hash as TabId;
    return "home";
  };
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="min-h-screen flex flex-col bg-white text-[#161A22] font-sans">
            <Nav activeTab={activeTab} onTabChange={handleTabChange} />
            <main className="flex-1">
              {activeTab === "home" && <Home />}
              {activeTab === "assistant" && <AIAssistant />}
              {activeTab === "donors" && <Donors />}
              {activeTab === "banks" && <BloodBanks />}
              {activeTab === "camps" && <Camps />}
              {activeTab === "scan" && <DocScan />}
            </main>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function Nav({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (tab: TabId) => void }) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E7E9EC] px-4 md:px-10 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 font-extrabold text-lg cursor-pointer" onClick={() => onTabChange("home")}>
        <span className="w-6 h-6 rounded-full bg-[#C8143C] text-white flex items-center justify-center text-sm">🩸</span>
        <span>RaktaSetu</span>
        <span className="text-[#C8143C]">AI</span>
      </div>
      <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[#374151]">
        {tabs.map(tab => (
          <a
            key={tab.id}
            className={`pb-1.5 border-b-2 border-transparent transition-colors ${activeTab === tab.id ? "text-[#C8143C] border-[#C8143C]" : "hover:text-[#C8143C]"}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </a>
        ))}
      </div>
      <button
        className="rounded-full px-5 py-2.5 font-semibold text-sm bg-[#C8143C] text-white hover:bg-[#9E0F30] transition-colors"
        onClick={() => onTabChange("assistant")}
      >
        Emergency Request
      </button>
    </nav>
  );
}

export default App;
