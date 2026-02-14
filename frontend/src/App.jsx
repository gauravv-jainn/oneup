import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout/AppLayout';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Components from './pages/Components';
import PCBs from './pages/PCBs';
import Production from './pages/Production';
import Analytics from './pages/Analytics';
import Procurement from './pages/Procurement';
import FutureOrders from './pages/FutureOrders';
import ImportExport from './pages/ImportExport';
import Admin from './pages/Admin';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/components" element={<Components />} />
          <Route path="/pcbs" element={<PCBs />} />
          <Route path="/production" element={<Production />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/future-orders" element={<FutureOrders />} />
          <Route path="/import-export" element={<ImportExport />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
