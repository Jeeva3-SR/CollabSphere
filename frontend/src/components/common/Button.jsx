import React from 'react';
import RBButton from 'react-bootstrap/Button'; 
import Spinner from 'react-bootstrap/Spinner';

const Button = ({
  children,
  variant = 'primary', 
  size, // 'sm', 'lg'
  className = '',
  isLoading = false,
  iconLeft,
  iconRight,
  onClick,
  type = 'button',
  disabled = false,
  as, 
  to, 
  ...props
}) => {
  let bsVariant = variant;
  if (variant === 'secondary-template') { 
    bsVariant = 'light'; 
  }


  return (
    <RBButton
      as={as}
      to={to}
      variant={bsVariant}
      size={size}
      className={`${className} d-inline-flex align-items-center justify-content-center`}
      disabled={disabled || isLoading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {isLoading && (
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
          className="me-2"
        />
      )}
      {iconLeft && !isLoading && <span className="me-2">{iconLeft}</span>}
      {children}
      {iconRight && !isLoading && <span className="ms-2">{iconRight}</span>}
    </RBButton>
  );
};

export default Button;