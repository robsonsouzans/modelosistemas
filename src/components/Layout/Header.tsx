
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bell, Settings, Moon, Sun, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebarContext } from '@/contexts/SidebarContext';

const pageNames = {
  '/admin': 'Dashboard',
  '/admin/atendimentos': 'Atendimentos',
  '/admin/monitor': 'Monitor',
  '/admin/feedbacks': 'Feedbacks',
  '/admin/attendants': 'Atendentes',
  '/admin/management': 'Gerenciamento',
  '/admin/settings': 'Configurações'
};

export function Header() {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebarContext();

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const currentPageName = pageNames[location.pathname as keyof typeof pageNames] || 'Dashboard';

  const handleSettingsClick = () => {
    navigate('/admin/settings');
  };

  return (
    <div className={`fixed top-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'left-16' : 'left-64'}`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentPageName}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDark(!isDark)} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              {isDark ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-gray-600" />}
            </Button>
            
            {/* Settings */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSettingsClick}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </Button>
            
            {/* User Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-600">
              <div className="relative">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.username?.[0]?.toUpperCase() || 'PP'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username || 'Patricia Peters'}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Online
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
