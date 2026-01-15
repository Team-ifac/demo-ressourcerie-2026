import { useState, useEffect } from 'react';

export interface FilterPreferences {
  search: string;
  selectedThemes: number[];
  selectedType: string;
  selectedAgeRange: string;
  selectedDuration: string;
  selectedCategory: string;
  selectedCollection: string;
}

const DEFAULT_PREFERENCES: FilterPreferences = {
  search: '',
  selectedThemes: [],
  selectedType: '',
  selectedAgeRange: '',
  selectedDuration: '',
  selectedCategory: '',
  selectedCollection: 'all',
};

const STORAGE_KEY = 'ressourcerie_filter_preferences';

export function useFilterPreferences() {
  const [preferences, setPreferences] = useState<FilterPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les préférences depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder les préférences dans localStorage
  const savePreferences = (newPreferences: Partial<FilterPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
    }
  };

  // Réinitialiser les préférences
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression des préférences:', error);
    }
  };

  return {
    preferences,
    savePreferences,
    resetPreferences,
    isLoaded,
  };
}
