import React from 'react';

const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const dimension = sizeMap[size] || 40;

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center bg-secondary text-white fw-semibold ${className}`}
      style={{
        width: dimension,
        height: dimension,
        fontSize: dimension * 0.5,
      }}
      title={user?.name || 'Unknown User'}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;
