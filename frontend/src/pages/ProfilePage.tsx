import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/auth';
import { useAuth } from '../components/AuthContext';
import { User, Settings, MapPin } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const response = await fetchWithAuth(`/profile/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    };
    fetchProfile();
  }, [userId]);

  if (!profile) return (
    <div className="p-8 text-text-muted text-[13px] flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-pulse" />
      Loading profile...
    </div>
  );

  const fields = [
    { label: 'Name',         value: profile.name || 'Not set' },
    { label: 'Budget',       value: profile.budget_preference || 'Not set' },
    { label: 'Dietary',      value: profile.food_preference || 'Not set' },
  ];

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[18px] font-semibold text-text mb-6 flex items-center gap-2">
          <User size={18} className="text-text-secondary" />
          Traveler Profile
        </h1>

        <div className="bg-surface border border-border rounded-lg overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border bg-bg/50">
            <h2 className="text-[13px] font-medium text-text-secondary flex items-center gap-2">
              <Settings size={14} />
              Preferences
            </h2>
          </div>
          <div className="flex flex-col">
            {fields.map(({ label, value }, i) => (
              <div
                key={label}
                className={`px-5 py-4 flex items-center text-[14px] ${i < fields.length - 1 ? 'border-b border-border' : ''}`}
              >
                <span className="w-32 text-text-secondary">{label}</span>
                <span className="flex-1 text-text">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-bg/50">
            <h2 className="text-[13px] font-medium text-text-secondary flex items-center gap-2">
              <MapPin size={14} />
              Favorite Destinations
            </h2>
          </div>
          <div className="p-5">
            <div className="flex gap-2 flex-wrap">
              {profile.favorite_destinations?.length ? profile.favorite_destinations.map((dest: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-[13px] border border-border rounded text-text bg-bg"
                >
                  {dest}
                </span>
              )) : (
                <span className="text-text-secondary text-[13px]">
                  None yet. Chat with the AI to start building your list.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
