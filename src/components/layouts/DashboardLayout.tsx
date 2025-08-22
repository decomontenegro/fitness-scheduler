'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showBreadcrumbs?: boolean;
  actions?: React.ReactNode;
}

export function DashboardLayout({
  children,
  title,
  description,
  showBreadcrumbs = true,
  actions,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Breadcrumbs />
          </motion.div>
        )}
        
        {/* Page Header */}
        {(title || description || actions) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {description}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex items-center space-x-3">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

// Variant for full-width layouts
export function FullWidthDashboardLayout({
  children,
  ...props
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        {props.showBreadcrumbs !== false && (
          <div className="max-w-7xl mx-auto mb-6">
            <Breadcrumbs />
          </div>
        )}
        
        {/* Page Header */}
        {(props.title || props.description || props.actions) && (
          <div className="max-w-7xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  {props.title && (
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {props.title}
                    </h1>
                  )}
                  {props.description && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {props.description}
                    </p>
                  )}
                </div>
                {props.actions && (
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex items-center space-x-3">
                    {props.actions}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Page Content - Full Width */}
        {children}
      </div>
    </div>
  );
}

// Simplified Page Header Component
export function PageHeader({
  title,
  description,
  actions,
  showBreadcrumbs = true,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  showBreadcrumbs?: boolean;
}) {
  return (
    <>
      {showBreadcrumbs && (
        <div className="mb-6">
          <Breadcrumbs />
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="mt-4 sm:mt-0 sm:ml-6 flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </>
  );
}