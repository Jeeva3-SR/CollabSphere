import React from 'react';
import Form from 'react-bootstrap/Form';

const Input = ({
  label,
  name, 
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  className = '',
  inputClassName = '',
  required = false,
  id, 
  ...props
}) => {
  const controlId = id || name; 

  return (
    <Form.Group className={`mb-3 ${className}`} controlId={controlId}>
      {label && (
        <Form.Label className="text-template-dark fw-medium">
          {label} {required && <span className="text-danger">*</span>}
        </Form.Label>
      )}
      <Form.Control
        type={type}
        name={name} 
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isInvalid={!!error}
        required={required}
        className={`${inputClassName} rounded-xl form-control-h14`}
        {...props}
      />
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
};

export default Input;