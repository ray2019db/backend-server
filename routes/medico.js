var express = require('express');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();

var Medico = require('../models/medico');

// Obtener todos los Médicos
app.get('/', (req, res) => {

    var desde = req.query.desde || 0; //Valor a partir de donde voy a mostrar y si no viene nada es 0
    desde = Number(desde); //Tiene que ser un valor numérico

    Medico.find({}) //Obtener todos los médicos
        .skip(desde) //A partir de donde voy a comenzar a buscar
        .limit(5) //Cantidad de médicos que quiero mostrar
        .populate('usuario', 'nombre email') //Obtener nombre y email del usuario que creó cada médico
        .populate('hospital') //Obtener todos los datos del hospital al cual pertenece cada médico
        .exec((err, medicos) => { //Ejecuta la func de flecha y todo lo que está adentro
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error cargando Médicos',
                    errors: err
                });
            }
            Medico.countDocuments({}, (err, totalMedicos) => { //Cuenta el total de médicos de la colección

                res.status(200).json({
                    ok: true,
                    medicos: medicos,
                    total: totalMedicos
                });
            });
        });
});

// Crear un nuevo Médico
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    var body = req.body;
    var medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id,
        hospital: body.hospital
    });
    medico.save((err, medicoGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear médico',
                errors: err
            });
        }
        res.status(201).json({
            ok: true,
            medico: medicoGuardado
        });
    });
});

// Actualizar medico
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Medico.findById(id, (err, medico) => {
        if (err) { //Si existe un error
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar medico',
                errors: err
            });
        }
        if (!medico) { //Si el medico viene vacío o incompleto
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un medico con ese id: ' + id,
                errors: { message: 'No existe un medico con ese ID' }
            });
        }
        medico.nombre = body.nombre;
        medico.usuario = req.usuario._id;
        medico.hospital = body.hospital;

        medico.save((err, medicoGuardado) => {
            if (err) { //Si existe un error
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar medico',
                    errors: err
                });
            }
            res.status(200).json({
                ok: true,
                medico: medicoGuardado
            });

        });
    });
});

// Eliminar un Médico por el id
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {
        if (err) { //Si existe un error
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al Eliminar Médico',
                errors: err
            });
        }
        if (!medicoBorrado) { //Si no existe un medico con ese id
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un Médico con ese id',
                errors: { message: 'Error no existe un Médico con ese id' }
            });
        }

        res.status(200).json({
            ok: true,
            medico: medicoBorrado
        });
    });
});


module.exports = app;