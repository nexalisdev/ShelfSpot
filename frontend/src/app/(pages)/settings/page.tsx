"use client";

import { useEffect, useState } from "react";
import { ChangeEvent, FormEvent } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/auth-context";
import { backendApi, BackendApiError } from "@/lib/backend-api";
import { useUserPreferences } from "@/app/hooks/useUserPreferences";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";

// Types pour les utilisateurs
interface User {
  id: number;
  name?: string;
  email: string;
  admin?: boolean;
}

export default function Settings() {
  const { user, logout, refreshUser, updateProfileEmail } = useAuth();
  const { preferences, updatePreferences, loading: preferencesLoading } = useUserPreferences();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const { t } = useTranslation();

  // États pour gérer l'expansion des sections
  const [expandedSections, setExpandedSections] = useState({
    users: false,
    personalInfo: false,
    signOut: false,
    features: false,
    management: false,
    language: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    if (user) {
      setUserForm((f) => ({ ...f, name: user.name || "", email: user.email || "" }));

      // If admin, fetch users
      if (user.admin) {
        setLoadingUsers(true);
        backendApi.getAllUsers()
          .then((users) => setUsers(users))
          .catch((error) => console.error('Failed to fetch users:', error))
          .finally(() => setLoadingUsers(false));
      }
    }
  }, [user]);

  // Handlers for user info update
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  const handleNameChange = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!user) return;

    try {
      await backendApi.updateProfile(userForm.name);
      await refreshUser(); // Refresh user data
      setMessage(t("page.settings.messages.nameUpdated"));
    } catch (error) {
      if (error instanceof BackendApiError) {
        setMessage(error.message);
      } else {
        setMessage(t("page.settings.messages.errorUpdatingName"));
      }
    }
  };

  const handleEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!user) return;

    try {
      await updateProfileEmail(userForm.email);
      setMessage(t("page.settings.messages.emailUpdated"));
    } catch (error) {
      if (error instanceof BackendApiError) {
        setMessage(error.message);
      } else {
        setMessage(t("page.settings.messages.errorUpdatingEmail"));
      }
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!user) return;

    if (userForm.password !== userForm.confirmPassword) {
      setMessage(t("page.settings.messages.passwordMismatch"));
      return;
    }

    try {
      await backendApi.resetPassword(user.email, userForm.password);
      setMessage(t("page.settings.messages.passwordUpdated"));
      setUserForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (error) {
      if (error instanceof BackendApiError) {
        setMessage(error.message);
      } else {
        setMessage(t("page.settings.messages.errorUpdatingPassword"));
      }
    }
  };

  if (!user) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-600 dark:text-gray-400">{t("loading")}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("page.settings.title")}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("page.settings.description")}
          </p>
        </div>
      </div>

      {/* Language Preferences Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <button
          onClick={() => toggleSection('language')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
        >
          <div className="text-left flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("page.settings.sections.language.title")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t("page.settings.sections.language.description")}
              </p>
            </div>
          </div>
          {expandedSections.language ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.language && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-4">
              <LanguageSelector />
            </div>
          </div>
        )}
      </div>

      {/* Management Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <button
          onClick={() => toggleSection('management')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
        >
          <div className="text-left flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("page.settings.sections.management.title")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t("page.settings.sections.management.description")}
              </p>
            </div>
          </div>
          {expandedSections.management ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.management && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {t("page.settings.sections.management.content")}
              </p>
              <button
                onClick={() => window.location.href = '/manage'}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {t("page.settings.sections.management.button")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Section - Site Users */}
      {user.admin && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <button
            onClick={() => toggleSection('users')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
          >
            <div className="text-left flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("page.settings.sections.users.title")}
                  </h2>
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 text-xs font-semibold rounded-full">
                    {t("page.settings.sections.users.adminBadge")}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {t("page.settings.sections.users.description")}
                </p>
              </div>
            </div>
            {expandedSections.users ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.users && (
            <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
              <div className="pt-4">
                {loadingUsers ? (
                  <div className="text-gray-500 dark:text-gray-400">{t("page.settings.sections.users.loading")}</div>
                ) : (
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-base font-semibold">
                              {(u.name || u.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              {u.name || u.email}
                              {u.admin && (
                                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 text-xs font-semibold rounded-full">
                                  {t("page.settings.sections.users.adminBadge")}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{u.email}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Information Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <button
          onClick={() => toggleSection('personalInfo')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
        >
          <div className="text-left flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("page.settings.sections.personalInfo.title")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t("page.settings.sections.personalInfo.description")}
              </p>
            </div>
          </div>
          {expandedSections.personalInfo ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.personalInfo && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-4">
              {message && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {message}
                </div>
              )}

              <div className="space-y-6">
                {/* Username */}
                <form onSubmit={handleNameChange} className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("page.settings.sections.personalInfo.username.label")}
                  </label>
                  <div className="flex gap-3">
                    <input
                      name="name"
                      value={userForm.name}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t("page.settings.sections.personalInfo.username.placeholder")}
                    />
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-md"
                    >
                      {t("page.settings.sections.personalInfo.username.button")}
                    </button>
                  </div>
                </form>

                {/* Email */}
                <form onSubmit={handleEmailChange} className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("page.settings.sections.personalInfo.email.label")}
                  </label>
                  <div className="flex gap-3">
                    <input
                      name="email"
                      type="email"
                      value={userForm.email}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t("page.settings.sections.personalInfo.email.placeholder")}
                    />
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-md"
                    >
                      {t("page.settings.sections.personalInfo.email.button")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <button
          onClick={() => toggleSection('signOut')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
        >
          <div className="text-left flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("page.settings.sections.accountSecurity.title")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t("page.settings.sections.accountSecurity.description")}
              </p>
            </div>
          </div>
          {expandedSections.signOut ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.signOut && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-4 space-y-6">
              {message && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {message}
                </div>
              )}

              {/* Change Password */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  {t("page.settings.sections.accountSecurity.changePassword.title")}
                </h4>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("page.settings.sections.accountSecurity.changePassword.newPassword")}
                  </label>
                  <div className="space-y-3">
                    <input
                      name="password"
                      type="password"
                      value={userForm.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t("page.settings.sections.accountSecurity.changePassword.newPasswordPlaceholder")}
                    />
                    {userForm.password && (
                      <input
                        name="confirmPassword"
                        type="password"
                        value={userForm.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder={t("page.settings.sections.accountSecurity.changePassword.confirmPasswordPlaceholder")}
                      />
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-md"
                    >
                      {t("page.settings.sections.accountSecurity.changePassword.button")}
                    </button>
                  </div>
                </form>
              </div>

              {/* Session Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  {t("page.settings.sections.accountSecurity.session.title")}
                </h4>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 rounded-lg p-4 border border-green-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user?.name || user?.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("page.settings.sections.accountSecurity.session.loggedIn")} • {t("page.settings.sections.accountSecurity.session.activeSession")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("page.settings.sections.accountSecurity.session.thisDevice")}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sign Out Options */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  {t("page.settings.sections.accountSecurity.signOut.title")}
                </h4>
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t("page.settings.sections.accountSecurity.signOut.description")}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => { e.preventDefault(); logout(); }}
                      className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t("page.settings.sections.accountSecurity.signOut.button")}
                    </button>
                    <button
                      onClick={() => toggleSection('signOut')}
                      className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {t("page.settings.sections.accountSecurity.signOut.cancel")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <button
          onClick={() => toggleSection('features')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
        >
          <div className="text-left flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("page.settings.sections.features.title")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t("page.settings.sections.features.description")}
              </p>
            </div>
          </div>
          {expandedSections.features ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.features && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-4">
              {preferencesLoading ? (
                <div className="text-gray-500 dark:text-gray-400">{t("page.settings.sections.features.loading")}</div>
              ) : (
                <div className="space-y-4">
                  {/* Welcome Header Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 rounded-lg border border-blue-100 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">👋</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {t("page.settings.sections.features.welcomeHeader.title")}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t("page.settings.sections.features.welcomeHeader.description")}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.showWelcomeHeader !== false}
                        onChange={async (e) => {
                          try {
                            await updatePreferences({ showWelcomeHeader: e.target.checked });
                          } catch (error) {
                            console.error('Failed to update preference:', error);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"></div>
                    </label>
                  </div>

                  {/* Stats Cards Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 rounded-lg border border-green-100 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {t("page.settings.sections.features.statsCards.title")}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t("page.settings.sections.features.statsCards.description")}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.showStatsCards !== false}
                        onChange={async (e) => {
                          try {
                            await updatePreferences({ showStatsCards: e.target.checked });
                          } catch (error) {
                            console.error('Failed to update preference:', error);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"></div>
                    </label>
                  </div>

                  {/* Recent Items Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-700 rounded-lg border border-purple-100 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🕒</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {t("page.settings.sections.features.recentItems.title")}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t("page.settings.sections.features.recentItems.description")}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.showRecentItems !== false}
                        onChange={async (e) => {
                          try {
                            await updatePreferences({ showRecentItems: e.target.checked });
                          } catch (error) {
                            console.error('Failed to update preference:', error);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"></div>
                    </label>
                  </div>

                  {/* Chart Preferences Header */}
                  <div className="pt-6 pb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t("page.settings.sections.features.charts.header")}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("page.settings.sections.features.charts.description")}
                    </p>
                  </div>

                  {/* Room Distribution Chart Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-700 rounded-lg border border-blue-100 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🏠</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {t("page.settings.sections.features.charts.roomDistribution.title")}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t("page.settings.sections.features.charts.roomDistribution.description")}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.showRoomDistribution !== false}
                        onChange={async (e) => {
                          try {
                            await updatePreferences({ showRoomDistribution: e.target.checked });
                          } catch (error) {
                            console.error('Failed to update preference:', error);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"></div>
                    </label>
                  </div>

                  {/* Alerts Per Month Chart Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-700 dark:to-gray-700 rounded-lg border border-orange-100 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🚨</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {t("page.settings.sections.features.charts.alertsPerMonth.title")}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t("page.settings.sections.features.charts.alertsPerMonth.description")}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.showAlertsPerMonth !== false}
                        onChange={async (e) => {
                          try {
                            await updatePreferences({ showAlertsPerMonth: e.target.checked });
                          } catch (error) {
                            console.error('Failed to update preference:', error);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"></div>
                    </label>
                  </div>

                  {/* Inventory Value Chart Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-700 dark:to-gray-700 rounded-lg border border-green-100 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {t("page.settings.sections.features.charts.inventoryValue.title")}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t("page.settings.sections.features.charts.inventoryValue.description")}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.showInventoryValue !== false}
                        onChange={async (e) => {
                          try {
                            await updatePreferences({ showInventoryValue: e.target.checked });
                          } catch (error) {
                            console.error('Failed to update preference:', error);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"></div>
                    </label>
                  </div>

                  {/* Status Distribution Chart Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-gray-700 dark:to-gray-700 rounded-lg border border-purple-100 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {t("page.settings.sections.features.charts.statusDistribution.title")}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t("page.settings.sections.features.charts.statusDistribution.description")}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.showStatusDistribution !== false}
                        onChange={async (e) => {
                          try {
                            await updatePreferences({ showStatusDistribution: e.target.checked });
                          } catch (error) {
                            console.error('Failed to update preference:', error);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
