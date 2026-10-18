import React from 'react';
import { Metadata } from 'next';
import { KiraClient } from './KiraClient';

export const metadata: Metadata = {
  title: 'Agent Kira',
  description: 'AI operations assistant for the SHANFA admin team, grounded in live store data.',
};

export default function AgentKiraPage() {
  // `adm-raw` opts this bespoke console out of the admin design normalisation.
  return (
    <div className="adm-raw w-full">
      <KiraClient />
    </div>
  );
}
