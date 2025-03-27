import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container-app py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-display font-bold">
          Karaoke Karibu
        </Link>
        <div className="space-x-6">
          <Link to="/" className="hover:text-primary-100">Inicio</Link>
          <Link to="/about" className="hover:text-primary-100">Nosotros</Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
