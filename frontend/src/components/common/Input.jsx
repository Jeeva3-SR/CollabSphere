import React from 'react';
import Form from 'react-bootstrap/Form';

const Input = ({
  label,
  name, // Use name for controlId, as it's usually unique for the form
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  className = '',
  inputClassName = '',
  required = false,
  id, // Accept an id prop
  ...props
}) => {
  const controlId = id || name; // Prefer explicit id, fallback to name

  return (
    <Form.Group className={`mb-3 ${className}`} controlId={controlId}> {/* Use controlId here */}
      {label && (
        <Form.Label className="text-template-dark fw-medium">
          {label} {required && <span className="text-danger">*</span>}
        </Form.Label>
      )}
      <Form.Control
        type={type}
        name={name} // Keep name for form submission
        // id={controlId} // NO LONGER NEEDED HERE - FormGroup handles it via controlId
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