import React from 'react';
import RBButton from 'react-bootstrap/Button'; // RB for React-Bootstrap
import Spinner from 'react-bootstrap/Spinner';

const Button = ({
  children,
  variant = 'primary', // Corresponds to Bootstrap variants
  size, // 'sm', 'lg'
  className = '',
  isLoading = false,
  iconLeft,
  iconRight,
  onClick,
  type = 'button',
  disabled = false,
  as, // For LinkContainer or custom component
  to, // For LinkContainer
  ...props
}) => {
  // Map template variants to Bootstrap if needed
  // 'secondary' from template (bg-[#dce8f3]) could be 'light' or a custom class
  let bsVariant = variant;
  if (variant === 'secondary-template') { // Example if template had a distinct 'secondary'
    bsVariant = 'light'; // Or a custom class
    // className += ' bg-template-accent text-template-dark';
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