import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.email, form.password, form.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create account</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="text" placeholder="Username"
            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          <input style={styles.input} type="email" placeholder="Email"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Password"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p style={styles.footer}>Have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center',
               minHeight: '80vh', background: '#f5f5f5' },
  card: { background: '#fff', padding: 32, borderRadius: 8, width: 360,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)' },
  title: { marginBottom: 20, color: '#1a1a2e' },
  input: { display: 'block', width: '100%', marginBottom: 12, padding: '10px 12px',
           border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' },
  btn: { width: '100%', padding: '10px', background: '#e94560', color: '#fff',
         border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15 },
  error: { background: '#fff0f0', color: '#c0392b', padding: '8px 12px',
           borderRadius: 4, marginBottom: 12, fontSize: 13 },
  footer: { marginTop: 16, fontSize: 13, textAlign: 'center', color: '#666' },
};
