/**
 * Displays a user's avatar image, with a text initial fallback.
 * Props:
 *   src       - image URL (optional)
 *   name      - user's display name, used for the fallback initial and alt text
 *   size      - 'small' | 'medium' | 'large' (default: 'medium')
 */
const AvatarDisplay = ({ src, name = '', size = 'medium' }) => {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className={`avatar avatar--${size}`} aria-label={name}>
      {src ? (
        <img src={src} alt={name} className="avatar__img" />
      ) : (
        <span className="avatar__initial">{initial}</span>
      )}
    </div>
  );
};

export default AvatarDisplay;
