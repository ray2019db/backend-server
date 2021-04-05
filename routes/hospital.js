var express = require('express');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();

var Hospital = require('../models/hospital');


// Obtener todos los hospitales
app.get('/', (req, res) => {

    var desde = req.query.desde || 0; //A partir de donde voy a mostrar y si no viene nada es 0
    desde = Number(desde); //Tiene que ser un valor numérico

    Hospital.find({}) //Obtener todos los hospitales
        .skip(desde) //A partir de donde voy a comenzar a buscar
        .limit(5) //Cantidad de hospitales que quiero mostrar
        .populate('usuario', 'nombre email') //Obtener nombre y email del usuario que creó el hospital
        .exec((err, hospitales) => { //Ejecuta la func de flecha y todo lo que está adentro
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error cargando Hospitales',
                    errors: err
                });
            }
            Hospital.countDocuments({}, (err, totalHospitales) => { //Cuenta el total de hospitales de la colección
                res.status(200).json({
                    ok: true,
                    hospitales: hospitales,
                    total: totalHospitales
                });
            });

        });

});

// Crear un nuevo hospital
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    var body = req.body;
    var hospital = new Hospital({
        nombre: body.nombre,
        usuario: req.usuario._id
    });
    hospital.save((err, hospitalGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear hospital',
                errors: err
            });
        }
        res.status(201).json({
            ok: true,
            hospital: hospitalGuardado
        });
    });

});

// Actualizar hospital
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Hospital.findById(id, (err, hospital) => {
        if (err) { //Si existe un error
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar hospital',
                errors: err
            });
        }
        if (!hospital) { //Si el hospital viene vacío o incompleto
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un hospital con ese id: ' + id,
                errors: { message: 'No existe un hospital con ese ID' }
            });
        }
        hospital.nombre = body.nombre;
        hospital.usuario = req.usuario._id;

        hospital.save((err, hospitalGuardado) => {
            if (err) { //Si existe un error
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar hospital',
                    errors: err
                });
            }
            res.status(200).json({
                ok: true,
                hospital: hospitalGuardado
            });

        });
    });
});

// Eliminar un Hospital por el id
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Hospital.findByIdAndRemove(id, (err, hospitalBorrado) => {
        if (err) { //Si existe un error
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al Eliminar hospital',
                errors: err
            });
        }
        if (!hospitalBorrado) { //Si no existe un hospital con ese id
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un hospital con ese id',
                errors: { message: 'Error no existe un hospital con ese id' }
            });
        }

        res.status(200).json({
            ok: true,
            hospital: hospitalBorrado
        });


    });
});



module.exports = app;