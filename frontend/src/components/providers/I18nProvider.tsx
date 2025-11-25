'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Initialize i18n on client side
        const initI18n = async () => {
            try {
                // Wait for i18n to be fully initialized
                if (!i18n.isInitialized) {
                    await new Promise((resolve) => {
                        i18n.on('initialized', resolve);
                    });
                }

                // Check if user has a saved language preference
                const savedLanguage = localStorage.getItem('i18nextLng');
                if (savedLanguage && ['en', 'fr'].includes(savedLanguage)) {
                    await i18n.changeLanguage(savedLanguage);
                }

                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize i18n:', error);
                setIsInitialized(true);
            }
        };

        initI18n();
    }, []);

    if (!isInitialized) {
        return <>{children}</>;
    }

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}