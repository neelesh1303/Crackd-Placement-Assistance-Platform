import React from 'react';

// Highlighter-ink palette for initials tiles — picked by hashing the company name.
const SWATCHES = ['#ffe25a', '#b9ec8f', '#ffb4cf', '#cdd6ff', '#ffd0a8', '#dccbff', '#a9e7e0'];

const buildInitials = (value) => {
  const parts = (value || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const buildBackground = (value) => {
  const name = (value || 'company').toLowerCase();
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 9973;
  }
  return SWATCHES[hash % SWATCHES.length];
};

const looksLikeImageSource = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /^(https?:)?\/\//i.test(value) || /^data:image\//i.test(value) || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value);
};

const CompanyLabel = ({ company, name, logo, className = '', size = 'sm', hideName = false }) => {
  const displayName = (company && company.name) || name || 'Unknown';
  const displayLogo = (company && company.logo) || logo || '';
  const initials = buildInitials(displayName);
  const [imageFailed, setImageFailed] = React.useState(false);
  const avatarSizeClasses = size === 'lg' ? 'w-14 h-14 text-xl' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-xs';
  const nameSizeClasses = size === 'lg' ? 'text-2xl font-extrabold tracking-tight' : size === 'md' ? 'text-lg font-bold tracking-tight' : 'text-sm font-semibold';
  const canRenderImage = looksLikeImageSource(displayLogo) && !imageFailed;

  React.useEffect(() => {
    setImageFailed(false);
  }, [displayLogo]);

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div
        className={`co-avatar ${avatarSizeClasses}`}
        style={{ background: canRenderImage ? '#ffffff' : buildBackground(displayName) }}
      >
        {canRenderImage ? (
          <img
            src={displayLogo}
            alt={`${displayName} logo`}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="leading-none">{initials}</span>
        )}
      </div>
      {!hideName && <span className={`truncate ${nameSizeClasses}`}>{displayName}</span>}
    </div>
  );
};

export default CompanyLabel;
