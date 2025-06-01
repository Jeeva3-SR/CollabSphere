import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import RBButton from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { XCircleFill, PlusCircleFill, TagFill } from 'react-bootstrap-icons';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import SkillSelectionModal from '../common/SkillSelectionModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { skillOptions as allSkillOptions } from '../../utils/constants';

const ProjectForm = ({ onSubmit, initialData = {}, isLoading, submitButtonText = "Submit" }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true,
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        isPublic: initialData.isPublic === undefined ? true : initialData.isPublic,
      });

      if (initialData.requiredSkills && Array.isArray(initialData.requiredSkills)) {
        setSelectedSkills(
          initialData.requiredSkills.map(skillValue =>
            allSkillOptions.find(opt => opt.value === skillValue) || { value: skillValue, label: skillValue }
          ).filter(Boolean)
        );
      } else {
        setSelectedSkills([]);
      }
    }
  }, [initialData]);

  const { title, description, isPublic } = formData;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSkillsUpdateFromModal = (skillsFromModal) => {
    setSelectedSkills(skillsFromModal);
    if (formErrors.requiredSkills) setFormErrors(prev => ({ ...prev, requiredSkills: null }));
  };

  const removeSkillFromDisplay = (skillValueToRemove) => {
    setSelectedSkills(prevSkills => prevSkills.filter(skill => skill.value !== skillValueToRemove));
  };

  const validateForm = () => {
    const errors = {};
    if (!title.trim()) errors.title = "Project title is required.";
    else if (title.trim().length < 3) errors.title = "Title must be at least 3 characters.";
    else if (title.trim().length > 100) errors.title = "Title cannot exceed 100 characters.";

    if (!description.trim()) errors.description = "Project description is required.";
    else if (description.trim().length < 10) errors.description = "Description must be at least 10 characters.";
    else if (description.trim().length > 1000) errors.description = "Description cannot exceed 1000 characters.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const errorMessages = Object.values(formErrors).filter(Boolean).join(' \n');
      toast.error(errorMessages || "Please correct the form errors before submitting.");
      return;
    }
    const skillsValueArray = selectedSkills ? selectedSkills.map(skill => skill.value) : [];
    onSubmit({ ...formData, requiredSkills: skillsValueArray });
  };

  return (
    <>
      <Form onSubmit={handleSubmit} noValidate>
        <Input
          label="Project Title" name="title" value={title} onChange={handleChange}
          placeholder="e.g., AI-Powered Learning Platform" error={formErrors.title}
          required className="mb-3"
        />
        <TextArea
          label="Project Description" name="description" value={description} onChange={handleChange}
          placeholder="Describe your project goals, features, and what you aim to achieve."
          rows={5} error={formErrors.description} required className="mb-3"
        />
        
        <Form.Group className="mb-3">
          <Form.Label className="text-template-dark fw-medium d-block mb-1">
            Required Skills (Optional)
            {formErrors.requiredSkills && <span className="text-danger small ms-2">({formErrors.requiredSkills})</span>}
          </Form.Label>
          <div 
            className="p-2 border rounded-xl form-control d-flex align-content-start flex-wrap gap-1 mb-2" 
            style={{ minHeight: '56px', overflowY: 'auto', cursor: 'default' }}
            onClick={() => setShowSkillModal(true)}
            title="Click to Add/Edit Required Skills"
          >
            {selectedSkills.length > 0 ? selectedSkills.map(skill => (
              <Badge 
                key={`form-skill-${skill.value}`} 
                pill bg="primary-subtle" text="primary-emphasis" 
                className="d-flex align-items-center p-2 border border-primary-subtle me-1 mb-1"
              >
                <TagFill size={12} className="me-1"/> {skill.label}
                <XCircleFill 
                  size={16} className="ms-1 cursor-pointer opacity-75 hover-opacity-100" 
                  onClick={(e) => { e.stopPropagation(); removeSkillFromDisplay(skill.value); }}
                  style={{ cursor: 'pointer' }} title={`Remove ${skill.label}`}
                />
              </Badge>
            )) : (
              <span className="text-template-muted small align-self-center">No skills specified. Click below to add.</span>
            )}
          </div>
          <RBButton 
            type="button"
            variant="outline-secondary" 
            onClick={() => setShowSkillModal(true)} 
            className="w-100 btn-h10 d-flex align-items-center justify-content-center"
          >
            <PlusCircleFill size={16} className="me-2"/> Add/Edit Required Skills
          </RBButton>
        </Form.Group>

        <Form.Group className="mb-4" controlId="projectFormIsPublicSwitch">
          <Form.Check
            type="switch" id="projectFormIsPublic" name="isPublic"
            label="Make project public (discoverable by everyone)"
            checked={isPublic} onChange={handleChange} className="text-template-dark"
          />
        </Form.Group>

        <RBButton type="submit" variant="primary" size="lg" className="w-100 btn-h12" disabled={isLoading}>
          {isLoading && <LoadingSpinner size="sm" as="span" animation="border" className="me-2" />}
          {isLoading ? 'Submitting...' : submitButtonText}
        </RBButton>
      </Form>

      <SkillSelectionModal
        show={showSkillModal}
        handleClose={() => setShowSkillModal(false)}
        onSkillsConfirm={handleSkillsUpdateFromModal}
        initialSelectedSkills={selectedSkills}
        allSkillOptions={allSkillOptions}
      />
    </>
  );
};

export default ProjectForm;
