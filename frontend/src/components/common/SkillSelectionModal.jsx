import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import RBButton from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form'; // For Checkboxes
import Badge from 'react-bootstrap/Badge'; // For clickable badges (alternative to checkboxes)
import { CheckSquareFill, Square } from 'react-bootstrap-icons'; // Icons for selection state

const SkillSelectionModal = ({
  show,
  handleClose,
  onSkillsConfirm,
  initialSelectedSkills = [], // Array of {value, label} objects from RegisterPage
  allSkillOptions = []       // Array of all {value, label} skill options
}) => {
  // This state holds the skill *objects* {value, label} currently selected in the modal
  const [currentModalSelection, setCurrentModalSelection] = useState([]);

  // When the modal is shown or initial skills change, update the modal's internal selection
  useEffect(() => {
    if (show) {
      // initialSelectedSkills from RegisterPage is already an array of {value, label}
      setCurrentModalSelection(initialSelectedSkills);
    }
  }, [show, initialSelectedSkills]);

  const handleConfirm = () => {
    onSkillsConfirm(currentModalSelection); // Pass the array of {value, label} objects back
    handleClose();
  };

  const toggleSkillSelection = (skillObject) => {
    setCurrentModalSelection(prevSelectedSkills => {
      const isAlreadySelected = prevSelectedSkills.some(s => s.value === skillObject.value);
      if (isAlreadySelected) {
        return prevSelectedSkills.filter(s => s.value !== skillObject.value);
      } else {
        return [...prevSelectedSkills, skillObject];
      }
    });
  };

  // Optional: Search/Filter functionality for the list
  const [searchTerm, setSearchTerm] = useState('');
  const filteredSkillOptions = allSkillOptions.filter(skill =>
    skill.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title className="h5 text-template-dark">Select Your Skills</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}> {/* Scrollable body */}
        <p className="text-template-muted small mb-3">
          Click on the skills below to select or deselect them.
        </p>

        {/* Optional Search Bar for Skills */}
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control-sm rounded-pill" // Smaller search bar
          />
        </Form.Group>

        <div className="d-flex flex-wrap gap-2"> {/* Use flex-wrap to display skills */}
          {filteredSkillOptions.length > 0 ? (
            filteredSkillOptions.map(skillObj => {
              const isSelected = currentModalSelection.some(s => s.value === skillObj.value);
              return (
                // Option 1: Clickable Badges (more visual)
                <Badge
                  key={skillObj.value}
                  pill
                  bg={isSelected ? 'primary' : 'light'} // Bootstrap primary for selected, light for unselected
                  text={isSelected ? 'white' : 'dark'}
                  onClick={() => toggleSkillSelection(skillObj)}
                  className="p-2 px-3 cursor-pointer skill-badge-selectable user-select-none" // user-select-none to prevent text selection on click
                  style={{fontSize: '0.9rem'}}
                >
                  {isSelected ? <CheckSquareFill size={14} className="me-1" /> : <Square size={14} className="me-1 text-black-50" />}
                  {skillObj.label}
                </Badge>

                // Option 2: Checkboxes (more traditional form element)
                /*
                <Form.Check
                  type="checkbox"
                  key={skillObj.value}
                  id={`skill-checkbox-${skillObj.value}`}
                  label={skillObj.label}
                  checked={isSelected}
                  onChange={() => toggleSkillSelection(skillObj)}
                  className="me-3 mb-2" // Spacing for checkboxes
                />
                */
              );
            })
          ) : (
            <p className="text-template-muted">No skills match your search.</p>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <RBButton variant="outline-secondary" onClick={handleClose} className="btn-h10">
            Cancel
        </RBButton>
        <RBButton variant="primary" onClick={handleConfirm} className="btn-h10 bg-template-accent text-template-dark fw-bold border-0">
          Confirm Skills
        </RBButton>
      </Modal.Footer>
    </Modal>
  );
};

export default SkillSelectionModal;