import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import RBButton from 'react-bootstrap/Button'; // Aliased
// Row and Col are not directly used in this specific component's JSX, but good to keep if you plan to structure inputs with them later
// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';

// Common Components (Input, TextArea, Select are now Bootstrap-styled wrappers)
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Select from '../common/Select'; // Your Bootstrap-styled Select wrapper for react-select


// Same skillOptions as in RegisterPage or from a shared config/API
const skillOptions = [
  { value: 'javascript', label: 'JavaScript' }, { value: 'react', label: 'React' },
  { value: 'node.js', label: 'Node.js' }, { value: 'python', label: 'Python' },
  // ... more skills
];

const ProjectForm = ({ onSubmit, initialData = {}, isLoading, submitButtonText = "Submit" }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true, // Sensible default for new projects
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Ref to track if initial data has been applied
  const initialDataAppliedRef = useRef(false); // Initialize ref

  useEffect(() => {
    // Populate form with initialData if provided (for editing)
    // Only apply if initialData exists, has keys (not an empty default {}), and hasn't been applied yet
    if (initialData && Object.keys(initialData).length > 0 && !initialDataAppliedRef.current) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        isPublic: initialData.isPublic === undefined ? true : initialData.isPublic,
      });
      if (initialData.requiredSkills) {
        const initialSkillObjects = initialData.requiredSkills.map(skillValue =>
          skillOptions.find(opt => opt.value === skillValue) || { value: skillValue, label: skillValue }
        ).filter(Boolean); // filter(Boolean) removes any null/undefined if a skillValue isn't in skillOptions
        setSelectedSkills(initialSkillObjects);
      }
      initialDataAppliedRef.current = true; // Mark that initial data has been set
    }
  }, [initialData]); // Dependency: Rerun when initialData prop changes


  const { title, description, isPublic } = formData;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
    // If user starts typing, consider initial data "stale" for automatic updates from props for these fields
    // initialDataAppliedRef.current = true; // This line might be too aggressive if initialData can truly change and needs to re-sync
                                          // Keeping it simple: once user edits, prop changes for these direct fields won't auto-override.
  };

  const handleSkillsChange = (selectedOptions) => {
    setSelectedSkills(selectedOptions || []);
    if (formErrors.requiredSkills) setFormErrors(prev => ({ ...prev, requiredSkills: null }));
    // initialDataAppliedRef.current = true; // Similar to handleChange
  };

  const validateForm = () => {
    const errors = {};
    if (!title.trim()) errors.title = "Title is required.";
    if (!description.trim()) errors.description = "Description is required.";
    // Example: if (selectedSkills.length === 0) errors.requiredSkills = "At least one skill is recommended.";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
        toast.error("Please fill in all required fields correctly.");
        return;
    }
    const skillsArray = selectedSkills.map(skill => skill.value);
    // Construct the payload with current formData and processed skills
    const payload = {
        title: formData.title,
        description: formData.description,
        isPublic: formData.isPublic,
        requiredSkills: skillsArray
    };
    onSubmit(payload);
  };

  return (
    <Form onSubmit={handleSubmit} className="needs-validation" noValidate>
      <Input
        label="Project Title"
        name="title"
        value={title} // Use formData.title
        onChange={handleChange}
        placeholder="Enter project title"
        error={formErrors.title}
        required
        className="mb-3"
      />
      <TextArea
        label="Project Description"
        name="description"
        value={description} // Use formData.description
        onChange={handleChange}
        placeholder="Describe your project in detail"
        rows={5}
        error={formErrors.description}
        required
        className="mb-3"
      />
      <Select
        label="Required Skills"
        name="skills"
        options={skillOptions}
        value={selectedSkills}
        onChange={handleSkillsChange}
        placeholder="Select required skills..."
        isMulti
        error={formErrors.requiredSkills} // This assumes your Select component can show an error
        className="mb-3"
      />
      
      <Form.Group className="mb-3" controlId="projectFormIsPublicSwitch"> {/* Changed controlId for clarity */}
        <Form.Check
          type="switch"
          id="isPublic" // Keep id for the label's htmlFor if Form.Group doesn't auto-link switches well
          name="isPublic"
          label="Make project public (visible to everyone)"
          checked={isPublic} // Use formData.isPublic
          onChange={handleChange}
          className="text-template-dark"
        />
      </Form.Group>

      <RBButton type="submit" variant="primary" size="lg" className="w-100 btn-h12" disabled={isLoading}>
        {isLoading ? 'Submitting...' : submitButtonText}
      </RBButton>
    </Form>
  );
};

export default ProjectForm;