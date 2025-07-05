
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Layout/Sidebar'
import { Header } from '@/components/Layout/Header'
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext'

function AdminLayoutContent() {
  const { isCollapsed } = useSidebarContext();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header />
        <main className={`flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 ${isCollapsed ? 'pt-24' : 'pt-24'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminLayoutContent />
    </SidebarProvider>
  )
}
