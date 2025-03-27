const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container-app">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Karaoke Karibu</h2>
            <p className="text-gray-300 mt-2">Tu lugar para cantar y disfrutar</p>
          </div>
          <div className="mt-4 md:mt-0">
            <p>&copy; {new Date().getFullYear()} Karaoke Karibu. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
