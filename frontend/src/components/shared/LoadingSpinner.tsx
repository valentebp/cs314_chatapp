const LoadingSpinner = ({ size = 'medium' }) => {
  return (
    <div className={`spinner spinner--${size}`} role="status" aria-label="Loading">
      <div className="spinner__ring" />
    </div>
  );
};

export default LoadingSpinner;
