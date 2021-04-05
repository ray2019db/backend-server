var express = require('express');

var fileUpload = require('express-fileupload'); //Importar el módulo express-fileupload

var fs = require('fs'); //Importar el File System no hay que instalarlo con npm ya está incorporado por defecto

var app = express();


var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

app.use(fileUpload()); //Implementar el Middleware

app.put('/:tipo/:id', (req, res, next) => { //Se usa PUT y no POST porque la imagen debería existir y estás actualizando, puede ser POST también

    var tipo = req.params.tipo; //Almacena de quién es la imágen (usuario, hospital o médico)
    var id = req.params.id; //Almacena el id del usuario que guarda la imagen

    // tipos de colección
    var tiposValidos = ['usuarios', 'medicos', 'hospitales'];

    if (tiposValidos.indexOf(tipo) < 0) { //Si no existe un tipo de colección válida devolverá -1 y se cumplirá la condición
        return res.status(400).json({ //Si no hay un tipo de colección válida seleccionada retorna el siguiente mensaje de error
            ok: false,
            mensaje: 'No es una colección válida',
            errors: { message: 'Debe seleccionar una colección válida' }
        });
    }

    if (!req.files) { //Si no hay un archivo seleccionado
        return res.status(400).json({ //Si no hay archivo seleccionado retorna el siguiente mensaje de error
            ok: false,
            mensaje: 'No hay archivo seleccionado',
            errors: { message: 'Debe seleccionar un archivo de imagen' }
        });
    }
    // Obtener nombre del archivo
    var archivo = req.files.imagen; //Almacena el archivo con todas sus propiedades (nombre, extensión, tamaño, etc)
    var nombreSepPorPuntos = archivo.name.split('.'); //Almacena en un array el nombre del archivo separado donde hay punto
    var extArchivo = nombreSepPorPuntos[nombreSepPorPuntos.length - 1]; //Almacena la extensión del archivo que es la última posición del array

    // Extensiones de imágenes aceptadas
    var extPermitidas = ['jpg', 'jpeg', 'png', 'gif']; //Extensiones válidas o tipo de imágenes permitidas

    if (extPermitidas.indexOf(extArchivo) < 0) { //Si no existe un tipo de ext permitida devolverá -1 y se cumplirá la condición
        return res.status(400).json({ //Si se cumple la condición devolverá el sgte mensaje de error
            ok: false,
            mensaje: 'Extensión no válida',
            errors: { message: 'Las extesiones válidas son: ' + extPermitidas.join(', ') }
        });
    }

    // Crear un nombre de archivo personalizado ej: 26458483474835-543.jpg
    var nombreArchivo = `${id}-${new Date().getMilliseconds()}.${extArchivo}`;

    // Crear una ruta para almacenar las imágenes
    var path = `./uploads/${tipo}/${nombreArchivo}`;

    // Mover el archivo de un temporal al path
    archivo.mv(path, err => {
        if (err) {
            return res.status(500).json({ //Si hay un error devolverá el sgte mensaje de error
                ok: false,
                mensaje: 'Error al mover el archivo',
                errors: err
            });
        }
        subirPorTipo(tipo, id, nombreArchivo, res);
    });

});

function subirPorTipo(tipo, id, nombreArchivo, res) {

    if (tipo === 'usuarios') {
        Usuario.findById(id, (err, usuario) => {
            var pathViejo = './uploads/usuarios/' + usuario.img; // usuario.img => almacena el nombre de la imagen de ese usuario guardada anteriormente
            if (fs.existsSync(pathViejo)) { //Si el pathViejo existe
                fs.unlink(pathViejo); //Elimina el pathViejo junto al archivo existente en ese path
            }
            usuario.img = nombreArchivo; //Almaceno el nuevo nombre del archivo en la propiedad img del usuario en cuestión
            usuario.save((err, usuarioActualizado) => {
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de usuario actualizada',
                    usuario: usuarioActualizado
                });

            });
        });
    }
    if (tipo === 'medicos') {

    }
    if (tipo === 'hospitales') {

    }

}

module.exports = app;