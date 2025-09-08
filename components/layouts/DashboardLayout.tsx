import React, { useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { HiMenuAlt2, HiX, HiHome, HiUser, HiOfficeBuilding, HiCog, HiDatabase, HiChartBar, HiChevronDown, HiChevronRight } from 'react-icons/hi';
import { useAuth } from '../../lib/auth/AuthContext';

type DashboardSection = {
  id: 'overview' | 'reporting' | 'profile' | 'company' | 'settings';
  title: string;
  path?: string;
  icon: any;
  hasSubmenu?: boolean;
  submenuItems?: { id: string; title: string; path: string }[];
};

const DASHBOARD_SECTIONS: ReadonlyArray<DashboardSection> = [
  {
    id: 'overview',
    title: 'Overview',
    path: '/dashboard',
    icon: HiHome
  },
  
  {
    id: 'reporting',
    title: 'Reporting & Analytics',
    icon: HiChartBar,
    hasSubmenu: true,
    submenuItems: [
      {
        id: 'woocommerce-analytics',
        title: 'WooCommerce Analytics',
        path: '/woocommerce'
      }
    ]
  },
  {
    id: 'profile',
    title: 'Profile',
    path: '/dashboard?tab=profile',
    icon: HiUser
  },
  {
    id: 'company',
    title: 'Company',
    path: '/dashboard?tab=company',
    icon: HiOfficeBuilding
  },
  {
    id: 'settings',
    title: 'Settings',
    path: '/dashboard?tab=settings',
    icon: HiCog
  }
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Auto-open submenu if we're on a submenu page
  React.useEffect(() => {
    if (router.pathname === '/woocommerce') {
      setOpenSubmenu('reporting');
    }
  }, [router.pathname]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-16'
      }`}>
        <nav className="h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              {isSidebarOpen && (
                <h2 className="font-bold text-text text-lg">Dashboard</h2>
              )}
            </div>
          </div>
          <ul className="py-4">
            {DASHBOARD_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = (router.pathname === '/dashboard' && (!router.query.tab && section.id === 'overview' || router.query.tab === section.id)) || 
                              (router.pathname === '/woocommerce' && section.id === 'reporting');
              const isSubmenuOpen = openSubmenu === section.id;
              const hasActiveSubmenu = section.submenuItems?.some(item => router.pathname === item.path);

              return (
                <li key={section.id}>
                  {section.hasSubmenu ? (
                    <>
                      {/* Parent menu item with submenu */}
                      <button
                        onClick={() => setOpenSubmenu(isSubmenuOpen ? null : section.id)}
                        className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-all duration-200 ${
                          isActive || hasActiveSubmenu
                            ? 'bg-gradient-to-r from-primary/10 to-primary-dark/10 text-primary border-r-2 border-primary'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                          {isSidebarOpen && <span>{section.title}</span>}
                        </div>
                        {isSidebarOpen && (
                          <div className="flex-shrink-0">
                            {isSubmenuOpen ? (
                              <HiChevronDown className="h-4 w-4" />
                            ) : (
                              <HiChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        )}
                      </button>
                      
                      {/* Submenu items */}
                      {isSubmenuOpen && isSidebarOpen && section.submenuItems && (
                        <ul className="bg-gray-50 border-l-2 border-gray-200 ml-6">
                          {section.submenuItems.map((submenuItem) => {
                            const isSubmenuActive = router.pathname === submenuItem.path;
                            return (
                              <li key={submenuItem.id}>
                                <Link
                                  href={submenuItem.path}
                                  className={`flex items-center px-6 py-2 text-sm font-medium transition-all duration-200 ${
                                    isSubmenuActive
                                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                                >
                                  <span className="ml-6">{submenuItem.title}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    /* Regular menu item */
                    <Link
                      href={section.path!}
                      className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary/10 to-primary-dark/10 text-primary border-r-2 border-primary'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      {isSidebarOpen && <span>{section.title}</span>}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          
          {/* Admin Link for super_admin users */}
          {user?.role === 'super_admin' && (
            <div className="mt-4 px-6">
              <Link
                href="/admin"
                className="flex items-center px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-200 rounded-lg border border-primary/20 hover:border-primary/30"
              >
                <div className="h-5 w-5 bg-primary rounded mr-3 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                {isSidebarOpen && <span>Admin Management</span>}
              </Link>
            </div>
          )}
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
              <h1 className="text-2xl font-bold text-text">Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, <span className="font-medium">{user?.first_name} {user?.last_name}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span>Online</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="h-full overflow-auto bg-background">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 