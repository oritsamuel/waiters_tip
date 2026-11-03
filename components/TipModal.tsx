"use client";

import { useRouter } from "next/navigation";
import RatingStars from "./RatingStars";
import { useState } from "react";

type Props = {
  show: boolean;
  onClose: () => void;
  tip: number;
  rating: number;
  comment: string;
  phone: string;
  waiterPhoneNumber: string;
  companyId: string | number;
  branchCode?: string | number;
  branchId?: string | number;
};

export default function TipModal({
  show,
  onClose,
  tip,
  rating,
  comment,
  phone,
  waiterPhoneNumber,
  companyId,
  branchCode,
  branchId,

}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const payerPhoneNumber = "0" + phone;
  const effectiveBranchId = branchId ?? branchCode ?? "";
  const effectiveBranchCode = branchCode ?? branchId ?? "";

  if (!show) return null;

  const handleConfirm = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/waiter/tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "5D5EAFF4-D29A-485B-BDB9-785EF86FFFAE",
        },
        body: JSON.stringify({
          waiterPhoneNumber,
          payerPhoneNumber,
          companyId: Number(companyId),
          ...(effectiveBranchId ? { branchId: Number(effectiveBranchId) } : {}),
          ...(effectiveBranchCode ? { branchCode: String(effectiveBranchCode) } : {}),
          tipAmount: tip,
          rating,
          review: comment,
          referenceData: {
            sourceOrderId: "Hulubeje",
            CommandID: "InitTrans_P2PUSSDPUSH",
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.isSuccessful) {
        // Record to our mock backend
        try {
          await fetch('/api/transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId: String(companyId),
              branchCode: String(effectiveBranchCode || effectiveBranchId),
              ...(effectiveBranchId ? { branchId: String(effectiveBranchId) } : {}),
              waiterPhone: waiterPhoneNumber,
              payerPhone: payerPhoneNumber,
              tipAmount: tip,
              rating,
              comment,
            })
          });
        } catch (dbErr) {
          console.error("Failed to save to mock db", dbErr);
        }

        router.push("/success");
      } else {
        alert(data.message || "Payment not successful");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-6 w-[320px] text-center shadow-xl">

        {!loading && (
          <>
            <p className="text-black mb-2">
              Are you sure you want to proceed
            </p>

            <h2 className="text-4xl text-black font-bold mb-3">
              {tip} <span className="text-sm font-normal">ETB</span>
            </h2>

            <RatingStars rating={rating} />

            <p className="italic text-black text-sm my-3">
              {comment || " "}
            </p>

            <p className="text-black mb-4">
              {"+251" + phone || "+251"}
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirm}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </>
        )}

        {loading && (
          <div className="flex flex-col items-center py-6">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <p className="text-black font-medium">
              Processing payment...
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Please wait while we confirm your payment
            </p>
          </div>
        )}

      </div>
    </div>
  );
}