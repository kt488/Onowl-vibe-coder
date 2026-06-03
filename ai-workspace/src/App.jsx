import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <Dashboard />
    </div>
  )
}

export default App
