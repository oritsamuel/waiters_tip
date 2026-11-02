"use client";

import { useState } from "react";
import { useEffect } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RatingStars from "@/components/RatingStars";
import TipButtons from "@/components/TipButtons";
import TipModal from "@/components/TipModal";

function PageContent() {
    const [tip, setTip] = useState(25);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [phone, setPhone] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [open, setOpen] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [ratingError, setRatingError] = useState("");
    const [waiterOptions, setWaiterOptions] = useState<any[]>([]);

    type Waiter = {
        photo?: string;
        fullName?: string;
        rating?: number;
        phoneNumber?: string;
        companyLogo?: string;
    };

    const [waiter, setWaiter] = useState<Waiter | null>(null);

    const searchParams = useSearchParams();

    const dataParam = searchParams.get("data");
    const queryCompanyId = searchParams.get("companyId") || "";
    const queryBranchId = searchParams.get("branchId") || searchParams.get("branchCode") || "";
    const queryWaiterPhone = searchParams.get("waiterPhoneNumber") || searchParams.get("phone") || "";

    let companyId = queryCompanyId;
    let branchCode = queryBranchId;
    let companyLogo = "/waiter.png";
    let initialPhoneNumber = queryWaiterPhone;

    if (dataParam) {
        try {
            const decoded = JSON.parse(atob(dataParam));

            initialPhoneNumber = decoded.phone || initialPhoneNumber;
            companyId = decoded.companyId || companyId;
            branchCode = decoded.branchCode || branchCode;
            if (decoded.companyLogo) companyLogo = decoded.companyLogo;
        } catch (e) {
            console.error("Invalid data parameter");
        }
    }

    const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(initialPhoneNumber);
    const phoneNumber = selectedPhoneNumber || initialPhoneNumber;

    useEffect(() => {
        const fetchWaiter = async () => {
            if (!phoneNumber || !companyId || !branchCode) return;

            try {
                const res = await fetch(
                    `/api/waiter-tips/public?companyId=${encodeURIComponent(companyId)}&branchId=${encodeURIComponent(branchCode)}`
                );

                if (!res.ok) {
                    console.error("Request failed:", res.status);
                    return;
                }

                const result = await res.json();
                const waiters = Array.isArray(result) ? result : [];
                const matched = waiters.find(
                    (w: any) => w.phone === phoneNumber || w.phoneNumber === phoneNumber
                );

                if (matched) {
                    setWaiter({
                        fullName: matched.fullName,
                        phoneNumber: matched.phone || matched.phoneNumber,
                        photo: matched.imageUrl || matched.photo || "/waiter.png",
                        rating: matched.rating,
                        companyLogo,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch waiter:", error);
            }
        };

        fetchWaiter();
    }, [phoneNumber, companyId, branchCode]);

    useEffect(() => {
        const fetchWaiterOptions = async () => {
            if (!companyId || !branchCode || phoneNumber) return;

            try {
                const res = await fetch(
                    `/api/waiter-tips/public?companyId=${encodeURIComponent(companyId)}&branchId=${encodeURIComponent(branchCode)}`
                );
                if (!res.ok) {
                    setWaiterOptions([]);
                    return;
                }

                const result = await res.json();
                const options = Array.isArray(result) ? result : [];
                setWaiterOptions(options.map((item: any) => ({
                    ...item,
                    phoneNumber: item.phone || item.phoneNumber || item.waiterPhoneNumber,
                    fullName: item.fullName || item.name || "Waiter",
                    photo: item.imageUrl || item.photo || "/waiter.png",
                })));
            } catch (error) {
                console.error("Failed to fetch waiter list", error);
                setWaiterOptions([]);
            }
        };

        fetchWaiterOptions();
    }, [companyId, branchCode, phoneNumber]);

    const increase = () => setTip(Math.min(tip + 5, 300));
    const decrease = () => tip > 5 && setTip(tip - 5);

    if (!companyId || !branchCode) {
        return (
            <main className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
                <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-sm">
                    <h2 className="text-xl font-bold text-red-600">Invalid link</h2>
                    <p className="mt-2 text-sm text-gray-600">This page requires a valid companyId and branchId.</p>
                </div>
            </main>
        );
    }

    if (!phoneNumber && !waiter) {
        return (
            <main className="flex justify-center items-start min-h-screen bg-gray-100 py-10 px-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
                    <div className="mb-4 text-center">
                        <h1 className="text-xl font-bold text-black">Select a waiter</h1>
                        <p className="mt-1 text-sm text-gray-500">Company {companyId} · Branch {branchCode}</p>
                    </div>

                    {waiterOptions.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                            No active waiters are available for this branch yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {waiterOptions.map((option) => (
                                <button
                                    key={option.phoneNumber || option.waiterPhoneNumber || option.fullName}
                                    type="button"
                                    onClick={() => {
                                        const nextPhone = option.phoneNumber || option.waiterPhoneNumber || "";
                                        if (nextPhone) {
                                            setSelectedPhoneNumber(nextPhone);
                                            setWaiter(option);
                                            setWaiterOptions([]);
                                        }
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-red-300 hover:bg-red-50"
                                >
                                    <img src={option.photo || "/waiter.png"} alt={option.fullName || "Waiter"} className="h-12 w-12 rounded-full object-cover" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-black">{option.fullName || "Waiter"}</p>
                                        <p className="text-xs text-gray-500">{option.phoneNumber || option.waiterPhoneNumber || "No phone"}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        );
    }

    return (
        <main className="flex justify-center items-start min-h-screen bg-gray-100 py-10">
            <div className="bg-white w-[350px] rounded-xl shadow-lg p-6 text-center space-y-6 relative">

                {/* Card with logo half in/out */}
                <div className="bg-white border-1 border-yellow-300 rounded-xl shadow-lg pt-14 pb-6 px-4 relative text-center">

                    {/* Logo half inside/outside */}
                    <img
                        src={companyLogo}
                        className="w-20 h-20 rounded-full absolute -top-10 left-1/2 transform -translate-x-1/2 border-4 border-white object-cover bg-white"
                    />

                    {/* Waiter image */}
                    <div className="relative flex justify-center mt-4">
                        <div className="relative group p-1 rounded-full bg-gradient-to-b from-yellow-200 to-yellow-500 shadow-md">
                            <img
                                src={waiter?.photo || "/waiter.png"}
                                className="w-20 h-20 rounded-full cursor-pointer"
                                onClick={() => setOpen(true)}
                            />
                        </div>

                        {open && (
                            <>
                                {/* Click outside */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setOpen(false)}
                                ></div>

                                {/* Expanded circular image */}
                                <img
                                    src={waiter?.photo || "/waiter.png"}
                                    className="absolute top-0 z-50 w-72 h-72 rounded-full shadow-xl border-4 border-white"
                                />
                            </>
                        )}
                    </div>

                    {/* Name */}
                    <h2 className="text-lg font-semibold text-black mt-2">
                        {waiter?.fullName}
                    </h2>

                    {/* Rating in one line */}

                    <div className="mb-4"> <RatingStars rating={waiter?.rating || 0} /> </div>


                </div>

                {/* Tip Section */}
                <div className="space-y-2">
                    <p className="text-black text-sm text-left">Tip Amount</p>
                    <TipButtons setTip={setTip} />

                    <p className="text-black text-sm text-left">Enter custom Amount</p>
                    <div className="flex justify-center items-center gap-4">
                        <button
                            onClick={decrease}
                            className="text-xl text-black font-bold"
                        >
                            -
                        </button>

                        <input
                            type="number"
                            value={tip}
                            onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setTip(val > 300 ? 300 : val);
                            }}
                            className="border px-6 text-black py-1 rounded text-center"
                            min="0"
                            max="300"
                        />

                        <button
                            onClick={increase}
                            className="text-xl text-black font-bold"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Rating Section */}
                {/* Rating in one line */}
                <div className="flex flex-col mt-2 gap-1 items-start">
                    <div className="flex gap-2 items-center">
                        <span className="text-black text-sm font-medium">Rating:</span>
                        <RatingStars
                            rating={rating}
                            setRating={(val) => {
                                setRating(val);
                                setRatingError(""); // clear error when user clicks a star
                            }}
                        />
                    </div>
                    {ratingError && <p className="text-red-500 text-xs">{ratingError}</p>}
                </div>
                {/* Comment Section */}
                <div className="space-y-2">
                    <p className="text-black text-sm text-left">Comment</p>
                    <textarea
                        rows={1}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="border text-black w-full rounded p-2"
                    />

                    {/* Default comment buttons */}
                    <div className="flex gap-2">
                        {["Thanks!", "Great service!", "Much appreciated!"].map((text) => (
                            <button
                                key={text}
                                type="button"
                                onClick={() => setComment(text)}
                                className="text-sm text-yellow-600 bg-white hover:bg-gray-300 text-black px-3 py-1 rounded-full border-1 border-red-300"
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Phone Section */}
                <div className="space-y-1">
                    <p className="text-black text-sm text-left">Payment Method</p>

                    <div className="flex items-center gap-2">
                        <img src="/telebirr.jpg" className="w-7 h-7" />

                        <div
                            className={`flex items-center border rounded w-full ${phoneError ? "border-red-500" : "border-gray-300"
                                }`}
                        >
                            <span className="text-black px-2 border-r">+251</span>

                            <input
                                value={phone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "");

                                    if (value.length <= 9) setPhone(value);

                                    // remove error while typing
                                    setPhoneError("");
                                }}
                                placeholder="9XXXXXXXX"
                                className="text-black w-full p-2 outline-none"
                            />
                        </div>
                    </div>

                    {phoneError && (
                        <p className="text-red-500 text-xs text-left">
                            {phoneError}
                        </p>
                    )}
                </div>

                {/* Send Tip Button */}
                <button
                    onClick={() => {
                        let hasError = false;

                        if (rating === 0) {
                            setRatingError("Please provide a rating before sending your tip.");
                            hasError = true;
                        }

                        if (phone.length !== 9 || !phone.startsWith("9")) {
                            setPhoneError("Enter a valid phone number");
                            hasError = true;
                        }

                        if (hasError) return;

                        setShowModal(true);
                    }}
                    className="bg-red-600 text-white py-2 rounded w-full hover:bg-red-700"
                >
                    Send Tip
                </button>

            </div>

            <TipModal
                show={showModal}
                onClose={() => setShowModal(false)}
                tip={tip}
                rating={rating}
                comment={comment}
                phone={phone}
                waiterPhoneNumber={waiter?.phoneNumber || ""}
                companyId={companyId || ""}
                branchCode={branchCode || ""}
            />
        </main>
    );
}

export default function Page() {
    return (
        <Suspense fallback={null}>
            <PageContent />
        </Suspense>
    );
}