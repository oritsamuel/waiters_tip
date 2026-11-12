"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RatingStars from "@/components/RatingStars";
import TipButtons from "@/components/TipButtons";
import TipModal from "@/components/TipModal";
import PoweredBy from "@/components/PoweredBy";

type Waiter = {
    photo?: string;
    fullName?: string;
    rating?: number;
    phoneNumber?: string;
    companyLogo?: string;
};

type ApiWaiterItem = {
    companyId?: string | number;
    company?: {
        id?: string | number;
        name?: string;
        logo?: string;
        isActive?: boolean;
    };
    branch?: {
        companyId?: string | number;
        name?: string;
        isActive?: boolean;
    };
    status?: string;
    isActive?: boolean;
    isCompanyActive?: boolean;
    isBranchActive?: boolean;
    phone?: string;
    phoneNumber?: string;
    waiterPhoneNumber?: string;
    fullName?: string;
    name?: string;
    imageUrl?: string;
    photo?: string;
    rating?: number;
    companyName?: string;
    branchName?: string;
    companyLogo?: string;
};

type MerchantRecord = {
    id?: string | number;
    companyId?: string | number;
    merchantId?: string | number;
    company_id?: string | number;
    merchant_id?: string | number;

    name?: string;
    companyName?: string;
    merchantName?: string;

    company?: {
        id?: string | number;
        name?: string;
        companyName?: string;
    };

    merchant?: {
        id?: string | number;
        name?: string;
    };
};

function isValidId(val: string | null): boolean {
    if (!val) return false;
    const trimmed = val.trim();
    if (!/^\d+$/.test(trimmed)) return false;
    const num = Number(trimmed);
    return Number.isSafeInteger(num) && num > 0;
}

function getDisplayCompanyName(companyName: string | undefined, companyLogo: string | undefined, companyId: string): string {
    const trimmedName = companyName?.trim();
    if (trimmedName) return trimmedName;

    const logoName = companyLogo
        ?.split("/")
        .pop()
        ?.replace(/\.[^/.]+$/, "")
        ?.replace(/[_-]+/g, " ")
        .trim();

    if (logoName) return logoName;
    return `Company ${companyId}`;
}

const DEFAULT_COMMENT_OPTIONS = [
    "Thanks!",
    "Great service!",
    "Much appreciated!",
] as const;

