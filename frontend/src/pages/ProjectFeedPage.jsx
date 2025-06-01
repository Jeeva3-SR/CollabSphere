import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getProjects } from '../services/projectService';
import ProjectCard from '../components/project/ProjectCard'; 
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import RBButton from 'react-bootstrap/Button';
import Pagination from 'react-bootstrap/Pagination';
import Badge from 'react-bootstrap/Badge';
import { FunnelFill, PlusCircleFill, TagFill, XCircleFill } from 'react-bootstrap-icons';
import SkillSelectionModal from '../components/common/SkillSelectionModal';
import { skillOptions as allSkillOptions } from '../utils/constants'; 

const ProjectFeedPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSkills, setFilterSkills] = useState([]); 
  const [showSkillModal, setShowSkillModal] = useState(false);
  
  const searchTermFromURL = searchParams.get('search') || ''; 

  const fetchProjects = useCallback(async (page = 1, skillValue = '', term = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 9, listType:'explore' }; 
      if (skillValue) params.skill = skillValue;
      if (term) params.search = term;
      
      const data = await getProjects(params);
      setProjects(data.projects || []);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      const message = err.response?.data?.message || "Could not load projects.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const skillQueryValue = searchParams.get('skill') || '';
    const termQuery = searchParams.get('search') || '';
    const pageQuery = parseInt(searchParams.get('page') || '1');

    if (skillQueryValue) {
        const skillObject = allSkillOptions.find(s => s.value === skillQueryValue);
        if (skillObject) {
            setFilterSkills([skillObject]); 
        } else {
            setFilterSkills([]);
        }
    } else {
        setFilterSkills([]);
    }
    setCurrentPage(pageQuery);
    fetchProjects(pageQuery, skillQueryValue, termQuery);
  }, [searchParams, fetchProjects]); 

  const handleSkillFilterUpdate = (skillsFromModal) => {
    const newSelectedSkill = skillsFromModal.length > 0 ? skillsFromModal[0] : null;
    setFilterSkills(newSelectedSkill ? [newSelectedSkill] : []);

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', '1'); 
    if (newSelectedSkill && newSelectedSkill.value) {
      newSearchParams.set('skill', newSelectedSkill.value);
    } else {
      newSearchParams.delete('skill');
    }
    setSearchParams(newSearchParams);
    setShowSkillModal(false); 
  };
  
  const clearSkillFilter = () => {
    setFilterSkills([]);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', '1');
    newSearchParams.delete('skill');
    setSearchParams(newSearchParams);
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', newPage.toString());
        setSearchParams(newSearchParams);
    }
  };

  let paginationItems = [];
  if (totalPages > 1) {
    paginationItems.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />);
    for (let number = 1; number <= totalPages; number++) {
        if (totalPages <= 7 || (number === 1 || number === totalPages || Math.abs(number - currentPage) <= 1) || (currentPage <=3 && number <=4) || (currentPage >= totalPages -2 && number >= totalPages-3)) {
             paginationItems.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                {number}
                </Pagination.Item>,
            );
        } else if (paginationItems.length > 0 && paginationItems[paginationItems.length-1].key !== 'ellipsis_start' && number < currentPage && currentPage > 4) {
             paginationItems.push(<Pagination.Ellipsis key="ellipsis_start" disabled />);
        } else if (paginationItems.length > 0 && paginationItems[paginationItems.length-1].key !== 'ellipsis_end' && number > currentPage && currentPage < totalPages - 3) {
             paginationItems.push(<Pagination.Ellipsis key="ellipsis_end" disabled />);
        }
    }
    paginationItems.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />);
  }

  const currentSkillFilterLabel = filterSkills.length > 0 ? filterSkills[0].label : "All Skills";

  return (
    <>
      <Container fluid="lg" className="py-4 py-md-5 px-md-4">
          <Row className="mb-4 align-items-center px-2">
              <Col>
                  <h1 className="h2 text-template-dark fw-bolder mb-1">Discover Projects</h1>
                  <p className="text-template-muted">
                  Explore projects from the CollabSphere community. Find opportunities to collaborate and contribute your skills.
                  </p>
              </Col>
              <Col xs="auto">
                  <RBButton as={Link} to="/create-project" variant="primary" className="btn-h10 d-flex align-items-center">
                       <PlusCircleFill size={18} className="me-2"/>Create New Project
                  </RBButton>
              </Col>
          </Row>
          <Row className="mb-4 p-3 border-top border-bottom align-items-center gx-2">
              <Col xs="auto" className="d-flex align-items-center text-template-dark fw-medium">
                  <FunnelFill size={20} className="me-2 text-template-muted"/>
                  Filter by Skill:
              </Col>
              <Col md={4} sm={6} xs={12}>
                  {filterSkills.length > 0 ? (
                    <Badge 
                        pill 
                        bg="primary-subtle" 
                        text="primary-emphasis" 
                        className="d-inline-flex align-items-center p-2 border border-primary-subtle me-2 fs-6 cursor-pointer"
                        onClick={() => setShowSkillModal(true)}
                        title="Click to change filter"
                    >
                        <TagFill size={14} className="me-1"/> {currentSkillFilterLabel}
                        <XCircleFill 
                          size={18}
                          className="ms-2 opacity-75 hover-opacity-100" 
                          onClick={(e) => { e.stopPropagation(); clearSkillFilter();}}
                          style={{cursor: 'pointer'}}
                          title={`Clear filter: ${currentSkillFilterLabel}`}
                        />
                    </Badge>
                  ) : (
                    <RBButton 
                        variant="outline-secondary" 
                        onClick={() => setShowSkillModal(true)} 
                        className="btn-h10 d-flex align-items-center justify-content-center"
                        title="Select skills to filter by"
                    >
                        <TagFill size={16} className="me-2"/> Select Skills ...
                    </RBButton>
                  )}
              </Col>
            
          </Row>

          {loading && <div className="text-center p-5"><LoadingSpinner size="lg" /></div>}
          {error && <div className="alert alert-danger text-center">{error}</div>}
          
          {!loading && !error && projects.length === 0 && (
            <div className="text-center py-5">
              <p className="h5 text-template-muted mb-2">No projects found matching your criteria.</p>
              <p className="text-template-muted">Try a different skill or clear the filter.</p>
              { (filterSkills.length > 0 || searchTermFromURL) && 
                  <RBButton 
                      variant="link"
                      onClick={() => {
                          clearSkillFilter();
                          const newSearchParams = new URLSearchParams(searchParams);
                          newSearchParams.delete('search');
                          setSearchParams(newSearchParams);
                      }}
                      className="mt-3 text-primary"
                  >
                      Clear All Filters & Search
                  </RBButton>
              }
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <>
              <Row xs={1} sm={2} lg={3} className="g-3 g-md-4">
                {projects.map(project => (
                  <Col key={project._id} className="d-flex align-items-stretch"><ProjectCard project={project} /></Col>
                ))}
              </Row>

              {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4 pt-2">
                      <Pagination>{paginationItems}</Pagination>
                  </div>
              )}
            </>
          )}
      </Container>

      <SkillSelectionModal
        show={showSkillModal}
        handleClose={() => setShowSkillModal(false)}
        onSkillsConfirm={handleSkillFilterUpdate}
        initialSelectedSkills={filterSkills} 
        allSkillOptions={allSkillOptions}    
      />
    </>
  );
};

export default ProjectFeedPage;