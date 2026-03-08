import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}

const StarRating = ({ rating, onChange, size = 24 }: StarRatingProps) => {
  const handleClick = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftHalf = clickX < rect.width / 2;
    onChange(isLeftHalf ? star - 0.5 : star);
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const halfFilled = !filled && rating >= star - 0.5;

        return (
          <button
            key={star}
            type="button"
            onClick={(e) => handleClick(star, e)}
            disabled={!onChange}
            className="relative transition-transform hover:scale-110 disabled:cursor-default"
          >
            {/* Background empty star */}
            <Star size={size} className="text-star-inactive" />
            {/* Filled overlay */}
            {(filled || halfFilled) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : "50%" }}
              >
                <Star
                  size={size}
                  className="fill-star-active text-star-active"
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
