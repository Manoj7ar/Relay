import { useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/cn';
import { TopStatusBar } from '@/components/patient/TopStatusBar';
import { TranscriptionCard } from '@/components/patient/TranscriptionCard';
import { PrimaryMicButton } from '@/components/patient/PrimaryMicButton';
import { HomeQuickActionRow } from '@/components/patient/HomeQuickActionRow';
import { SymbolBoardOverlay } from '@/components/patient/SymbolBoardOverlay';
import { TypeInsteadSheet } from '@/components/patient/TypeInsteadSheet';

export function PatientHomePage() {
  const [boardOpen, setBoardOpen] = useState(false);
  const { settings } = useSettings();
  useEffect(() => {
    if (!settings.relayPowerOn) setBoardOpen(false);
  }, [settings.relayPowerOn]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 pt-2">
      <div className="shrink-0">
        <TopStatusBar />
      </div>
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-2',
          !settings.relayPowerOn &&
            'pointer-events-none select-none opacity-45 motion-reduce:opacity-50',
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 min-[380px]:px-2.5">
          <TranscriptionCard />
        </div>
        <div className="shrink-0 flex flex-col gap-1.5 pb-1">
          <HomeQuickActionRow onOpenSymbolBoard={() => setBoardOpen(true)} />
          <PrimaryMicButton />
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
