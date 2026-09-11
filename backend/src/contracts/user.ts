export interface UserProfile {
  userId: string;
  displayName: string;
  email: string | null;
  onboardingCompleted: boolean;
  consentVersion: string;
  preferredDifficulty: number;
  createdAt: string;
  lastActiveAt: string;
}

export interface UserPreferences {
  interestActivities: string[];
  preferredEnvironments: string[];
  avoidConditions: string[];
  existingSkills: string[];
  desiredSkills: string[];
  updatedAt: string;
}
