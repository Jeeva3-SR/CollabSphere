import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { // Check for undefined, as null can be a valid initial state for user
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;