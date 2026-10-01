import React from 'react';
import { Metadata } from 'next';
import { KiraClient } from './KiraClient';

export const metadata: Metadata = {
  title: 'Agent Kira 24/7 Command Center | Shanfa Enterprise Admin',
  description: 'Autonomous 24/7 AI Operations commanded by Agent Kira. Sales, Dev, SEO, Stock, and Marketing teams.',
};

export default function AgentKiraPage() {
  return (
    <div className="w-full">
      <KiraClient />
    </div>
  );
}
