import { useState } from "react";
import { Button } from "@/components/ui/button";
import CubeLogo from "@/components/cube-logo";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Search, 
  BarChart3, 
  FileText, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'RegDashboard', icon: LayoutDashboard },
    { id: 'trend', label: 'RegTrend', icon: TrendingUp },
    { id: 'search', label: 'RegSearch', icon: Search, active: true },
    { id: 'group', label: 'RegGroup', icon: BarChart3 },
    { id: 'flow', label: 'RegFlow', icon: FileText },
    { id: 'map', label: 'RegMap', icon: LayoutDashboard },
    { id: 'report', label: 'RegReport', icon: FileText },
    { id: 'reports', label: 'RegReports', icon: FileText },
    { id: 'profile', label: 'RegProfile', icon: Settings },
    { id: 'ops', label: 'RegOps', icon: BarChart3 },
  ];

  return (
    <div 
      className={`h-screen bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-600/20">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center justify-center w-full">
              <CubeLogo />
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center w-full">
              <CubeLogo />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-[var(--sidebar-text)] hover:text-white hover:bg-gray-600/20"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      {/* Module Label */}
      {!collapsed && (
        <div className="px-4 py-2">
          <span className="text-xs text-[var(--sidebar-text-muted)] uppercase tracking-wider">
            MODULES
          </span>
        </div>
      )}
      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = item.id === activeView;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onViewChange(item.id)}
              className={`w-full justify-start mb-1 text-left ${
                isActive 
                  ? 'bg-[var(--sidebar-active)] text-white' 
                  : 'text-[var(--sidebar-text)] hover:text-white hover:bg-gray-600/20'
              } ${collapsed ? 'px-2' : 'px-3'}`}
            >
              <IconComponent className={`w-4 h-4 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Button>
          );
        })}
      </nav>
      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-600/20">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">SR</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Welcome Suraj Rai
              </p>
              <p className="text-xs text-[var(--sidebar-text-muted)] truncate">
                Financial Services Group (FSG)
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Help Center */}
      <div className="p-2">
        <Button
          variant="ghost"
          className={`w-full justify-start text-[var(--sidebar-text)] hover:text-white hover:bg-gray-600/20 ${
            collapsed ? 'px-2' : 'px-3'
          }`}
        >
          <HelpCircle className={`w-4 h-4 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && <span className="text-sm">Help Centre</span>}
        </Button>
      </div>
    </div>
  );
}