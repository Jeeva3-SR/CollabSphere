import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

const LoadingSpinner = ({
  size = 'md', // 'sm', 'md', 'lg' (Bootstrap doesn't have these exact sizes, 'sm' is available)
  color = 'primary', // Bootstrap variant color: 'primary', 'secondary', 'success', etc.
  className = '',
  style = {},
  animation = "border", // "border" or "grow"
}) => {
  let spinnerSize = size === 'sm' ? 'sm' : undefined; // 'md' and 'lg' are default or require custom CSS

  const customSizeStyle = {};
  if (size === 'md') {
    customSizeStyle.width = '2rem'; // approx h-8 w-8
    customSizeStyle.height = '2rem';
  } else if (size === 'lg') {
    customSizeStyle.width = '3rem'; // approx h-12 w-12
    customSizeStyle.height = '3rem';
  }


  return (
    <div className={`d-flex justify-content-center align-items-center ${className}`} style={style}>
      <Spinner
        animation={animation}
        role="status"
        variant={color}
        size={spinnerSize}
        style={{ ...customSizeStyle }} // Apply custom dimensions for md/lg
      >
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
};

export default LoadingSpinner;