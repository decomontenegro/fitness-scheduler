'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  showHome?: boolean;
}

export function Breadcrumbs({
  items,
  separator = <ChevronRight className="w-4 h-4" />,
  className = '',
  showHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Auto-generate breadcrumbs from pathname if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    if (showHome) {
      breadcrumbs.push({
        label: 'Início',
        href: '/',
        icon: <Home className="w-4 h-4" />,
      });
    }
    
    // Map of path segments to user-friendly labels
    const labelMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'trainer': 'Trainer',
      'client': 'Cliente',
      'appointments': 'Agendamentos',
      'messages': 'Mensagens',
      'notifications': 'Notificações',
      'analytics': 'Analytics',
      'reports': 'Relatórios',
      'schedule': 'Agenda',
      'availability': 'Disponibilidade',
      'services': 'Serviços',
      'profile': 'Perfil',
      'settings': 'Configurações',
      'billing': 'Faturamento',
      'contact': 'Contato',
    };
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      breadcrumbs.push({
        label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbItems = items || generateBreadcrumbs();
  
  if (breadcrumbItems.length === 0) return null;
  
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-2 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center"
            >
              {index > 0 && (
                <span className="mx-2 text-gray-400 dark:text-gray-600">
                  {separator}
                </span>
              )}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isLast
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
}

// Variant with background
export function BreadcrumbsCard({
  items,
  className = '',
  ...props
}: BreadcrumbsProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4 ${className}`}>
      <Breadcrumbs items={items} {...props} />
    </div>
  );
}

// Simplified hook for using breadcrumbs
export function useBreadcrumbs() {
  const pathname = usePathname();
  
  const generateItems = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [
      {
        label: 'Início',
        href: '/',
        icon: <Home className="w-4 h-4" />,
      },
    ];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      items.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
      });
    });
    
    return items;
  };
  
  return {
    items: generateItems(),
    pathname,
  };
}