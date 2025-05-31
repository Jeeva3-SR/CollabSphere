import React from 'react';
import Form from 'react-bootstrap/Form';

const TextArea = ({
  label,
  name, // Use name for controlId
  value,
  onChange,
  placeholder,
  error,
  className = '',
  textareaClassName = '',
  rows = 4,
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
        as="textarea"
        name={name} // Keep name for form submission
        // id={controlId} // NO LONGER NEEDED HERE - FormGroup handles it via controlId
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        isInvalid={!!error}
        required={required}
        className={`${textareaClassName} rounded-xl`}
        style={{minHeight: '140px'}}
        {...props}
      />
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
};

export default TextArea;