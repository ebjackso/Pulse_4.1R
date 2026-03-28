import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { LoadingSpinner } from './components/Common';
import { useAuthStore } from './stores/authStore';
import './index.css';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const MapExplorer = lazy(() => import('./pages/MapExplorer'));
const MyReports = lazy(() => import('./pages/MyReports'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <Router>
      <MainLayout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapExplorer />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </Router>
  );
}

export default App;
