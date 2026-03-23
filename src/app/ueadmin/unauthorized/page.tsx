import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="text-center space-y-8 max-w-md px-6">
        <div className="flex justify-center">
          <div className="p-6 bg-red-100 rounded-full">
            <ShieldX size={64} className="text-red-600" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-black">Access Denied</h1>
          <p className="text-lg text-black/60">
            You do not have permission to access this resource. This area is restricted to authorized administrators only.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-black/40 mb-3">
            Possible Reasons
          </h2>
          <ul className="text-left space-y-2 text-sm text-black/70">
            <li>• Your admin account is not assigned to this region</li>
            <li>• You are trying to access a store outside your jurisdiction</li>
            <li>• Your session has expired or is invalid</li>
            <li>• Your account permissions have been revoked</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/ueadmin/dashboard" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-black text-xs uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
          >
            <ArrowLeft size={16} />
            Return to Dashboard
          </Link>
          <Link 
            href="/ueadmin/login" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full border border-black/10 hover:bg-black/5 transition-colors"
          >
            Sign In Again
          </Link>
        </div>
      </div>
    </div>
  );
}
