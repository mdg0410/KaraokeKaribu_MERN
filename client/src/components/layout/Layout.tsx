import Navbar from './Navbar'
import Footer from './Footer'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container-app py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
