import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Shops from './pages/Shops';
import Waytones from './pages/Waytones';
import Graphs from './pages/Graphs';
import { ROUTES } from './constants/routes';
import './styles/App.css';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.SHOPS} replace />} />
        <Route path="/asmp" element={<Navigate to={ROUTES.SHOPS} replace />} />
        <Route path={ROUTES.SHOPS} element={<Shops />} />
        <Route path={ROUTES.WAYTONES} element={<Waytones />} />
        <Route path={ROUTES.GRAPHS} element={<Graphs />} />
      </Routes>
    </Layout>
  );
}

export default App;