function PageContent() {
    const [tip, setTip] = useState(5);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [phone, setPhone] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [open, setOpen] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [ratingError, setRatingError] = useState("");

    const [waiterOptions, setWaiterOptions] = useState<Waiter[]>([]);
    const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
    const [companyInfo, setCompanyInfo] = useState<{ name: string; logo: string } | null>(null);
    const [branchInfo, setBranchInfo] = useState<{ name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useSearchParams();

    const dataParam = searchParams.get("data");
    let queryCompanyId = searchParams.get("companyId");
    let queryBranchId = searchParams.get("branchId") || searchParams.get("branchCode");
    let queryWaiterPhone = searchParams.get("waiterPhoneNumber") || searchParams.get("phone") || "";

    if (dataParam) {
        try {
            const decoded = JSON.parse(atob(dataParam));
            if (decoded.companyId) queryCompanyId = String(decoded.companyId);
            if (decoded.branchCode || decoded.branchId) queryBranchId = String(decoded.branchId || decoded.branchCode);
            if (decoded.phone) queryWaiterPhone = String(decoded.phone);
        } catch (e) {
            console.error("Invalid data parameter", e);
        }
    }

    const isValid = isValidId(queryCompanyId) && isValidId(queryBranchId);
    const companyId = queryCompanyId ? queryCompanyId.trim() : "";
    const branchId = queryBranchId ? queryBranchId.trim() : "";

    useEffect(() => {
        if (!isValid || !companyId || !branchId) {
            // The page is intentionally gated by URL params; this state transition completes the fetch flow.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isMounted = true;

        const fetchBranchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    `/api/waiter-tips/public?companyId=${encodeURIComponent(companyId)}&branchId=${encodeURIComponent(branchId)}`,
                    { signal: controller.signal }
                );

                const payload = await res.json().catch(() => null);

                if (!res.ok) {
                    if (isMounted) {
                        setError(payload?.message || "Invalid or inactive company/branch combination.");
                        setLoading(false);
                    }
                    return;
                }

                const list: ApiWaiterItem[] = Array.isArray(payload)
                    ? (payload as ApiWaiterItem[])
                    : Array.isArray(payload?.data)
                    ? (payload.data as ApiWaiterItem[])
                    : payload
                    ? [payload as ApiWaiterItem]
                    : [];

                // Validate that the branch belongs to the supplied company
                const branchBelongsToCompany = list.every((item: ApiWaiterItem) => {
                    const itemCompanyId = item.companyId ?? item.company?.id;
                    if (itemCompanyId != null && Number(itemCompanyId) !== Number(companyId)) {
                        return false;
                    }
                    const itemBranchCompanyId = item.branch?.companyId;
                    if (itemBranchCompanyId != null && Number(itemBranchCompanyId) !== Number(companyId)) {
                        return false;
                    }
                    return true;
                });

                if (!branchBelongsToCompany) {
                    if (isMounted) {
                        setError("The requested branch does not belong to this company.");
                        setLoading(false);
                    }
                    return;
                }

                // Verify that company and branch are active
                const isInactive = list.some(
                    (item: ApiWaiterItem) =>
                        item.isActive === false ||
                        item.isCompanyActive === false ||
                        item.isBranchActive === false ||
                        item.company?.isActive === false ||
                        item.branch?.isActive === false
                );

                if (isInactive) {
                    if (isMounted) {
                        setError("This company or branch is currently inactive.");
                        setLoading(false);
                    }
                    return;
                }

                // Fetch the merchant record for this company to display the real company name
                let companyNameFromMerchant: string | undefined;
                try {
                    const merchantRes = await fetch(`/api/merchants?companyId=${encodeURIComponent(companyId)}`, { signal: controller.signal });
                    if (merchantRes.ok) {
                        const merchantPayload = await merchantRes.json().catch(() => null);
                        const merchantList: MerchantRecord[] = Array.isArray(merchantPayload?.data)
                            ? merchantPayload.data
                            : Array.isArray(merchantPayload)
                            ? merchantPayload
                            : [];

                        const matchedMerchant = merchantList.find((merchant) => {
                            const values = [
                                merchant.id,
                                merchant.companyId,
                                merchant.merchantId,
                                merchant.company?.id,
                                merchant.merchant?.id,
                                merchant.company_id,
                                merchant.merchant_id,
                            ];

                            return values.some(
                                (value) => value != null && String(value) === String(companyId)
                            );
                        });

                        companyNameFromMerchant =
                            matchedMerchant?.name ||
                            matchedMerchant?.companyName ||
                            matchedMerchant?.merchantName ||
                            matchedMerchant?.company?.name ||
                            matchedMerchant?.company?.companyName ||
                            matchedMerchant?.merchant?.name;
                    }
                } catch {
                    companyNameFromMerchant = undefined;
                }

                // Extract company and branch information from API response
                const first = list[0];
                const compLogo =
                    first?.companyLogo ||
                    first?.company?.logo ||
                    "/waiter.png";
                const compName = getDisplayCompanyName(
                    companyNameFromMerchant || first?.companyName || first?.company?.name,
                    compLogo,
                    companyId
                );
                const brName =
                    first?.branchName ||
                    first?.branch?.name ||
                    `Branch ${branchId}`;

                if (isMounted) {
                    setCompanyInfo({ name: compName, logo: compLogo });
                    setBranchInfo({ name: brName });

                    const mappedWaiters: Waiter[] = list
                        .filter((item: ApiWaiterItem) => item.status !== "terminated" && item.isActive !== false)
                        .map((item: ApiWaiterItem) => ({
                            phoneNumber: item.phone || item.phoneNumber || item.waiterPhoneNumber || "",
                            fullName: item.fullName || item.name || "Waiter",
                            photo: item.imageUrl || item.photo || "/waiter.png",
                            rating: typeof item.rating === "number" ? item.rating : 0,
                            companyLogo: compLogo,
                        }));

                    setWaiterOptions(mappedWaiters);

                    // If a waiter phone number was in URL parameters, find and select them
                    if (queryWaiterPhone) {
                        const matched = mappedWaiters.find(
                            (w) => w.phoneNumber === queryWaiterPhone
                        );
                        if (matched) {
                            setSelectedWaiter(matched);
                        }
                    }

                    setLoading(false);
                }
            } catch (err: unknown) {
                const errorName = typeof err === "object" && err !== null && "name" in err ? String((err as { name?: string }).name) : "";
                if (errorName === "AbortError") return;
                console.error("Failed to fetch branch waiter data", err);
                if (isMounted) {
                    setError("Failed to load company and branch data. Please try again.");
                    setLoading(false);
                }
            }
        };

        fetchBranchData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [isValid, companyId, branchId, queryWaiterPhone]);

    const increase = () => setTip(Math.min(tip + 5, 300));
    const decrease = () => tip > 5 && setTip(tip - 5);

    // 1. Missing or Invalid query parameters
    if (!isValid) {
        return (
            <main className="flex justify-center items-center min-h-screen bg-gray-100 px-4 py-10">
                <div className="bg-white w-[350px] rounded-xl shadow-lg p-6 text-center border border-red-300">
                    <h2 className="text-xl font-bold text-black">Invalid link</h2>
                    <p className="mt-2 text-sm text-gray-600">This page requires a valid companyId and branchId.</p>
                    <PoweredBy />
                </div>
            </main>
        );
    }

    // 2. Loading state
    if (loading) {
        return (
            <main className="flex flex-col justify-center items-center min-h-screen bg-gray-100 px-4 py-10">
                <div className="flex flex-col items-center py-6">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 text-sm">Loading branch details...</p>
                </div>
                <PoweredBy />
            </main>
        );
    }

    // 3. Error state (e.g. inactive, branch mismatch, or not found)
    if (error) {
        return (
            <main className="flex justify-center items-center min-h-screen bg-gray-100 px-4 py-10">
                <div className="bg-white w-[350px] rounded-xl shadow-lg p-6 text-center border border-red-300">
                    <h2 className="text-xl font-bold text-black">Unavailable</h2>
                    <p className="mt-2 text-sm text-gray-600">{error}</p>
                    <PoweredBy />
                </div>
            </main>
        );
    }

    const displayName = companyInfo?.name || getDisplayCompanyName(undefined, undefined, companyId);
    const displayBranch = branchInfo?.name || `Branch ${branchId}`;
    const displayLogo =  "/HB_logo.png";

    // 4. Waiter selection state (when no waiter is chosen yet)
    if (!selectedWaiter) {
        return (
            <main className="flex justify-center items-start min-h-screen bg-gray-100 py-10 px-4">
                <div className="bg-white w-[350px] rounded-xl shadow-lg p-6 text-center space-y-6 relative border border-red-300">
                    <div className="bg-white border border-red-300 rounded-xl shadow-lg pt-14 pb-6 px-4 relative text-center mt-6">
                        <img
                            src={displayLogo}
                            alt="Company logo"
                            className="w-20 h-20 rounded-full absolute -top-10 left-1/2 transform -translate-x-1/2 border-2 border-red-300 object-cover bg-white"
                        />
                        <div className="mt-2">
                            <h2 className="text-lg font-bold text-black">{displayName}</h2>
                            <p className="text-xs font-medium uppercase tracking-wide text-red-700">Tip the waiters</p>
                        </div>
                       
                    </div>

                    {waiterOptions.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                            No active waiters are available for this branch yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {waiterOptions.map((option) => (
                                <button
                                    key={option.phoneNumber || option.fullName}
                                    type="button"
                                    onClick={() => setSelectedWaiter(option)}
                                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-red-300 hover:bg-red-50"
                                >
                                    <img
                                        src={option.photo || "/waiter.png"}
                                        alt={option.fullName || "Waiter"}
                                        className="h-12 w-12 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-black">{option.fullName || "Waiter"}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    <PoweredBy />
                </div>
            </main>
        );
    }

    // 5. Tipping state (when waiter is selected)
    return (
        <main className="flex justify-center items-start min-h-screen bg-gray-100 py-10">
            <div className="bg-white w-[350px] rounded-xl shadow-lg p-6 text-center space-y-6 relative border border-red-300">

                {/* Card with logo half in/out */}
                <div className="bg-white border border-red-300 rounded-xl shadow-lg pt-14 pb-6 px-4 relative text-center">

                    {waiterOptions.length > 1 && (
                        <button
                            type="button"
                            onClick={() => setSelectedWaiter(null)}
                            aria-label="Back to waiters list"
                            className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-red-300 bg-white text-lg text-gray-700 shadow-sm transition hover:bg-red-50"
                        >
                            <span aria-hidden="true">←</span>
                        </button>
                    )}

                    {/* Logo half inside/outside */}
                    <img
                        src={displayLogo}
                        alt="Company logo"
                        className="w-20 h-20 rounded-full absolute -top-10 left-1/2 transform -translate-x-1/2 border-4 border-white object-cover bg-white"
                    />

                    {/* Company and Branch header */}
                    <div className="mt-2">
                        <h2 className="text-lg font-bold text-black">{displayName}</h2>
                        <p className="text-xs font-medium uppercase tracking-wide text-red-700">Tip the waiters</p>
                    </div>

                    {/* Waiter image */}
                    <div className="relative flex justify-center mt-2">
                        <div className="relative group p-1 rounded-full bg-gradient-to-b from-red-200 to-red-500 shadow-md">
                            <img
                                src={selectedWaiter.photo || "/waiter.png"}
                                className="w-20 h-20 rounded-full cursor-pointer"
                                onClick={() => setOpen(true)}
                                alt={selectedWaiter.fullName || "Waiter"}
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
                                    src={selectedWaiter.photo || "/waiter.png"}
                                    className="absolute top-0 z-50 w-72 h-72 rounded-full shadow-xl border-4 border-white"
                                    alt={selectedWaiter.fullName || "Waiter"}
                                />
                            </>
                        )}
                    </div>

                    {/* Name */}
                    <h2 className="text-lg font-semibold text-black mt-2">
                        {selectedWaiter.fullName}
                    </h2>

                    {/* Rating in one line */}
                    <div className="mb-2">
                        <RatingStars rating={selectedWaiter.rating || 0} />
                    </div>

                </div>

                {/* Tip Section */}
                <div className="space-y-2">
                    <p className="text-black text-sm text-left font-medium">Tip Amount</p>
                    <TipButtons setTip={setTip} />

                    <p className="text-black text-sm text-left font-medium">Enter custom Amount</p>
                    <div className="flex justify-center items-center gap-4">
                        <button
                            type="button"
                            onClick={decrease}
                            className="text-xl text-black font-bold px-2 py-1"
                        >
                            -
                        </button>

                        <input
                            type="number"
                            value={tip}
                            onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setTip(val);
                            }}
                            className="border px-6 text-black py-1 rounded text-center w-28"
                            min="0"
                        />

                        <button
                            type="button"
                            onClick={increase}
                            className="text-xl text-black font-bold px-2 py-1"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Rating Section */}
                <div className="flex flex-col mt-2 gap-1 items-start">
                    <div className="flex gap-2 items-center">
                        <span className="text-black text-sm font-medium">Rating:</span>
                        <RatingStars
                            rating={rating}
                            setRating={(val) => {
                                setRating(val);
                                setRatingError("");
                            }}
                        />
                    </div>
                    {ratingError && <p className="text-red-500 text-xs">{ratingError}</p>}
                </div>

                {/* Comment Section */}
                <div className="space-y-2">
                    <p className="text-black text-sm text-left font-medium">Comment</p>
                    <textarea
                        rows={1}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="border-2 border-black text-black w-full rounded-xl p-3 text-sm resize-none min-h-[64px]"
                        placeholder="Add a remark..."
                    />

                    {/* Default comment buttons */}
                    <div className="flex justify-center gap-3">
                        {DEFAULT_COMMENT_OPTIONS.map((text) => (
                            <button
                                key={text}
                                type="button"
                                onClick={() => setComment(text)}
                                className="min-w-[92px] rounded-full border border-red-400 bg-white px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Phone Section */}
                <div className="space-y-1">
                    <p className="text-black text-sm text-left font-medium">Payment Method</p>

                    <div className="flex items-center gap-2">
                        <img src="/telebirr.jpg" alt="Telebirr" className="w-7 h-7 object-contain" />

                        <div
                            className={`flex items-center border rounded w-full ${phoneError ? "border-red-500" : "border-gray-300"}`}
                        >
                            <span className="text-black px-2 border-r text-sm">+251</span>

                            <input
                                value={phone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "");
                                    if (value.length <= 9) setPhone(value);
                                    setPhoneError("");
                                }}
                                placeholder="9XXXXXXXX"
                                className="text-black w-full p-2 outline-none text-sm"
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
                    type="button"
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
                    className="bg-red-600 text-white py-2 rounded w-full font-medium hover:bg-red-700 transition"
                >
                    Send Tip
                </button>

                <PoweredBy />
            </div>

            <TipModal
                show={showModal}
                onClose={() => setShowModal(false)}
                tip={tip}
                rating={rating}
                comment={comment}
                phone={phone}
                waiterPhoneNumber={selectedWaiter.phoneNumber || ""}
                companyId={companyId}
                branchId={branchId}
                branchCode={branchId}
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
