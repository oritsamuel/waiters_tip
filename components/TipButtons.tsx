"use client";

type Props = {
  setTip: (value: number) => void;
};

export default function TipButtons({ setTip }: Props) {
  const tips = [20, 50, 100, 200];

  return (
    <div className="flex justify-center gap-2 mb-3">
      {tips.map((amount) => (
        <button
          key={amount}
          onClick={() => setTip(amount)}
          className="border px-4 text-black py-1 rounded hover:bg-gray-100"
        >
          {amount}
        </button>
      ))}
    </div>
  );
}