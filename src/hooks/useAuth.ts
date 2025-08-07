'use client';

import { useAuth as useAuthContext } from '@/contexts/AuthContext';

// Re-export the useAuth hook from context for cleaner imports
export const useAuth = useAuthContext;