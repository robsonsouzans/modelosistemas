
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BarChart3, MessageSquare, Users, Settings, LogOut, User, Monitor, Menu, Home, Cog } from 'lucide-react';
import { useSidebarContext } from '@/contexts/SidebarContext';

const menuItems = [{
  name: 'Dashboard',
  href: '/admin',
  icon: Home
}, {
  name: 'Atendimentos',
  href: '/admin/atendimentos',
  icon: MessageSquare
}, {
  name: 'Monitor',
  href: '/admin/monitor',
  icon: Monitor
}, {
  name: 'Feedbacks',
  href: '/admin/feedbacks',
  icon: BarChart3
}, {
  name: 'Atendentes',
  href: '/admin/attendants',
  icon: Users
}, {
  name: 'Gerenciamento',
  href: '/admin/management',
  icon: Cog
}, {
  name: 'Configurações',
  href: '/admin/settings',
  icon: Settings
}];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebarContext();
  
  return (
    <div className={cn(
      "h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex-shrink-0 fixed left-0 top-0 z-40", 
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">ModDesk</h1>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col overflow-y-auto py-4">
        {/* Menu Items */}
        <nav className="px-2 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link 
                key={item.name} 
                to={item.href} 
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive 
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-r-2 border-purple-600 dark:border-purple-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                )} 
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', isCollapsed ? 'mx-auto' : 'mr-3')} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* User Section */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-gray-700">
        {!isCollapsed ? (
          <div className="space-y-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout} 
              className="w-full flex items-center gap-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700" 
              title="Sair"
            >
              <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
