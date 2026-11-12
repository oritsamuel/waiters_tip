"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import PoweredBy from "@/components/PoweredBy";

export default function SuccessPage() {

    const router = useRouter();
    useEffect(() => {
        // Trigger confetti when component mounts
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
        });
    }, []);

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6">

            {/* Green circle */}
            <div className="w-56 h-56 rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                Thank You!
            </div>

            <p className="text-black mt-6 max-w-sm">
                We&apos;ve successfully confirmed your payment. You will receive sms confirmation shortly.
            </p>
            <PoweredBy />

        </main>
    );
}