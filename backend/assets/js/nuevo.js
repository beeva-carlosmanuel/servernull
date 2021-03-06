/**
 * Comprueba y recupera las credenciales de la sesión
 * @returns {Boolean}
 */
function getCredentials() {
  var debug = false;
  if (typeof (Storage) !== "undefined") {
    if (sessionStorage.accessKeyId && sessionStorage.secretAccessKey && sessionStorage.sessionToken && sessionStorage.expired) {
      var region = sessionStorage.region; // https://goo.gl/CLhMq3
      var credsData = {
        accessKeyId: sessionStorage.accessKeyId,
        secretAccessKey: sessionStorage.secretAccessKey,
        sessionToken: sessionStorage.sessionToken,
        expireTime: sessionStorage.expireTime,
        expired: sessionStorage.expired
      };
      var creds = new AWS.Credentials(credsData);
      AWS.config.update({region: region, credentials: creds});
      if (debug) console.log('Acceso condecido como administrador.');
      return true;
    }
  }
}

/**
 * Obtiene el valor de una variable pasada por GET
 * @param {type} variable
 * @returns {getQueryVariable.pair}
 */
function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  } 
  alert('Query Variable ' + variable + ' not found');
}

/**
 * Error: The provided token has expired.
 * @returns {undefined}
 */
function expiredToken() {
  sessionStorage.accessKeyId = "";
  sessionStorage.secretAccessKey = "";
  sessionStorage.sessionToken = "";
  sessionStorage.expired = "";
  console.log('User signed out.');
  window.location.replace("/home/index.html");
}

const debug = true;
const tengoAcceso = getCredentials();

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {
  
  this.$onInit = function () {
    $scope.bucket = sessionStorage.bucket;
    $scope.key = 'private/content-types/json/content-types.json';
    
    s3 = new AWS.S3();
    var fileParams = { Bucket: $scope.bucket, Key: $scope.key };
    s3.getObject(fileParams, function (errGetObject, data) {
      if (errGetObject) {
        if (debug) console.log('Error al leer  ' + $scope.key + ' o no tiene permisos.');
        if (debug) console.log(errGetObject);
        window.location.replace("/home/index.html");
        expiredToken();
      } else {
        var file = JSON.parse(data.Body.toString('utf-8'));
        $scope.cts = file;
        $scope.id = "";
        $scope.name = "";
        $scope.fields = [];
        $scope.tpl = "";
        $scope.css = "";
        $scope.$apply();
      }
    });
  }

  // SUBMIT FORMULARIO: guardamos los datos del tipo de contenido
  $scope.submit = function () {
    if ($scope.id !== "" && $scope.name !== "" && $scope.description !== "" ) {
      const nuevo = {"id": $scope.id, "name": $scope.name, "description": $scope.description, "fields": [{"id": "title", "name": "Título", "type": "title", "value": ""}], "tpl": "", "css": ""};
      $scope.cts.push(nuevo);
      const file = JSON.stringify($scope.cts);

       // (Buffer, Typed Array, Blob, String, ReadableStream) Object data.
      s3 = new AWS.S3();
      var paramsObject = { Bucket: $scope.bucket, Key: $scope.key, Body: file };
      s3.putObject(paramsObject, function (errSavingFile, dataPutObject) {
        if (errSavingFile) {
          if (debug) console.log('El fichero ' + $scope.key + ' NO existe en el bucket o no tiene permisos.');
          if (debug) console.log('Error guardando el fichero')
          if (debug) console.log(errSavingFile);
          expiredToken();
        } else {
          if (debug) console.log('Fichero guardado correctamente');
          if (debug) console.log(dataPutObject);
        }
      });
    } else {
      alert("Debe rellenar los campos obligatorios.");
    }
  };
});