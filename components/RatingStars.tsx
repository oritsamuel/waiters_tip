"use client";

import { StarIcon } from "@heroicons/react/24/solid";

type Props = {
  rating: number;
  setRating?: (rating: number) => void;
};

export default function RatingStars({ rating, setRating }: Props) {
  return (
    <div className="flex justify-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          onClick={() => setRating && setRating(star)}
          className={`w-6 cursor-pointer ${
            rating >= star ? "text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}