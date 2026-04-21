import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PatientHomePage } from '@/pages/PatientHomePage';
import { CaregiverPage } from '@/pages/CaregiverPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AboutPage } from '@/pages/AboutPage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<PatientHomePage />} />
        <Route path="/caregiver" element={<CaregiverPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<PatientHomePage />} />
      </Routes>
    </AppLayout>
  );
}
