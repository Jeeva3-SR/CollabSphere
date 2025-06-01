import React from 'react';
import Badge from 'react-bootstrap/Badge';
import { TagFill } from 'react-bootstrap-icons';

const SkillTag = ({ skill, className = '' }) => {
  return (
    <Badge 
        pill 
        className={`d-inline-flex align-items-center px-2 py-1 fw-medium bg-template-accent text-template-dark ${className}`}
    >
      <TagFill size={12} className="me-1 text-primary" /> 
      {skill}
    </Badge>
  );
};

export default SkillTag;