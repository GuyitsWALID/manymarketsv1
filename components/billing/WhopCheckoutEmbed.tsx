"use client";

import { WhopCheckoutEmbed as WhopEmbed, useCheckoutEmbedControls } from "@whop/checkout/react";
import { ENABLE_PRICING } from "@/lib/config";
import { Loader2 } from "lucide-react";

type Props = {
  planId: string;
  userEmail?: string;
  theme?: "light" | "dark" | "system";
  onComplete?: (planId: string, receiptId?: string) => void;
  className?: string;
};

export default function WhopCheckoutEmbedComponent({
  planId,
  userEmail,
  theme = "light",
  onComplete,
  className = "",
}: Props) {
  const ref = useCheckoutEmbedControls();
  
  if (!ENABLE_PRICING) {
    return (
      <div className={`text-center p-6 bg-gray-50 rounded-xl ${className}`}>
        <div className="font-bold text-lg mb-2">Billing Temporarily Disabled</div>
        <p className="text-sm text-gray-500">
          ManyMarkets is currently free for all users.
        </p>
      </div>
    );
  }

  if (!planId) {
    return (
      <div className={`text-center p-6 bg-red-50 rounded-xl ${className}`}>
        <div className="font-bold text-lg mb-2 text-red-600">Configuration Error</div>
        <p className="text-sm text-red-500">
          Whop Plan ID is not configured. Please set NEXT_PUBLIC_WHOP_PRO_PLAN_ID in your environment.
        </p>
      </div>
    );
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upgrade/complete`;

  return (
    <div className={className}>
      <WhopEmbed
        ref={ref}
        planId={planId}
        returnUrl={returnUrl}
        theme={theme}
        prefill={userEmail ? { email: userEmail } : undefined}
        onComplete={onComplete}
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-uvz-orange" />
            <span className="ml-3 text-gray-600">Loading checkout...</span>
          </div>
        }
      />
    </div>
  );
}
