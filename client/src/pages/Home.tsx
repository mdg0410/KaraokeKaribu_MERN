const HomePage = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Bienvenido a Karaoke Karibu</h1>
      <p className="text-lg text-gray-700">
        Tu plataforma para disfrutar de la mejor experiencia de karaoke online.
      </p>
      <div className="mt-8">
        <button className="btn btn-primary mr-4">
          Explorar canciones
        </button>
        <button className="btn bg-gray-200 hover:bg-gray-300">
          Más información
        </button>
      </div>
    </div>
  )
}

export default HomePage
