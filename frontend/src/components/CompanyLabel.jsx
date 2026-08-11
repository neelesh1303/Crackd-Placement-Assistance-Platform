import React from 'react';

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
    hash = (hash * 31 + name.charCodeAt(index)) % 360;
  }
  return `linear-gradient(135deg, hsl(${hash}, 70%, 48%), hsl(${(hash + 36) % 360}, 72%, 40%))`;
};

const looksLikeImageSource = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /^(https?:)?\/\//i.test(value) || /^data:image\//i.test(value) || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value);
};

const CompanyLabel = ({ company, name, logo, className = '', size = 'sm' }) => {
  const displayName = (company && company.name) || name || 'Unknown';
  const displayLogo = (company && company.logo) || logo || '';
  const initials = buildInitials(displayName);
  const [imageFailed, setImageFailed] = React.useState(false);
  const avatarSizeClasses = size === 'lg' ? 'w-10 h-10 text-base' : size === 'md' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs';
  const nameSizeClasses = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm';
  const canRenderImage = looksLikeImageSource(displayLogo) && !imageFailed;

  React.useEffect(() => {
    setImageFailed(false);
  }, [displayLogo]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`shrink-0 rounded-full flex items-center justify-center overflow-hidden shadow-md border border-white/40 font-bold ${avatarSizeClasses}`}
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
          <span className="text-white leading-none">{initials}</span>
        )}
      </div>
      <span className={`font-medium !text-white ${nameSizeClasses}`}>{displayName}</span>
    </div>
  );
};

export default CompanyLabel;
