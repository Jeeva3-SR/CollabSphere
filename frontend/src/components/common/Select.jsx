import React from 'react';
import ReactSelect from 'react-select'; // Renamed to avoid conflict
import Form from 'react-bootstrap/Form'; // For label and potential validation messages

const Select = ({
  label,
  name,
  options,
  value,
  onChange,
  placeholder,
  isMulti = false,
  error,
  className = '', // For the Form.Group wrapper
  selectClassName = 'multi-select-container', // For react-select wrapper for styling
  required = false,
  ...props
}) => {
  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      {label && (
        <Form.Label className="text-template-dark fw-medium">
          {label} {required && <span className="text-danger">*</span>}
        </Form.Label>
      )}
      <ReactSelect
        name={name}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isMulti={isMulti}
        className={`${selectClassName} basic-${isMulti ? 'multi-' : ''}select`} // From react-select docs
        classNamePrefix="react-select" // For styling individual parts
        isInvalid={!!error} // Custom prop, react-select doesn't have direct isInvalid
        styles={{ // Basic error styling if needed, though Form.Control.Feedback is separate
            control: (base, state) => ({
                ...base,
                borderColor: error ? '#dc3545' : state.isFocused ? '#86b7fe' : '#ced4da',
                boxShadow: error ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)' : state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : null,
                '&:hover': {
                    borderColor: error ? '#dc3545' : '#ced4da'
                },
                // To match h-14 from template if needed for single select
                // minHeight: !isMulti ? '56px' : 'auto',
            }),
        }}
        {...props}
      />
      {error && <Form.Text className="text-danger small">{error}</Form.Text>}
    </Form.Group>
  );
};

export default Select;