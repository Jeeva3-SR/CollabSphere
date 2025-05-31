import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getProjects } from '../services/projectService';
import ProjectCard from '../components/project/ProjectCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import RBButton from 'react-bootstrap/Button';
import Pagination from 'react-bootstrap/Pagination';
import { CollectionPlayFill, PlusCircleFill } from 'react-bootstrap-icons';


const MyProjectsPage = () => {
  const { user } = useContext(AuthContext);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const projectsPerPage = 6; // Or your preferred number

  useEffect(() => {
    const fetchMyProjects = async (page = 1) => {
      if (!user?._id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = {
          page,
          limit: projectsPerPage,
          listType: 'myCreated' // Use the new listType
        };
        const data = await getProjects(params);
        setMyProjects(data.projects);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error("Failed to fetch my projects:", err);
        const message = err.response?.data?.message || "Could not load your projects.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProjects(currentPage);
  }, [user, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  // Pagination items logic (can be extracted to a helper)
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

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="alert alert-danger text-center container mt-5">{error}</div>;

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-4">
        <Row className="mb-4 align-items-center px-2">
            <Col>
                <h1 className="h2 text-template-dark fw-bolder mb-1 d-flex align-items-center">
                    <CollectionPlayFill size={30} className="me-2 text-primary" /> My Created Projects
                </h1>
                <p className="text-template-muted">Manage all the projects you have initiated.</p>
            </Col>
            <Col xs="auto">
                 <RBButton as={Link} to="/create-project" variant="primary" className="btn-h10 d-flex align-items-center">
                    <PlusCircleFill size={18} className="me-2"/> Create New Project
                </RBButton>
            </Col>
        </Row>

        {!loading && !error && myProjects.length === 0 && (
          <div className="text-center py-5 bg-light rounded-3 shadow-sm">
            <p className="h5 text-template-muted mb-2">You haven't created any projects yet.</p>
            <RBButton as={Link} to="/create-project" variant="success">
              Start Your First Project
            </RBButton>
          </div>
        )}

        {!loading && !error && myProjects.length > 0 && (
          <>
            <Row xs={1} sm={2} lg={3} className="g-3 g-md-4">
              {myProjects.map(project => (
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

export default MyProjectsPage;