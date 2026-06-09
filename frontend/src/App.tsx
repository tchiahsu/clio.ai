import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ShellLayout from './components/layout/ShellLayout';
import Dashboard from './components/features/Dashboard';
import Accounts from './components/features/Accounts';
import Transactions from './components/features/Transactions';
import Budgets from './components/features/Budget';
import Statements from './components/features/Statements';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <ShellLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/statements" element={<Statements />} />
        </Routes>
      </ShellLayout>
    </BrowserRouter>
  );
}

export default App;