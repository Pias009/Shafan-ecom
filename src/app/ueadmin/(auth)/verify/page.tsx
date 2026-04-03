"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError("Missing verification token.");
        setVerifying(false);
        return;
      }

      const res = await signIn("mfa", {
        token,
        redirect: false,
        callbackUrl: "/ueadmin",
      });

      if (res?.ok) {
        window.location.href = "/ueadmin";
      } else {
        setError("Invalid or expired verification link. Please try logging in again.");
        setVerifying(false);
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="mx-auto grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-black/5 bg-white p-10 shadow-2xl shadow-black/5 text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-black flex items-center justify-center">
             {verifying ? (
               <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
             ) : (
               <span className="text-white text-2xl font-black">!</span>
             )}
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-black mb-2">
          {verifying ? "Verifying..." : "Verification Failed"}
        </h2>
        
        <p className="text-sm text-black/50 mb-8 leading-relaxed">
          {verifying 
            ? "We're validating your secure magic link. One moment please..." 
            : error}
        </p>

        {!verifying && (
          <button 
            onClick={() => router.push("/ueadmin/login")}
            className="w-full h-12 rounded-full bg-black text-white font-bold text-sm tracking-widest hover:bg-black/80 transition-all"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyMfaPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
