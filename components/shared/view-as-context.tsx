'use client';

import { createContext, useContext } from 'react';
import type { Profile, UserRole } from '@/types';

export interface ViewAsState {
  isImpersonating: boolean;
  viewUserId: string;
  viewProfile: Profile | null;
  realRole: UserRole;
}

const defaultState: ViewAsState = {
  isImpersonating: false,
  viewUserId: '',
  viewProfile: null,
  realRole: 'user',
};

const ViewAsContext = createContext<ViewAsState>(defaultState);

export function ViewAsProvider({ value, children }: { value: ViewAsState; children: React.ReactNode }) {
  return <ViewAsContext.Provider value={value}>{children}</ViewAsContext.Provider>;
}

export function useViewAs(): ViewAsState {
  return useContext(ViewAsContext);
}
