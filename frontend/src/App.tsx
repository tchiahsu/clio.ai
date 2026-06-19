import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StatementProvider } from './context/StatementContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ShellLayout from './components/layout/ShellLayout';
import Login from './components/features/Login';
import Dashboard from './components/features/Dashboard';
import Accounts from './components/features/Accounts';
import Transactions from './components/features/Transactions';
import Budgets from './components/features/Budget';
import Statements from './components/features/Statements';
import Categories from './components/features/Categories';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected — requires a valid session. StatementProvider only mounts
              once authenticated, so its data fetches never 401. */}
          <Route element={<ProtectedRoute />}>
            <Route element={<StatementProvider><ShellLayout /></StatementProvider>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/statements" element={<Statements />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
