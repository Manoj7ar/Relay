import { useState, useEffect } from 'react';
import { TopStatusBar } from '@/components/patient/TopStatusBar';
import { TranscriptionCard } from '@/components/patient/TranscriptionCard';
import { PrimaryMicButton } from '@/components/patient/PrimaryMicButton';
import { QuickPhrases } from '@/components/patient/QuickPhrases';
import { SymbolBoardButton } from '@/components/patient/SymbolBoardButton';
import { SymbolBoardOverlay } from '@/components/patient/SymbolBoardOverlay';
import { EmergencyBanner } from '@/components/patient/EmergencyBanner';
import { TypeInsteadSheet } from '@/components/patient/TypeInsteadSheet';
import { JudgeDemoStrip } from '@/components/demo/JudgeDemoStrip';
import { useJudgeDemo } from '@/contexts/JudgeDemoContext';
import { consumeQueuedJudgeScenario } from '@/lib/judgeDemoQueue';

export function PatientHomePage() {
  const [boardOpen, setBoardOpen] = useState(false);
  const { startFromScenarioId } = useJudgeDemo();

  useEffect(() => {
    const id = consumeQueuedJudgeScenario();
    if (id) startFromScenarioId(id);
  }, [startFromScenarioId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-3 pt-2">
      <div className="shrink-0">
        <TopStatusBar />
      </div>
      <TranscriptionCard />
      <JudgeDemoStrip />
      <EmergencyBanner />
      <div className="shrink-0">
        <QuickPhrases />
      </div>
      <div className="shrink-0">
        <SymbolBoardButton onOpen={() => setBoardOpen(true)} />
      </div>
      <div className="shrink-0 pb-1">
        <PrimaryMicButton />
        <div className="mt-1.5 flex justify-center">
          <TypeInsteadSheet />
        </div>
      </div>

      <SymbolBoardOverlay
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
      />
    </div>
  );
}
