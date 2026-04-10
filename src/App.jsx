import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import Shell from './components/Shell.jsx'
import Landing from './pages/Landing.jsx'
import { getTool } from './tools/registry.js'

function ToolRoute() {
  const { slug } = useParams()
  const tool = getTool(slug)
  if (!tool) return <Navigate to="/" replace />

  const Component = tool.component
  return (
    <Shell toolName={tool.name} toolAccent={tool.accent}>
      <Component />
    </Shell>
  )
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Shell>
            <Landing />
          </Shell>
        }
      />
      <Route path="/tools/:slug" element={<ToolRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
