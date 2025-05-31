import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getProjects } from '../services/projectService';
import ProjectCard from '../components/project/ProjectCard'; // Bootstrap-ified Card
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import ReactSelect from 'react-select'; // For skill filter
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import RBButton from 'react-bootstrap/Button';
import Pagination from 'react-bootstrap/Pagination';
import { FunnelFill } from 'react-bootstrap-icons';
import { CollectionPlayFill, PlusCircleFill } from 'react-bootstrap-icons';

const skillOptions = [ // Same as before
  { value: '', label: 'All Skills' }, { value: 'javascript', label: 'JavaScript' },
  { value: 'react', label: 'React' }, { value: 'node.js', label: 'Node.js' },
  // ... more skills
];

const ProjectFeedPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const initialSkillValue = searchParams.get('skill') || '';
  const initialSkillOption = skillOptions.find(s => s.value === initialSkillValue) || skillOptions[0];
  const [selectedSkill, setSelectedSkill] = useState(initialSkillOption);
  
  const searchTerm = searchParams.get('search') || ''; // For navbar search integration

  const fetchProjects = useCallback(async (page = 1, skill = '', term = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 9,listType:'explore' };
      if (skill) params.skill = skill;
      if (term) params.search = term; // Backend needs to support general search
      
      const data = await getProjects(params);
      setProjects(data.projects);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
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
    const skillQuery = searchParams.get('skill') || '';
    const termQuery = searchParams.get('search') || '';
    const pageQuery = parseInt(searchParams.get('page') || '1');

    setSelectedSkill(skillOptions.find(s => s.value === skillQuery) || skillOptions[0]);
    setCurrentPage(pageQuery);
    fetchProjects(pageQuery, skillQuery, termQuery);
  }, [searchParams, fetchProjects]);


  const handleSkillFilterChange = (selectedOption) => {
    setSelectedSkill(selectedOption);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', '1'); // Reset to first page
    if (selectedOption && selectedOption.value) {
      newSearchParams.set('skill', selectedOption.value);
    } else {
      newSearchParams.delete('skill');
    }
    setSearchParams(newSearchParams);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', newPage.toString());
        setSearchParams(newSearchParams);
    }
  };

  // Pagination items
  let paginationItems = [];
  if (totalPages > 1) {
    paginationItems.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />);
    for (let number = 1; number <= totalPages; number++) {
        // Basic pagination, can be improved for many pages (e.g., ellipsis)
        if (totalPages <= 7 || (number === 1 || number === totalPages || Math.abs(number - currentPage) <= 1) || (currentPage <=3 && number <=4) || (currentPage >= totalPages -2 && number >= totalPages-3)) {
             paginationItems.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                {number}
                </Pagination.Item>,
            );
        } else if (paginationItems[paginationItems.length-1].key !== 'ellipsis_start' && number < currentPage && currentPage > 4) {
             paginationItems.push(<Pagination.Ellipsis key="ellipsis_start" disabled />);
        } else if (paginationItems[paginationItems.length-1].key !== 'ellipsis_end' && number > currentPage && currentPage < totalPages - 3) {
             paginationItems.push(<Pagination.Ellipsis key="ellipsis_end" disabled />);
        }
    }
    paginationItems.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />);
  }


  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-4">
        <Row className="mb-4 align-items-center px-2">
            <Col>
                <h1 className="h2 text-template-dark fw-bolder mb-1">Discover Projects</h1>
                <p className="text-template-muted">
                Explore projects from the CollabSphere community. Find opportunities to collaborate and contribute your skills.
                </p>
            </Col>
            <Col xs="auto">
            
                 <RBButton as={Link} to="/create-project" variant="primary" className="btn-h10">
                     <PlusCircleFill size={18} className="me-2"/>Create New Project
                </RBButton>
            </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-4 p-3 border-top border-bottom align-items-center gx-2">
            <Col xs="auto" className="d-flex align-items-center text-template-dark fw-medium">
                <FunnelFill size={20} className="me-2 text-template-muted"/>
                Filter by Skill:
            </Col>
            <Col md={4} sm={6} xs={12}>
                <ReactSelect
                    options={skillOptions}
                    value={selectedSkill}
                    onChange={handleSkillFilterChange}
                    className="text-sm basic-single"
                    classNamePrefix="react-select"
                    styles={{ 
                        control: (base) => ({ ...base, minHeight: '38px', height: '38px', borderRadius: '0.375rem' }),
                        valueContainer: (base) => ({...base, height: '38px', padding: '0 6px'}),
                        indicatorsContainer:(base) => ({...base, height: '38px'})
                    }}
                />
            </Col>
            {/* TODO: Add more filters (e.g., based on template buttons) here if needed */}
        </Row>

        {loading && <div className="text-center p-5"><LoadingSpinner size="lg" /></div>}
        {error && <div className="alert alert-danger text-center">{error}</div>}
        
        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-5">
            <p className="h5 text-template-muted mb-2">No projects found.</p>
            <p className="text-template-muted">Try adjusting your filters or check back later.</p>
            { (selectedSkill.value || searchTerm) && 
                <RBButton 
                    variant="link"
                    onClick={() => {
                        setSelectedSkill(skillOptions[0]);
                        setSearchParams({}); 
                    }}
                    className="mt-3 text-primary"
                >
                    Clear Filters
                </RBButton>
            }
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            <Row xs={1} sm={2} lg={3} className="g-3 g-md-4"> {/* Gap from template was 3 or 6 */}
              {projects.map(project => (
                <Col key={project._id}><ProjectCard project={project} /></Col>
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
  );
};

export default ProjectFeedPage;