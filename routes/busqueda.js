var express = require('express'); //Importa el módulo de express

var app = express();

var Hospital = require('../models/hospital'); //Importa el modelo de hospital

var Medico = require('../models/medico'); //Importa el modelo de médico

var Usuario = require('../models/usuario'); //Importa el modelo de usuario

//==========================================================================================
// Búsqueda específica por colección
//==========================================================================================
app.get('/coleccion/:tabla/:busqueda', (req, res) => {

    var busqueda = req.params.busqueda;
    var tabla = req.params.tabla;
    var expReg = RegExp(busqueda, 'i');
    var promesa;

    switch (tabla) {
        case 'usuarios':
            promesa = buscarUsuarios(busqueda, expReg);
            break;
        case 'medicos':
            promesa = buscarMedicos(busqueda, expReg);
            break;
        case 'hospitales':
            promesa = buscarHospitales(busqueda, expReg);
            break;
        default:
            return res.status(400).json({
                ok: false,
                message: 'Los tipos de búsqueda solo son: usuarios, medicos y hospitales',
                errors: { message: 'Tipo de tabla/colección no válidos' }
            });
    }

    promesa
        .then(respuesta => {
            res.status(200).json({
                ok: true,
                [tabla]: respuesta
            });
        });

});

//================================================================================================
// Búsqueda general de hospitales, médicos y usuarios que coincidan con el término de búsqueda
//================================================================================================

app.get('/todo/:busqueda', (req, res, next) => { //Aquí se define la ruta

    var busqueda = req.params.busqueda; //Término de búsqueda (es busqueda por que así lo definí en la ruta '/todo/:busqueda')
    var expReg = new RegExp(busqueda, 'i'); //Expresión regular para que busque cualquier coincidencia y no sea Casesensitive, la 'i' para buscar cualquier coincidencia

    Promise.all([buscarHospitales(busqueda, expReg), buscarMedicos(busqueda, expReg), buscarUsuarios(busqueda, expReg)]) //Arreglo con todas las promesas
        .then(respuesta => { //En respuesta se almacenan las respuestas de todas las promesas (resolve) cuando estén listas (busca los hospitales, médicos y usuarios)
            res.status(200).json({
                ok: true,
                hospitales: respuesta[0], //Posición del arreglo que ocupa la promesa de buscarHospitales, muestra todos los hospitales encontrados
                medicos: respuesta[1], //Posición del arreglo que ocupa la promesa de buscarMedicos, muestra todos los médicos encontrados
                usuarios: respuesta[2] //Posición del arreglo que ocupa la promesa de buscarUsuarios, muestra todos los usuarios encontrados
            });
        });
});

function buscarHospitales(busqueda, expReg) { //Esta función devolverá una promesa con el resultado de los Hospitales
    return new Promise((resolve, reject) => {
        Hospital.find({ nombre: expReg }) //Busca los hospitales cuyo nombre coincida con el término de búsqueda
            .populate('usuario', 'nombre email') //Muestra el nombre y el email del usuario que creó cada Hospital encontrado
            .exec((err, hospitales) => { //Ejecuta la función de flecha
                if (err) {
                    reject('Error en la búsqueda', err); //Si existe un error devuelve esto
                } else {
                    resolve(hospitales); //Si todo está bien devuelve los hospitales que coincidan con la búsqueda
                }
            });
    });
}

function buscarMedicos(busqueda, expReg) { //Esta función devolverá una promesa con el resultado de los Médicos
    return new Promise((resolve, reject) => {
        Medico.find({ nombre: expReg }) //Busca todos los médicos cuyo nombre coincida con el término de búsqueda
            .populate('usuario', 'nombre email') //Busca el nombre y el email del usuario que creó a cada médico encontrado
            .populate('hospital', 'nombre') //Busca el nombre del hospital al que pertenece cada médico encontrado
            .exec((err, medicos) => { //Ejecuta la sgte función de flecha
                if (err) {
                    reject('Error en la búsqueda', err); //Si existe un error devuelve esto cuando sea llamada la promesa (la función)
                } else {
                    resolve(medicos); //Si todo está bien devuelve los médicos que coincidan con la búsqueda cundo sea llamada la promesa (la función)
                }
            });
    });
}

function buscarUsuarios(busqueda, expReg) { //Esta función devolverá una promesa con el resultado de los Usuarios
    return new Promise((resolve, reject) => {
        Usuario.find({}, 'nombre email role') //Busca todos los usuarios y obtén solo los campos indicados
            .or([{ nombre: expReg }, { email: expReg }]) //De todos los usuarios coge los que coincidan el nombre y el email con el término de búsqueda
            .exec((err, usuarios) => { //Ejecuta esta función de flecha
                if (err) {
                    reject('Error en la búsqueda', err); //Si hay un error devuelve esto
                } else {
                    resolve(usuarios); //Si todo está bien devuelve los usuarios que coinciden con el término de búsqueda
                }
            });
    });
}



module.exports = app; //Exporta el módulo de búsqueda