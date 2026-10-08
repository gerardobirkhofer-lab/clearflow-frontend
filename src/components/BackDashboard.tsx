import { Link } from 'react-router-dom';

export default function BackDashboard() {
  return (
    <Link to="/panel" style={box}>Volver al Dashboard</Link>
  );
}

const box = {
  display: 'inline-block',
  background: '#e0e7ff',
  border: '1px solid #818cf8',
  color: '#312e81',
  fontWeight: 800,
  textDecoration: 'none',
  borderRadius: 12,
  padding: '10px 16px',
  fontSize: 14,
};
