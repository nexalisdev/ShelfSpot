'use client';

import { useTranslation } from 'react-i18next';
import { useUserPreferences } from '@/app/hooks/useUserPreferences';
import { useEffect, useState } from 'react';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export function LanguageSelector() {
    const { i18n } = useTranslation();
    const { preferences, updatePreferences } = useUserPreferences();
    const [isUpdating, setIsUpdating] = useState(false);

    // Sync i18n with database preference on mount
    useEffect(() => {
        const syncLanguage = async () => {
            if (preferences?.preferredLanguage && i18n.language !== preferences.preferredLanguage) {
                await i18n.changeLanguage(preferences.preferredLanguage);
            }
        };

        if (preferences?.preferredLanguage) {
            syncLanguage();
        }
    }, [preferences?.preferredLanguage, i18n]);

    const handleLanguageChange = async (languageCode: string) => {
        setIsUpdating(true);
        try {
            // Update i18n
            await i18n.changeLanguage(languageCode);

            // Save to database
            await updatePreferences({ preferredLanguage: languageCode });
        } catch (error) {
            console.error('Failed to update language:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const currentLanguage = preferences?.preferredLanguage || i18n.language || 'en';

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
                Language / Langue
            </label>
            <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        disabled={isUpdating}
                        className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-sm border-2 transition-all
              ${currentLanguage === lang.code
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }
              ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
                    >
                        <span className="text-2xl">{lang.flag}</span>
                        <span className={`font-medium ${currentLanguage === lang.code
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300'
                            }`}>
                            {lang.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
