import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PatientHomePage } from '@/pages/PatientHomePage';
import { CaregiverPage } from '@/pages/CaregiverPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { DemoPage } from '@/pages/DemoPage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<PatientHomePage />} />
        <Route path="/caregiver" element={<CaregiverPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="*" element={<PatientHomePage />} />
      </Routes>
    </AppLayout>
  );
}
