import{Link} from 'react-router-dom';
import AnimatedLogo from './AnimatedLogo';
const Logo = ({ user }) => (
  <Link
    to={user ? "/dashboard" : "/"}
    className="navbar-brand d-flex align-items-center gap-2 text-decoration-none"
  >
    <AnimatedLogo />
    <h2
      className="h5 fw-bold mb-0"
      style={{
        letterSpacing: "-0.015em",
        background:
          "linear-gradient(90deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      CollabSphere
    </h2>
  </Link>
);

export default Logo;