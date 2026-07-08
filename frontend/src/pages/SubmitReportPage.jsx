import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '../services/reports.service';
import { mediaService } from '../services/media.service';

const CATEGORIES = ['fire', 'flood', 'accident', 'crime', 'other'];

export default function SubmitReportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'other', lat: '', lng: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  // Get the user's current GPS coordinates from the browser.
  const useMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => { setError('Could not get location.'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Create the report
      const report = await reportsService.create({
        title: form.title,
        description: form.description,
        category: form.category,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
      });

      // Step 2: If user attached a photo, upload it and link it to the report
      if (file) {
        await mediaService.upload(file, report.id);
      }

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Report an Incident</h2>
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Title</label>
          <input style={styles.input} type="text" placeholder="What happened?"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />

          <label style={styles.label}>Category</label>
          <select style={styles.input} value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label style={styles.label}>Description</label>
          <textarea style={{ ...styles.input, height: 80, resize: 'vertical' }}
            placeholder="Additional details..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />

          <label style={styles.label}>Location</label>
          <div style={styles.locationRow}>
            <input style={{ ...styles.input, flex: 1, marginBottom: 0 }} type="number"
              placeholder="Latitude" value={form.lat} step="any"
              onChange={e => setForm({ ...form, lat: e.target.value })} required />
            <input style={{ ...styles.input, flex: 1, marginBottom: 0 }} type="number"
              placeholder="Longitude" value={form.lng} step="any"
              onChange={e => setForm({ ...form, lng: e.target.value })} required />
            <button type="button" onClick={useMyLocation} style={styles.locateBtn} disabled={locating}>
              {locating ? '...' : '📍 Use mine'}
            </button>
          </div>

          <label style={{ ...styles.label, marginTop: 12 }}>Photo (optional)</label>
          <input style={styles.fileInput} type="file" accept="image/*,video/*"
            onChange={e => setFile(e.target.files[0])} />

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '32px 16px', background: '#f5f5f5', minHeight: '80vh' },
  card: { background: '#fff', padding: 32, borderRadius: 8, width: '100%', maxWidth: 480,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)', alignSelf: 'flex-start' },
  title: { marginBottom: 20, color: '#1a1a2e' },
  label: { display: 'block', fontSize: 13, color: '#555', marginBottom: 4 },
  input: { display: 'block', width: '100%', marginBottom: 12, padding: '10px 12px',
           border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' },
  locationRow: { display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' },
  locateBtn: { padding: '10px 12px', background: '#1a1a2e', color: '#fff', border: 'none',
               borderRadius: 4, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' },
  fileInput: { display: 'block', marginBottom: 16, fontSize: 13 },
  btn: { width: '100%', padding: 10, background: '#e94560', color: '#fff',
         border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15 },
  error: { background: '#fff0f0', color: '#c0392b', padding: '8px 12px',
           borderRadius: 4, marginBottom: 12, fontSize: 13 },
};
