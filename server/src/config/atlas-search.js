/**
 * CONFIGURACIÓN DE ATLAS SEARCH
 * 
 * Este archivo contiene la configuración necesaria para crear un índice de Atlas Search.
 * Siga estos pasos para configurar Atlas Search en MongoDB Atlas:
 * 
 * 1. Inicie sesión en MongoDB Atlas
 * 2. Seleccione su clúster
 * 3. Vaya a la pestaña "Search"
 * 4. Haga clic en "Create Index"
 * 5. Seleccione "JSON Editor"
 * 6. Copie la configuración de abajo y péguela en el editor
 * 7. Haga clic en "Next" y nombre el índice como "Index_Songs"
 * 8. Haga clic en "Create Index"
 */

/**
 * Configuración para el índice de Atlas Search
 */
const searchIndexConfig = {
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": [
        {
          "type": "string",
          "analyzer": "lucene.spanish"
        }
      ],
      "artist": [
        {
          "type": "string",
          "analyzer": "lucene.spanish"
        }
      ],
      "code": [
        {
          "type": "number"
        },
        {
          "type": "string"
        }
      ],
      "genre": [
        {
          "type": "string",
          "analyzer": "lucene.spanish"
        }
      ]
    }
  }
};

/**
 * Después de crear el índice, actualice la variable de entorno ATLAS_SEARCH_ENABLED=true
 * en su archivo .env para activar la búsqueda con Atlas Search.
 */

module.exports = searchIndexConfig;
