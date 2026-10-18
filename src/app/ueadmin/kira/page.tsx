import React from 'react';
import { Metadata } from 'next';
import { KiraClient } from './KiraClient';

export const metadata: Metadata = {
  title: 'Kira HQ',
  description: 'Agent Kira and her AI teams: live store operations, by voice or text.',
};

export default function AgentKiraPage() {
  // `adm-raw` opts this bespoke console out of the admin design normalisation.
  return (
    <div className="adm-raw w-full">
      <KiraClient />
    </div>
  );
}
