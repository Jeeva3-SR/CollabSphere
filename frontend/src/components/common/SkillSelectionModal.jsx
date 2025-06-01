import { useState, useEffect, useMemo } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import RBButton from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card'; 
import { XCircleFill, Search, TagFill, CheckCircleFill as CheckIcon } from 'react-bootstrap-icons'; 

const SkillSelectionModal = ({
  show,
  handleClose,
  onSkillsConfirm,
  initialSelectedSkills = [], 
  allSkillOptions = []       
}) => {
  const [modalSelectedSkills, setModalSelectedSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (show) {
      setModalSelectedSkills([...initialSelectedSkills]);
      setSearchTerm('');
    }
  }, [show, initialSelectedSkills]);

  const handleToggleSkill = (skillOption) => {
    setModalSelectedSkills(prevSkills => {
      const isAlreadySelected = prevSkills.some(s => s.value === skillOption.value);
      if (isAlreadySelected) {
        return prevSkills.filter(s => s.value !== skillOption.value);
      } else {
        return [...prevSkills, skillOption];
      }
    });
  };

  const handleConfirm = () => {
    onSkillsConfirm([...modalSelectedSkills]);
    handleClose();
  };

  const groupedAndFilteredOptions = useMemo(() => {
    const groups = {};
    const optionsToFilter = searchTerm
      ? allSkillOptions.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (option.category && option.category.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : allSkillOptions;

    optionsToFilter.forEach(option => {
      const category = option.category || 'Other'; 
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(option);
    });
    return groups;
  }, [searchTerm, allSkillOptions]);

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered backdrop="static" scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="h5 text-template-dark d-flex align-items-center">
            <TagFill size={22} className="me-2 text-primary" /> Select Your Skills
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
        <Form.Group className="mb-3 sticky-top bg-white py-2" style={{zIndex: 1}}> 
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0 rounded-start-pill">
              <Search size={18} className="text-muted"/>
            </span>
            <Form.Control
              type="text"
              placeholder="Search skills or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0 rounded-end-pill shadow-none"
            />
          </div>
        </Form.Group>
        <div className="mb-3 p-3 border rounded-3 bg-light shadow-sm" style={{ minHeight: '80px' }}>
          <h6 className="small text-muted mb-2 fw-semibold">
            Selected Skills ({modalSelectedSkills.length}):
          </h6>
          {modalSelectedSkills.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {modalSelectedSkills.map(skill => (
                <Badge
                  key={`selected-modal-${skill.value}`}
                  pill
                  bg="primary"
                  text="white"
                  className="d-flex align-items-center py-2 px-3 fs-6" 
                  style={{ cursor: 'default' }}
                >
                  {skill.label}
                  <XCircleFill
                    size={18}
                    className="ms-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleSkill(skill)} 
                    title={`Remove ${skill.label}`}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <p className="small text-muted mb-0 fst-italic">No skills selected. Click on skills below to add.</p>
          )}
        </div>

        <div className="overflow-auto flex-grow-1">
          {Object.keys(groupedAndFilteredOptions).length > 0 ? 
            Object.entries(groupedAndFilteredOptions).map(([category, skillsInCategory]) => (
            <Card key={category} className="mb-3 shadow-sm border-light">
              <Card.Header className="bg-light-subtle py-2 px-3">
                <h6 className="mb-0 text-template-dark fw-semibold">{category}</h6>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="d-flex flex-wrap gap-2">
                  {skillsInCategory.map(option => {
                    const isSelected = modalSelectedSkills.some(s => s.value === option.value);
                    return (
                      <RBButton
                        key={option.value}
                        variant={isSelected ? "primary" : "outline-secondary"}
                        size="sm"
                        onClick={() => handleToggleSkill(option)}
                        className={`rounded-pill d-flex align-items-center px-3 py-1 btn-skill-pill ${isSelected ? "active" : ""}`}
                        title={isSelected ? `Remove ${option.label}` : `Add ${option.label}`}
                      >
                        {option.label}
                        {isSelected && <CheckIcon size={16} className="ms-2" />}
                      </RBButton>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          )) : (
             <div className="text-center text-muted py-5">
                <h5>No skills match your search.</h5>
                <p className="small">Try a different search term or clear the search.</p>
             </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-top-0">
        <RBButton variant="outline-secondary" onClick={handleClose} className="px-4">
          Cancel
        </RBButton>
        <RBButton variant="primary" onClick={handleConfirm} className="px-4">
          Confirm ({modalSelectedSkills.length}) Skills
        </RBButton>
      </Modal.Footer>
    </Modal>
  );
};

export default SkillSelectionModal;