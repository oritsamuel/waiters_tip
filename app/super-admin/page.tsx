"use client";

import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function SuperAdminPage() {
  const [companyId, setCompanyId] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadQR = () => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `waiter_app_qr_${companyId}_${branchCode}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      setCompanyLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!companyId.trim() || !branchCode.trim()) return;

    const dataObj = {
      companyId: companyId.trim(),
      branchCode: branchCode.trim(),
    };
    const encoded = btoa(JSON.stringify(dataObj));
    const url = `${window.location.origin}/?data=${encoded}`;
    setGeneratedUrl(url);
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-12 px-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl text-red-600 tracking-tight">Super Admin</h1>
        </div>

        <p className="text-sm text-gray-500">
          Generate a reusable QR code link for a specific company and branch.
        </p>

        <div className="space-y-1">
          <label className="block text-sm text-gray-700">Company ID</label>
          <input
            type="text"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow outline-none"
            placeholder="e.g. 50301"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm text-gray-700">Branch Code</label>
          <input
            type="text"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow outline-none"
            placeholder="e.g. MAIN"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Company Logo (Optional)</label>
          <p className="text-xs text-gray-400">Upload a logo to embed in the center of the QR code.</p>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-all"
          >
            {logoPreview ? (
              <>
                <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                <span className="text-xs text-gray-500">Click to change logo</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">🏢</div>
                <span className="text-sm text-gray-400">Click to upload logo</span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!companyId.trim() || !branchCode.trim()}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:-translate-y-0.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate App Link
        </button>

        {generatedUrl && (
          <div className="mt-8 border-t border-gray-200 pt-6 space-y-5 flex flex-col items-center">
            <h2 className="text-xl text-gray-800">Company QR Link</h2>

            <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 inline-block transition-transform hover:scale-105 flex flex-col items-center">
              <QRCodeCanvas
                id="qr-code-canvas"
                value={generatedUrl}
                size={220}
                imageSettings={
                  companyLogo
                    ? {
                        src: companyLogo,
                        height: 50,
                        width: 50,
                        excavate: true,
                      }
                    : undefined
                }
              />

              <button
                onClick={downloadQR}
                className="mt-4 w-full bg-red-50 text-red-600 text-sm py-2 rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
              >
                Download QR
              </button>
            </div>

            <div className="w-full flex gap-2">
              <input
                type="text"
                readOnly
                value={generatedUrl}
                className="flex-1 p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm text-gray-800 outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(generatedUrl)}
                className="bg-red-100 px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-200 transition-colors"
              >
                Copy
              </button>
            </div>
            <a
              href={generatedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-red-600 hover:underline text-sm"
            >
              Open Test Link &rarr;
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
