import { useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { HiMenuAlt2, HiX } from 'react-icons/hi';
import { BuildingOfficeIcon, UsersIcon, ServerIcon, InboxIcon } from '@heroicons/react/24/outline';

const ADMIN_SECTIONS = [
  {
    id: 'agencies',
    title: 'Agencies',
    path: '/admin',
    icon: BuildingOfficeIcon
  },
  {
    id: 'companies',
    title: 'Companies',
    path: '/admin?tab=companies',
    icon: BuildingOfficeIcon
  },
  {
    id: 'users',
    title: 'Users',
    path: '/admin?tab=users',
    icon: UsersIcon
  },
  {
    id: 'pipelines',
    title: 'Pipelines',
    path: '/admin?tab=pipelines',
    icon: ServerIcon
  },
  {
    id: 'accounts',
    title: 'Accounts',
    path: '/admin?tab=accounts',
    icon: ServerIcon
  },
  {
    id: 'leads',
    title: 'Leads',
    path: '/admin?tab=leads',
    icon: InboxIcon
  }
] as const;

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-16'
      }`}>
        <nav className="h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              {isSidebarOpen && (
                <h2 className="font-bold text-text text-lg">Admin</h2>
              )}
            </div>
          </div>
          <ul className="py-4">
            {ADMIN_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = router.pathname === '/admin' && (
                (section.id === 'agencies' && !router.query.tab) || 
                router.query.tab === section.id
              );
              return (
                <li key={section.id}>
                  <Link
                    href={section.path}
                    className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/10 to-primary-dark/10 text-primary border-r-2 border-primary'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    {isSidebarOpen && <span>{section.title}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Toggle Button */}
      <button 
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:shadow-xl"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <HiX size={20} /> : <HiMenuAlt2 size={20} />}
      </button>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        isSidebarOpen ? 'ml-0' : 'ml-0'
      }`}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-text">Admin Management</h1>
              <p className="text-sm text-gray-600">Manage your application's data and users</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
              >
                Back to Dashboard
              </Link>
              {/* Slot for page-level actions (e.g., Invite Client) */}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="h-full overflow-auto bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 