import React from 'react';
import ReactSelect from 'react-select'; 
import Form from 'react-bootstrap/Form'; 

const Select = ({
  label,
  name,
  options,
  value,
  onChange,
  placeholder,
  isMulti = false,
  error,
  className = '', 
  selectClassName = 'multi-select-container', 
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
        className={`${selectClassName} basic-${isMulti ? 'multi-' : ''}select`}
        classNamePrefix="react-select" 
        isInvalid={!!error}
        styles={{
            control: (base, state) => ({
                ...base,
                borderColor: error ? '#dc3545' : state.isFocused ? '#86b7fe' : '#ced4da',
                boxShadow: error ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)' : state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : null,
                '&:hover': {
                    borderColor: error ? '#dc3545' : '#ced4da'
                },
            }),
        }}
        {...props}
      />
      {error && <Form.Text className="text-danger small">{error}</Form.Text>}
    </Form.Group>
  );
};

export default Select;