import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AppShell from "./components/AppShell"
import { AppDataProvider } from "./context/AppDataContext"
import Customers from "./pages/Customers"
import Dashboard from "./pages/Dashboard"
import Earnings from "./pages/Earnings"
import Inventory from "./pages/Inventory"
import Ledger from "./pages/Ledger"
import Operations from "./pages/Operations"

function App() {
  return (
    <BrowserRouter>
      <AppDataProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/ledger/:id" element={<Ledger />} />
            <Route path="/borrow" element={<Navigate to="/operations" replace />} />
          </Routes>
        </AppShell>
      </AppDataProvider>
    </BrowserRouter>
  )
}

export default App
