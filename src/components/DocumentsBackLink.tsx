import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const REVIEWER_ROLES = new Set(['engineer_2', 'engineer_3', 'engineer_4']);

/** Back to Documents hub for Engineer II / III / IV. */
export function DocumentsBackLink() {
  const { user } = useAuth();
  if (!user || !REVIEWER_ROLES.has(user.role)) return null;

  return (
    <Link
      to="/reports"
      className="mb-3 inline-flex text-sm font-medium text-text-muted transition hover:text-primary"
    >
      ← Documents
    </Link>
  );
}
