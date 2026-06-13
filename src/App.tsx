import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import { AppGate } from './components/AppGate'
import { AppLayout } from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import TimeTracker from './pages/TimeTracker'
import Contracts from './pages/Contracts'
import Invoices from './pages/Invoices'
import WorkProtection from './pages/WorkProtection'
import Licenses from './pages/Licenses'
import Hosting from './pages/Hosting'
import WorkRecords from './pages/WorkRecords'
import Clients from './pages/Clients'
import SettingsPage from './pages/Settings'
import SignContractPage from './pages/SignContract'

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppGate>
          <BrowserRouter>
            <Routes>
              <Route path="/sign/:token" element={<SignContractPage />} />
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="time" element={<TimeTracker />} />
                <Route path="contracts" element={<Contracts />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="protection" element={<WorkProtection />} />
                <Route path="licenses" element={<Licenses />} />
                <Route path="hosting" element={<Hosting />} />
                <Route path="records" element={<WorkRecords />} />
                <Route path="clients" element={<Clients />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppGate>
      </StoreProvider>
    </AuthProvider>
  )
}
