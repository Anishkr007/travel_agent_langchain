import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/auth';
import { useAuth } from '../components/AuthContext';

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

  if (!profile) return <div className="profile-page">Loading profile...</div>;

  return (
    <div className="profile-page">
      <h1 className="profile-title">Your Travel Profile</h1>
      <div className="profile-card">
        <div className="profile-row">
          <span className="profile-label">Name:</span> 
          <span className="profile-value">{profile.name || 'Not set'}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Budget Preference:</span> 
          <span className="profile-value">{profile.budget_preference || 'Not set'}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Food Preference:</span> 
          <span className="profile-value">{profile.food_preference || 'Not set'}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Favorite Destinations:</span> 
          <span className="profile-value">{profile.favorite_destinations?.join(', ') || 'None'}</span>
        </div>
      </div>
      <p className="profile-note">
        (Your profile is automatically updated by the AI based on your chat conversations.)
      </p>
    </div>
  );
};
