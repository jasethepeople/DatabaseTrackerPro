interface SidebarProps {
  activeTab: "tools" | "services" | "monitor";
  onTabChange: (tab: "tools" | "services" | "monitor") => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: "tools" as const, label: "Tools" },
    { id: "services" as const, label: "Services" },
    { id: "monitor" as const, label: "Monitor" },
  ];

  return (
    <div className="border-b border-opacity-20 border-white">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? "border-blue-500 text-white"
                : "border-transparent github-gray hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
