import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>📍 Crowdwatch</Link>
      <div style={styles.links}>
        {user ? (
          <>
            <span style={styles.username}>@{user.username}</span>
            <Link to="/submit" style={styles.link}>Report Incident</Link>
            <button onClick={logout} style={styles.logoutBtn}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/signup" style={styles.link}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', background: '#1a1a2e', color: '#fff' },
  brand: { color: '#e94560', fontWeight: 700, fontSize: 20, textDecoration: 'none' },
  links: { display: 'flex', alignItems: 'center', gap: 16 },
  link: { color: '#fff', textDecoration: 'none', fontSize: 14 },
  username: { color: '#aaa', fontSize: 13 },
  logoutBtn: { background: 'none', border: '1px solid #e94560', color: '#e94560',
               padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
};
