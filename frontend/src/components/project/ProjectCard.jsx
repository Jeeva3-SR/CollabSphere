// frontend/src/components/project/ProjectCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../user/UserAvatar';
import SkillTag from './SkillTag';
import Card from 'react-bootstrap/Card';
import RBButton from 'react-bootstrap/Button';
import { BsArrowUpRightSquare as ViewDetailsIcon } from 'react-icons/bs'; // Using BsArrowUpRightSquare

const ProjectCard = ({ project }) => {
  const placeholderImage = "https://images.unsplash.com/photo-1558021212-51b6ec1e0f03?auto=format&fit=crop&w=500&q=60";
  
  return (
    // Add h-100 to make the card take full height of its Col container
    // Add d-flex flex-column to make the Card.Body also capable of flexing
    <Card className="h-100 shadow-sm hover-shadow-md transition-shadow d-flex flex-column"> 
      <Link to={`/projects/${project._id}`} className="text-decoration-none">
       
      </Link>
      {/* Card.Body also needs to be a flex container to push footer content down */}
      <Card.Body className="d-flex flex-column p-3"> {/* Adjusted padding slightly if needed */}
        <Link to={`/projects/${project._id}`} className="text-decoration-none">
          <Card.Title 
            className="h6 fw-medium text-template-dark mb-1 text-truncate-2-lines" // Ensure this class is defined in index.css
            title={project.title}
            style={{ minHeight: '2.25em' }} // Reserve space for two lines of title to prevent jumpiness
          >
            {project.title}
          </Card.Title>
        </Link>
        <Card.Text 
            className="text-template-muted small mb-2 text-truncate-3-lines flex-grow-1" // text-truncate-3-lines, flex-grow-1
            style={{ minHeight: '3.6em' }} // Reserve space for three lines of description
        >
          {project.description}
        </Card.Text>
        <div className="mb-3"> {/* Skills section */}
          <p className="text-template-muted small fw-medium mb-1" style={{fontSize: '0.75rem'}}>Skills Needed:</p>
          <div className="d-flex flex-wrap gap-1">
            {project.requiredSkills?.slice(0, 3).map((skill, index) => (
              <SkillTag key={index} skill={skill} />
            ))}
            {project.requiredSkills?.length > 3 && (
              <span className="badge bg-light text-dark rounded-pill" style={{fontSize: '0.7rem', padding: '0.25em 0.5em'}}>
                +{project.requiredSkills.length - 3} more
              </span>
            )}
          </div>
        </div>
        {/* mt-auto will push this block to the bottom of the Card.Body (because Card.Body is d-flex flex-column) */}
        <div className="mt-auto"> 
            <div className="d-flex align-items-center justify-content-between small text-template-muted mb-1" style={{fontSize: '0.75rem'}}>
                <span>Owner:</span>
                {project.owner ? (
                     <Link to={`/profile/${project.owner._id}`} className="d-flex align-items-center gap-1 text-decoration-none text-template-muted hover-underline">
                        <UserAvatar user={project.owner} size="xs" />
                        <span className="text-truncate" style={{maxWidth: '100px'}}>{project.owner.name}</span>
                    </Link>
                ) : (
                    <span>N/A</span>
                )}
            </div>
             <div className="d-flex align-items-center justify-content-between small text-template-muted" style={{fontSize: '0.75rem'}}>
                <span>Members:</span>
                <span>{project.teamMembers?.length || 0}</span>
            </div>
            <RBButton
                as={Link}
                to={`/projects/${project._id}`}
                variant="outline-primary"
                size="sm"
                className="w-100 mt-2 d-flex align-items-center justify-content-center btn-h8" // btn-h8 for consistent height
            >
                View Details <ViewDetailsIcon size={16} className="ms-1" />
            </RBButton>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProjectCard;