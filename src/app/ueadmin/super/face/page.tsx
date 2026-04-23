"use client";

import { useState, useEffect } from 'react';
import SuperGuard from "../../_components/SuperGuard";
import { ScanFace, User, Trash2, Loader2, Plus, Check, X, Shield, Copy, Link as LinkIcon, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface EnrolledUser {
  userId: string;
  createdAt: string;
}

interface PendingRequest {
  id: string;
  adminId: string;
  adminName: string;
  expiresAt: string;
}

export default function FaceEnrollmentPage() {
  return (
    <SuperGuard>
      <FaceEnrollmentContent />
    </SuperGuard>
  );
}

function FaceEnrollmentContent() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<EnrolledUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enrolledRes, pendingRes] = await Promise.all([
        fetch('/api/admin/face/enroll'),
        fetch('/api/admin/face/enrollment-link')
      ]);
      
      const enrolledData = await enrolledRes.json();
      const pendingData = await pendingRes.json();
      
      setUsers(enrolledData.users || []);
      setPendingRequests(pendingData.tokens || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!newAdminId || !newAdminName) {
      toast.error('Please enter admin ID and name');
      return;
    }
    
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/face/enrollment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: newAdminId, adminName: newAdminName })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setGeneratedLink(data.enrollmentLink);
        toast.success('Enrollment link generated!');
        fetchData();
        setNewAdminId('');
        setNewAdminName('');
      } else {
        toast.error(data.error || 'Failed to generate link');
      }
    } catch (error) {
      toast.error('Failed to generate link');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Remove this admin face login?')) return;
    
    setDeleting(userId);
    try {
      const res = await fetch(`/api/admin/face/enroll?userId=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Face login removed');
        setUsers(prev => prev.filter(u => u.userId !== userId));
      } else {
        toast.error('Failed to remove');
      }
    } catch (error) {
      toast.error('Failed to remove');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white">
              <Shield size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-black">Face Login</h1>
          </div>
          <p className="text-sm font-medium text-black/60 mt-2 uppercase tracking-[0.2em]">
            Manage face login for admins (Super Admin only)
          </p>
        </div>
        
        <button
          onClick={() => setShowGenerate(!showGenerate)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-black/90 transition-all"
        >
          <Plus size={18} /> Generate Link
        </button>
      </div>

      {/* Generate Link Section */}
      {showGenerate && (
        <div className="glass-panel rounded-2xl p-6 border border-black/5">
          <h3 className="font-black text-lg mb-4">Generate One-Time Enrollment Link</h3>
          
          {!generatedLink ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-black/50 mb-2">
                  Admin ID (user ID)
                </label>
                <input
                  value={newAdminId}
                  onChange={(e) => setNewAdminId(e.target.value)}
                  placeholder="e.g., admin-id-123"
                  className="w-full h-12 rounded-xl bg-black/5 border border-black/10 px-4 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-black/50 mb-2">
                  Admin Name
                </label>
                <input
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full h-12 rounded-xl bg-black/5 border border-black/10 px-4 text-sm font-bold"
                />
              </div>
              <button
                onClick={handleGenerateLink}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold disabled:opacity-50"
              >
                {generating ? <Loader2 size={18} className="animate-spin" /> : <LinkIcon size={18} />}
                Generate Link
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
                <Check size={18} className="text-green-600" />
                <span className="text-green-800 font-bold text-sm">Link generated successfully!</span>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-black/50 mb-2">
                  One-Time Link (expires in 24 hours)
                </label>
                <div className="flex gap-2">
                  <input
                    value={generatedLink}
                    readOnly
                    className="flex-1 h-12 rounded-xl bg-black/5 border border-black/10 px-4 text-sm font-bold text-black/60"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 bg-black text-white rounded-xl font-bold"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-black/40">
                Send this link to the admin. They can use it once to enroll their face.
              </p>
              <button
                onClick={() => { setGeneratedLink(''); setShowGenerate(false); }}
                className="text-sm text-black/50 underline"
              >
                Generate another link
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enrolled Admins */}
      <div className="glass-panel rounded-2xl border border-black/5 overflow-hidden">
        <div className="px-6 py-4 bg-black text-white">
          <h3 className="font-black text-sm">Enrolled Admins ({users.length})</h3>
        </div>
        <table className="w-full">
          <thead className="bg-black/[0.02]">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest">Admin ID</th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest">Enrolled Date</th>
              <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-black/40">
                  <ScanFace className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No face enrollments yet</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.userId} className="hover:bg-black/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center">
                        <User size={14} />
                      </div>
                      <span className="font-bold text-sm">{user.userId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-black/60">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(user.userId)}
                      disabled={deleting === user.userId}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-full text-xs font-bold"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* How it works */}
      <div className="glass-panel rounded-2xl p-6 bg-blue-50 border border-blue-200">
        <h3 className="font-black text-blue-800 mb-3">How it works</h3>
        <ol className="space-y-2 text-sm text-blue-700">
          <li>1. Click "Generate Link" to create a one-time enrollment link</li>
          <li>2. Copy the link and share with the admin (via WhatsApp/email)</li>
          <li>3. Admin clicks link → takes photo → face is enrolled</li>
          <li>4. Admin can now login using face recognition</li>
          <li>5. Link expires after 24 hours or after first use</li>
        </ol>
      </div>
    </div>
  );
}