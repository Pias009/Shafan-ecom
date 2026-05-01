'use client';

import { useState, useEffect } from 'react';

interface TrackingLog {
  id: string;
  eventType: string;
  eventData: Record<string, unknown>;
  sessionId: string | null;
  userId: string | null;
  createdAt: string;
}

interface FeedStatus {
  googleFeed: { url: string; lastSync: string | null; status: string };
  metaFeed: { url: string; lastSync: string | null; status: string };
}

interface Credentials {
  gtm: { id: string | null; configured: boolean };
  googleAnalytics: { id: string | null; configured: boolean };
  metaPixel: { id: string | null; configured: boolean };
  metaConversionsApi: { configured: boolean };
  stripe: { configured: boolean };
  shippo: { configured: boolean };
}

export default function TrackingStatusHub() {
  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [feedStatus, setFeedStatus] = useState<FeedStatus | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingFeed, setTestingFeed] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [logsRes, feedRes, credRes] = await Promise.all([
        fetch('/api/tracking/log?limit=20'),
        fetch('/api/tracking/feed-status'),
        fetch('/api/tracking/credentials'),
      ]);

      const [logsData, feedData, credData] = await Promise.all([
        logsRes.json(),
        feedRes.json(),
        credRes.json(),
      ]);

      setLogs(logsData.logs || []);
      setFeedStatus(feedData);
      setCredentials(credData);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function testFeed(feed: 'google' | 'meta' | 'all') {
    setTestingFeed(feed);
    try {
      const res = await fetch(`/api/tracking/feed-status?test=${feed}`);
      const data = await res.json();
      setFeedStatus(data);
    } catch (error) {
      console.error('Error testing feed:', error);
    } finally {
      setTestingFeed(null);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500">Loading tracking status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Tracking & Analytics Status Hub</h1>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Credential Verification */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Credential Verification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {credentials && (
              <>
                <CredentialCard
                  name="Google Tag Manager"
                  id={credentials.gtm.id}
                  configured={credentials.gtm.configured}
                />
                <CredentialCard
                  name="Google Analytics"
                  id={credentials.googleAnalytics.id}
                  configured={credentials.googleAnalytics.configured}
                />
                <CredentialCard
                  name="Meta Pixel"
                  id={credentials.metaPixel.id}
                  configured={credentials.metaPixel.configured}
                />
                <CredentialCard
                  name="Meta Conversions API"
                  id={null}
                  configured={credentials.metaConversionsApi.configured}
                />
                <CredentialCard
                  name="Stripe"
                  id={null}
                  configured={credentials.stripe.configured}
                />
                <CredentialCard
                  name="Shippo"
                  id={null}
                  configured={credentials.shippo.configured}
                />
              </>
            )}
          </div>
        </div>

        {/* Catalog Feed Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Catalog Feed Status</h2>
          {feedStatus && (
            <div className="space-y-4">
              <FeedCard
                name="Google Shopping Feed"
                feed={feedStatus.googleFeed}
                onTest={() => testFeed('google')}
                testing={testingFeed === 'google'}
              />
              <FeedCard
                name="Meta Catalog Feed"
                feed={feedStatus.metaFeed}
                onTest={() => testFeed('meta')}
                testing={testingFeed === 'meta'}
              />
              <button
                onClick={() => testFeed('all')}
                disabled={testingFeed !== null}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {testingFeed === 'all' ? 'Testing...' : 'Test All Feeds'}
              </button>
            </div>
          )}
        </div>

        {/* Real-Time Event Log */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Real-Time Event Log (Last 20)</h2>
          {logs.length === 0 ? (
            <p className="text-gray-500">No tracking events logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.eventType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.sessionId || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CredentialCard({ name, id, configured }: { name: string; id: string | null; configured: boolean }) {
  return (
    <div className={`p-4 rounded-lg border ${configured ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{name}</h3>
          {id && <p className="text-sm text-gray-600 mt-1">{id}</p>}
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded ${configured ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
          {configured ? 'Configured' : 'Missing'}
        </span>
      </div>
    </div>
  );
}

function FeedCard({ name, feed, onTest, testing }: { name: string; feed: { url: string; lastSync: string | null; status: string }; onTest: () => void; testing: boolean }) {
  function getStatusColor(status: string) {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600">URL: {feed.url}</p>
          <p className="text-sm text-gray-600">
            Last Sync: {feed.lastSync ? new Date(feed.lastSync).toLocaleString() : 'Never'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(feed.status)}`}>
            {feed.status.toUpperCase()}
          </span>
          <button
            onClick={onTest}
            disabled={testing}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Feed'}
          </button>
        </div>
      </div>
    </div>
  );
}
