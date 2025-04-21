import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ReviewsSection = ({ user }) => {
  const { id } = useParams();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/universities/${id}/reviews`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ошибка при загрузке отзывов');
        }
        return response.json();
      })
      .then((data) => setReviews(data))
      .catch((error) => {
        console.error('Ошибка при загрузке отзывов:', error);
        setError(error.message);
      });
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      alert('Для добавления отзыва необходимо войти в систему.');
      return;
    }

    fetch(`http://localhost:5000/universities/${id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.users_id,
        rating,
        comment,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ошибка при добавлении отзыва');
        }
        return response.json();
      })
      .then((data) => {
        setReviews([data, ...reviews]);
        setComment('');
      })
      .catch((error) => {
        console.error('Ошибка при добавлении отзыва:', error);
        setError(error.message);
      });
  };

  const handleDeleteReview = (reviewId) => {
    fetch(`http://localhost:5000/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ошибка при удалении отзыва');
        }
        setReviews(reviews.filter((review) => review.reviews_id !== reviewId));
      })
      .catch((error) => {
        console.error('Ошибка при удалении отзыва:', error);
        setError(error.message);
      });
  };

  return (
    <div className="reviews-section">
      <h2>Отзывы</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Оценка:</label>
          <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Комментарий:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
        </div>
        <button type="submit">Отправить отзыв</button>
      </form>

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.reviews_id} className="review-item">
            <p><strong>{review.full_name}</strong> (Оценка: {review.rating})</p>
            <p>{review.comment}</p>
            <p><small>{new Date(review.created_at).toLocaleString()}</small></p>
            {user && user.user_type === 'admin' && (
              <button onClick={() => handleDeleteReview(review.reviews_id)}>Удалить отзыв</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsSection;