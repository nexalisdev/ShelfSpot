"use client";

import { useEffect, useState } from "react";
import { ChangeEvent, FormEvent } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/auth-context";
import { backendApi, BackendApiError } from "@/lib/backend-api";
import { useUserPreferences } from "@/app/hooks/useUserPreferences";

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

  // États pour gérer l'expansion des sections
  const [expandedSections, setExpandedSections] = useState({
    users: false,
    personalInfo: false,
    signOut: false,
    features: false
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
      setMessage("Name updated successfully");
    } catch (error) {
      if (error instanceof BackendApiError) {
        setMessage(error.message);
      } else {
        setMessage("Error updating name");
      }
    }
  };

  const handleEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!user) return;

    try {
      await updateProfileEmail(userForm.email);
      setMessage("Email updated successfully");
    } catch (error) {
      if (error instanceof BackendApiError) {
        setMessage(error.message);
      } else {
        setMessage("Error updating email");
      }
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!user) return;

    if (userForm.password !== userForm.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      await backendApi.resetPassword(user.email, userForm.password);
      setMessage("Password updated successfully");
      setUserForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (error) {
      if (error instanceof BackendApiError) {
        setMessage(error.message);
      } else {
        setMessage("Error updating password");
      }
    }
  };

  if (!user) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Admin Section - Site Users */}
      {user.admin && (
        <div className="bg-card border border-border rounded-lg">
          <button
            onClick={() => toggleSection('users')}
            aria-expanded={expandedSections.users}
            aria-controls="section-users"
            className="w-full p-6 flex items-center justify-between hover:bg-muted/40 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-inset"
          >
            <div className="text-left">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">Site users</h2>
                <span className="ml-2 px-2 py-1 bg-accent/15 text-accent-foreground text-xs rounded-full">
                  admin
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Manage and view all registered users
              </p>
            </div>
            {expandedSections.users ? (
              <ChevronUpIcon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            )}
          </button>

          {expandedSections.users && (
            <div id="section-users" className="px-6 pb-6 border-t border-border">
              <div className="pt-4">
                {loadingUsers ? (
                  <div className="text-muted-foreground">Loading users...</div>
                ) : (
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center">
                            <span className="text-accent-foreground text-sm font-medium">
                              {(u.name || u.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {u.name || u.email}
                              {u.admin && (
                                <span className="ml-2 px-2 py-1 bg-accent/15 text-accent-foreground text-xs rounded-full">
                                  admin
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{u.email}</div>
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
      <div className="bg-card border border-border rounded-lg">
        <button
          onClick={() => toggleSection('personalInfo')}
          aria-expanded={expandedSections.personalInfo}
          aria-controls="section-personalInfo"
          className="w-full p-6 flex items-center justify-between hover:bg-muted/40 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-inset"
        >
          <div className="text-left">
            <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Update your username and email address
            </p>
          </div>
          {expandedSections.personalInfo ? (
            <ChevronUpIcon className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.personalInfo && (
          <div id="section-personalInfo" className="px-6 pb-6 border-t border-border">
            <div className="pt-4">
              {message && (
                <div className="mb-4 p-3 bg-accent/10 border border-accent/30 text-foreground rounded-lg">
                  {message}
                </div>
              )}

              <div className="space-y-6">
                {/* Username */}
                <form onSubmit={handleNameChange} className="space-y-3">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Username
                  </label>
                  <div className="flex gap-3">
                    <input
                      name="name"
                      value={userForm.name}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
                      placeholder="Enter your username"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                    >
                      Update
                    </button>
                  </div>
                </form>

                {/* Email */}
                <form onSubmit={handleEmailChange} className="space-y-3">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <div className="flex gap-3">
                    <input
                      name="email"
                      type="email"
                      value={userForm.email}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
                      placeholder="Enter your email"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                    >
                      Update
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out Section */}
      <div className="bg-card border border-border rounded-lg">
        <button
          onClick={() => toggleSection('signOut')}
          aria-expanded={expandedSections.signOut}
          aria-controls="section-signOut"
          className="w-full p-6 flex items-center justify-between hover:bg-muted/40 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-inset"
        >
          <div className="text-left">
            <h3 className="text-lg font-semibold text-foreground">Account & Security</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your session and account security settings
            </p>
          </div>
          {expandedSections.signOut ? (
            <ChevronUpIcon className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.signOut && (
          <div id="section-signOut" className="px-6 pb-6 border-t border-border">
            <div className="pt-4 space-y-6">
              {message && (
                <div className="p-3 bg-accent/10 border border-accent/30 text-foreground rounded-lg">
                  {message}
                </div>
              )}

              {/* Change Password */}
              <div>
                <h4 className="text-md font-medium text-foreground mb-3">Change Password</h4>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <label className="block text-sm font-medium text-muted-foreground">
                    New password
                  </label>
                  <div className="space-y-3">
                    <input
                      name="password"
                      type="password"
                      value={userForm.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
                      placeholder="Enter new password"
                    />
                    {userForm.password && (
                      <input
                        name="confirmPassword"
                        type="password"
                        value={userForm.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
                        placeholder="Confirm new password"
                      />
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Session Information */}
              <div>
                <h4 className="text-md font-medium text-foreground mb-3">Current Session</h4>
                <div className="bg-muted/40 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/15 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-accent rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {user?.name || user?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Logged in • Active session
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">This device</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sign Out Options */}
              <div>
                <h4 className="text-md font-medium text-foreground mb-3">Sign Out</h4>
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Signing out will end your current session. You&apos;ll need to sign in again to access your account.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => { e.preventDefault(); logout(); }}
                      className="px-4 py-2 rounded-full bg-destructive text-white font-medium hover:bg-destructive/90 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                    <button
                      onClick={() => toggleSection('signOut')}
                      className="px-4 py-2 border border-border text-muted-foreground hover:bg-muted/60 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-card border border-border rounded-lg">
        <button
          onClick={() => toggleSection('features')}
          aria-expanded={expandedSections.features}
          aria-controls="section-features"
          className="w-full p-6 flex items-center justify-between hover:bg-muted/40 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-inset"
        >
          <div className="text-left">
            <h2 className="text-xl font-semibold text-foreground">Dashboard Features</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Customize which elements appear on your home screen
            </p>
          </div>
          {expandedSections.features ? (
            <ChevronUpIcon className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.features && (
          <div id="section-features" className="px-6 pb-6 border-t border-border">
            <div className="pt-4">
              {preferencesLoading ? (
                <div className="text-muted-foreground">Loading preferences...</div>
              ) : (
                <div className="space-y-4">
                  {/* Welcome Header Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center">
                        <span className="text-accent-foreground text-sm">👋</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Welcome Header</div>
                        <div className="text-sm text-muted-foreground">Show the welcome banner with search bar</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label="Toggle Welcome Header"
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
                      <div className="w-11 h-6 rounded-full bg-muted peer-focus:ring-4 peer-focus:ring-ring/30 peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-muted after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  {/* Stats Cards Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center">
                        <span className="text-foreground text-sm">📊</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Statistics Cards</div>
                        <div className="text-sm text-muted-foreground">Show quick stats (items, rooms, etc.)</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label="Toggle Statistics Cards"
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
                      <div className="w-11 h-6 rounded-full bg-muted peer-focus:ring-4 peer-focus:ring-ring/30 peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-muted after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  {/* Chart Preferences Header */}
                  <div className="pt-4 pb-2">
                    <h3 className="text-lg font-medium text-foreground">Analytics Charts</h3>
                    <p className="text-sm text-muted-foreground">Choose which charts to display</p>
                  </div>

                  {/* Room Distribution Chart Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center">
                        <span className="text-accent-foreground text-sm">🏠</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Room Distribution</div>
                        <div className="text-sm text-muted-foreground">Pie chart showing items per room</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label="Toggle Room Distribution Chart"
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
                      <div className="w-11 h-6 rounded-full bg-muted peer-focus:ring-4 peer-focus:ring-ring/30 peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-muted after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  {/* Alerts Per Month Chart Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center">
                        <span className="text-foreground text-sm">🚨</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Alerts Per Month</div>
                        <div className="text-sm text-muted-foreground">Bar chart showing monthly alerts</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label="Toggle Alerts Per Month Chart"
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
                      <div className="w-11 h-6 rounded-full bg-muted peer-focus:ring-4 peer-focus:ring-ring/30 peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-muted after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  {/* Inventory Value Chart Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center">
                        <span className="text-foreground text-sm">💰</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Inventory Value</div>
                        <div className="text-sm text-muted-foreground">Line chart showing inventory value over time</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label="Toggle Inventory Value Chart"
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
                      <div className="w-11 h-6 rounded-full bg-muted peer-focus:ring-4 peer-focus:ring-ring/30 peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-muted after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  {/* Status Distribution Chart Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center">
                        <span className="text-foreground text-sm">📋</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Status Distribution</div>
                        <div className="text-sm text-muted-foreground">Bar chart showing item status distribution</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label="Toggle Status Distribution Chart"
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
                      <div className="w-11 h-6 rounded-full bg-muted peer-focus:ring-4 peer-focus:ring-ring/30 peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-muted after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
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
