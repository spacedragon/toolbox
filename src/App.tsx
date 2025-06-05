import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import LogViewerPage from './pages/LogViewerPage';
import JsonFormatterPage from './pages/JsonFormatterPage';
import Base64ToolPage from './pages/Base64ToolPage';
import UrlToolPage from './pages/UrlToolPage';
import HashGeneratorPage from './pages/HashGeneratorPage';
import DiskLensPage from './pages/DiskLensPage'; // Adjust path if necessary

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools/log-viewer" element={<LogViewerPage />} />
        <Route path="/tools/json-formatter" element={<JsonFormatterPage />} />
        <Route path="/tools/base64-encoder" element={<Base64ToolPage />} />
        <Route path="/tools/url-encoder" element={<UrlToolPage />} />
        <Route path="/tools/hash-generator" element={<HashGeneratorPage />} />
        <Route path="/tools/disk-lens" element={<DiskLensPage />} />
      </Routes>
    </Router>
  );
}

export default App;