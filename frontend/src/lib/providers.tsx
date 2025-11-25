// Provider principal qui remplace le SessionProvider de NextAuth
'use client';

import React from 'react';
import { AuthProvider } from './auth-context';
import { I18nProvider } from '@/components/providers/I18nProvider';

interface AppProvidersProps {
    children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <I18nProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </I18nProvider>
    );
}
