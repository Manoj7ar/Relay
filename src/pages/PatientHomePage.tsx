import { useState } from 'react';
import { TopStatusBar } from '@/components/patient/TopStatusBar';
import { TranscriptionCard } from '@/components/patient/TranscriptionCard';
import { PrimaryMicButton } from '@/components/patient/PrimaryMicButton';
import { QuickPhrases } from '@/components/patient/QuickPhrases';
import { SymbolBoardButton } from '@/components/patient/SymbolBoardButton';
import { SymbolBoardOverlay } from '@/components/patient/SymbolBoardOverlay';
import { EmergencyBanner } from '@/components/patient/EmergencyBanner';

export function PatientHomePage() {
  const [boardOpen, setBoardOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
      <TopStatusBar />
      <TranscriptionCard />
      <EmergencyBanner />
      <QuickPhrases />
      <SymbolBoardButton onOpen={() => setBoardOpen(true)} />
      <PrimaryMicButton />

      <SymbolBoardOverlay
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
      />
    </div>
  );
}
