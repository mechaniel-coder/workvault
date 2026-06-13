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
import ClientPortal from './pages/ClientPortal'
import ClientHub from './pages/ClientHub'
import ClientAppShell from './pages/ClientAppShell'
import ClientDashboard from './pages/ClientDashboard'
import ClientMessages from './pages/ClientMessages'
import ClientReview from './pages/ClientReview'
import DemoShell from './pages/DemoShell'
import DemoInfo from './pages/DemoInfo'
import DemoProject from './pages/DemoProject'
import Pipeline from './pages/Pipeline'
import Proposals from './pages/Proposals'
import Finance from './pages/Finance'
import ScopeLog from './pages/ScopeLog'
import Documents from './pages/Documents'
import Tools from './pages/Tools'
import Subcontractors from './pages/Subcontractors'

function ProtectedApp() {
  return (
    <AppGate>
      <AppLayout />
    </AppGate>
  )
}

const appRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="time" element={<TimeTracker />} />
    <Route path="pipeline" element={<Pipeline />} />
    <Route path="proposals" element={<Proposals />} />
    <Route path="contracts" element={<Contracts />} />
    <Route path="invoices" element={<Invoices />} />
    <Route path="finance" element={<Finance />} />
    <Route path="scope" element={<ScopeLog />} />
    <Route path="documents" element={<Documents />} />
    <Route path="tools" element={<Tools />} />
    <Route path="subcontractors" element={<Subcontractors />} />
    <Route path="protection" element={<WorkProtection />} />
    <Route path="licenses" element={<Licenses />} />
    <Route path="hosting" element={<Hosting />} />
    <Route path="records" element={<WorkRecords />} />
    <Route path="clients" element={<Clients />} />
    <Route path="settings" element={<SettingsPage />} />
  </>
)

const clientAppRoutes = (
  <>
    <Route index element={<ClientDashboard />} />
    <Route path="pipeline" element={<Pipeline />} />
    <Route path="project" element={<DemoProject />} />
    <Route path="review" element={<ClientReview />} />
    <Route path="messages" element={<ClientMessages />} />
    <Route path="proposals" element={<Proposals />} />
    <Route path="contracts" element={<Contracts />} />
    <Route path="invoices" element={<Invoices />} />
    <Route path="documents" element={<Documents />} />
    <Route path="scope" element={<ScopeLog />} />
  </>
)

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/sign/:token" element={<SignContractPage />} />
            <Route path="/portal/:token" element={<ClientPortal />} />
            <Route path="/hub/:token" element={<ClientHub />} />
            <Route path="/client/:token/*" element={<ClientAppShell />}>
              {clientAppRoutes}
            </Route>
            <Route path="/demo/:token/*" element={<DemoShell />}>
              {appRoutes}
              <Route path="project" element={<DemoProject />} />
              <Route path="about" element={<DemoInfo />} />
            </Route>
            <Route element={<ProtectedApp />}>
              {appRoutes}
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  )
}
