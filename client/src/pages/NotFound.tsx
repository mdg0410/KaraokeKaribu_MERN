import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="text-center py-10">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Página no encontrada</h2>
      <p className="text-gray-600 mb-8">
        Lo sentimos, la página que estás buscando no existe.
      </p>
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </div>
  )
}

export default NotFoundPage
