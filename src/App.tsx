import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { RoutedViews } from '@/components/layout/RoutedViews';
import { PatientHomePage } from '@/pages/PatientHomePage';
import { CaregiverPage } from '@/pages/CaregiverPage';
import { SettingsLayout } from '@/pages/settings/SettingsLayout';
import { SettingsHubPage } from '@/pages/settings/SettingsHubPage';
import {
  SettingsAccessibilityPage,
  SettingsDeveloperPage,
  SettingsLanguagePage,
  SettingsModelsPage,
  SettingsProfilePage,
  SettingsRoutingPage,
} from '@/pages/settings/settingsSubpages';
import { AboutPage } from '@/pages/AboutPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { useSettings } from '@/contexts/SettingsContext';
import { clearAll as clearPatientDictionary } from '@/lib/patientDictionary';
import { clearAllSamples } from '@/lib/voiceSamples';

export default function App() {
  const { settings, dispatch } = useSettings();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset-onboarding') === '1') {
      dispatch({ type: 'RESET_ONBOARDING' });
      dispatch({ type: 'CLEAR_VOICE_SAMPLES' });
      void clearAllSamples();
      void clearPatientDictionary();
      params.delete('reset-onboarding');
      const qs = params.toString();
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${qs ? `?${qs}` : ''}`,
      );
    }
  }, [dispatch]);

  if (!settings.onboardingCompletedAt) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="*"
        element={
          <AppLayout>
            <RoutedViews>
              <Routes>
                <Route path="/" element={<PatientHomePage />} />
                <Route path="/caregiver" element={<CaregiverPage />} />
                <Route path="/settings" element={<SettingsLayout />}>
                  <Route index element={<SettingsHubPage />} />
                  <Route path="profile" element={<SettingsProfilePage />} />
                  <Route path="language" element={<SettingsLanguagePage />} />
                  <Route
                    path="accessibility"
                    element={<SettingsAccessibilityPage />}
                  />
                  <Route path="models" element={<SettingsModelsPage />} />
                  <Route path="routing" element={<SettingsRoutingPage />} />
                  <Route path="developer" element={<SettingsDeveloperPage />} />
                </Route>
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<PatientHomePage />} />
              </Routes>
            </RoutedViews>
          </AppLayout>
        }
      />
    </Routes>
  );
}
