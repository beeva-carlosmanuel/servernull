/**
 * Editar la home (/index.html)
 * Usamos promesas para gestionar mejor las peticiones asíncronas y organizar mejor el código de las peticiones a AWS SDK
 * Una mejor organización de código puede ser la creación de una clase con las diferentes peticiones.
 * Gestión de promesas: https://docs.aws.amazon.com/es_es/sdk-for-javascript/v2/developer-guide/using-promises.html
 */

/**
 * Error: The provided token has expired.
 * @returns {undefined}
 */
function expiredToken() {
  console.log('User signed out.');
  // window.location.replace("/");
}

 /**
  * Obtenemos las entidades HTML del html guardado para poderlo mostrar en CKEditor.
  */
function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {

  this.$onInit = function () {
    const permisos = getAccess(); // auth.js
    $scope.bucket = bucket; // config.js

    // ----------------------------------------------------------------------------------------------------
    // HOME: Leemos el fichero /index.html
    const keyHome = 'index.html';
    var fileParams = {Bucket: $scope.bucket, Key: keyHome};
    var reqGetIndex = new AWS.S3().getObject(fileParams, function (errGetObject, fileDataContentTypes) {});
    var promiseGetIndex = reqGetIndex.promise(); // create the promise object

    // Manejamos los estados completado/rechazado de la promesa
    promiseGetIndex.then(
      function(fileData) {
        var content = fileData.Body.toString('utf-8');
        // $scope.htmlCode = htmlEntities(content);
        $scope.htmlCode = content;
        $scope.$apply();

        // CKEDITOR (lo cargamos después de meter el contenido en el textarea)
        CKEDITOR.replace('htmlCode', {
          fullPage: true,
          extraPlugins: 'docprops',
          // Deshabilitamos el filtro de contenido porque si usamos el modo de página completa, probablemente
          // queremos libremente meter cualquier contenido en modo source sin limitaciones.
          allowedContent: true,
          height: 640
        });
      },
      function(errGetObject) {
        if (debug) console.log('El fichero ' + keyHome + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        expiredToken();
      }
    );
  }

  /**
   * SUBMIT FORMULARIO:
   * Guardamos el fichero index.html de la home.
   */
  $scope.submit = function () {
    const permisos = getAccess(); // auth.js
    $scope.bucket = bucket; // config.js

    // ----------------------------------------------------------------------------------------------------
    // HOME: Guardamos en el fichero /index.html
    // ----------------------------------------------------------------------------------------------------
    const keyHome = 'index.html';
    var now = new Date();
    var nextweek = new Date(now.getFullYear(), now.getMonth(), now.getDate()+30);

    // PAKO - DEFLATE FILE
    // https://github.com/nodeca/pako
    var pako = window.pako;
    // Para usar pako.deflate, debemos indicarlo en putObject el atributo ContentEncoding con el valor deflate
    var htmlData = pako.deflate($scope.htmlCode);
    var paramsHTMLObject = { 
      Bucket: $scope.bucket, 
      Key: keyHome, 
      Body: htmlData, 
      ContentType: "text/html", 
      ContentEncoding: "deflate", 
      Expires: nextweek,
      CacheControl: "max-age=2592000", // 30 dias: 60 * 60 * 24 * 30
    };

    var reqPutIndex = new AWS.S3().putObject(paramsHTMLObject, function (errSavingFile, dataPutObject) {});
    var promisePutIndex = reqPutIndex.promise(); // create the promise object
    // Manejamos los estados completado/rechazado de la promesa
    promisePutIndex.then(
      function(dataPutObject) {
        if (debug) console.log('%c HTML ', 'background: #222; color: #bada55', 'guardado correctamente en ' + keyHome);
      },
      function(errSavingFile) {
        if (debug) console.log('El fichero HTML ' + keyHome + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log('Error guardando el fichero')
        if (debug) console.log(errSavingFile);
      }
    );
  };
});