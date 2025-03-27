import { Routes, Route } from 'react-router-dom'
import HomePage from '@pages/Home'
import AboutPage from '@pages/About'
import NotFoundPage from '@pages/NotFound'
import Layout from '@components/layout/Layout'
import './App.css'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

export default App
