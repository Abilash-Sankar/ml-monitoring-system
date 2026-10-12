import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import PredictionStudio from './pages/PredictionStudio';
import PredictionHistory from './pages/PredictionHistory';
import ModelInformation from './pages/ModelInformation';
import Monitoring from './pages/Monitoring';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="app__main">
        <Topbar />
        <main className="app__content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/predict" element={<PredictionStudio />} />
            <Route path="/history" element={<PredictionHistory />} />
            <Route path="/model" element={<ModelInformation />} />
            <Route path="/monitoring" element={<Monitoring />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
