import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

const LoadingSpinner = ({
  size = 'md', 
  color = 'primary',
  className = '',
  style = {},
  animation = "border",
}) => {
  let spinnerSize = size === 'sm' ? 'sm' : undefined; 

  const customSizeStyle = {};
  if (size === 'md') {
    customSizeStyle.width = '2rem';
    customSizeStyle.height = '2rem';
  } else if (size === 'lg') {
    customSizeStyle.width = '3rem'; 
    customSizeStyle.height = '3rem';
  }


  return (
    <div className={`d-flex justify-content-center align-items-center ${className}`} style={style}>
      <Spinner
        animation={animation}
        role="status"
        variant={color}
        size={spinnerSize}
        style={{ ...customSizeStyle }} 
      >
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
};

export default LoadingSpinner;