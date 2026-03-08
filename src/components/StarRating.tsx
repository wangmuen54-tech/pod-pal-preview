import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}

const StarRating = ({ rating, onChange, size = 24 }: StarRatingProps) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className="transition-transform hover:scale-110 disabled:cursor-default"
        >
          <Star
            size={size}
            className={
              star <= rating
                ? "fill-star-active text-star-active"
                : "text-star-inactive"
            }
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
