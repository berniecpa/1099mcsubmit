import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Recipients from './pages/Recipients';
import RecipientForm from './pages/RecipientForm';
import Forms from './pages/Forms';
import FormCreate from './pages/FormCreate';
import FormDetail from './pages/FormDetail';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="recipients" element={<Recipients />} />
          <Route path="recipients/new" element={<RecipientForm />} />
          <Route path="recipients/:id/edit" element={<RecipientForm />} />
          <Route path="forms" element={<Forms />} />
          <Route path="forms/new" element={<FormCreate />} />
          <Route path="forms/:id" element={<FormDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
