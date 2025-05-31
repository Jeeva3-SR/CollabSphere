import React from 'react';
import Badge from 'react-bootstrap/Badge';
import { TagFill } from 'react-bootstrap-icons'; // Example using Bootstrap Icons

const SkillTag = ({ skill, className = '' }) => {
  return (
    // Using Badge component for tags, bg-template-accent is a custom class
    // text-template-dark is also custom. Bootstrap's default badge text is light on dark bg.
    <Badge 
        pill 
        className={`d-inline-flex align-items-center px-2 py-1 fw-medium bg-template-accent text-template-dark ${className}`}
        // style={{fontSize: '0.75rem'}} // text-xs from template
    >
      <TagFill size={12} className="me-1 text-primary" /> {/* text-primary to match template icon color */}
      {skill}
    </Badge>
  );
};

export default SkillTag;