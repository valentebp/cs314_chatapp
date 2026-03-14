/**
 * Displays an error message in a styled banner.
 * Renders nothing if `message` is falsy.
 */
const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="error-message" role="alert">
      {message}
    </div>
  );
};

export default ErrorMessage;
