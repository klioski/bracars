import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import CarDetail from './pages/CarDetail'
import CarForm from './pages/CarForm'
import SellCar from './pages/SellCar'
import Sales from './pages/Sales'
import Users from './pages/admin/Users'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>
      } />
      <Route path="/inventory/new" element={
        <ProtectedRoute><Layout><CarForm /></Layout></ProtectedRoute>
      } />
      <Route path="/inventory/:id" element={
        <ProtectedRoute><Layout><CarDetail /></Layout></ProtectedRoute>
      } />
      <Route path="/inventory/:id/edit" element={
        <ProtectedRoute><Layout><CarForm /></Layout></ProtectedRoute>
      } />
      <Route path="/inventory/:id/sell" element={
        <ProtectedRoute><Layout><SellCar /></Layout></ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute><Layout><Sales /></Layout></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute adminOnly><Layout><Users /></Layout></ProtectedRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
