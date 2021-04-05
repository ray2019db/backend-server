var express = require('express');
var bcrypt = require('bcryptjs');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();

var Usuario = require('../models/usuario');

// Obtener todos los usuarios
app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0; //A partir de donde voy a mostrar y si no viene nada es 0
    desde = Number(desde); //Tiene que ser un valor numérico

    Usuario.find({}, 'nombre email img role') //obtiene solo estos campos de todos los usuarios
        .skip(desde) //A partir de donde voy a comenzar a buscar
        .limit(5) //Cantidad de usuarios que quiero mostrar
        .exec((err, usuarios) => { //Ejecuta la func de flecha y todo lo que está adentro
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error cargando Usuarios',
                    errors: err
                });
            }
            Usuario.countDocuments({}, (err, totalUsuarios) => { //Cuenta el total de usuarios de la colección

                res.status(200).json({
                    ok: true,
                    usuarios: usuarios,
                    total: totalUsuarios
                });
            });
        });
});

// Actualizar usuario
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (err, usuario) => {
        if (err) { //Si existe un error
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }
        if (!usuario) { //Si el usuario viene vacío o incompleto
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un usuario con ese id: ' + id,
                errors: { message: 'No existe un usuario con ese ID' }
            });
        }
        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;
        usuario.img = body.img;

        usuario.save((err, usuarioGuardado) => {
            if (err) { //Si existe un error
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar usuario',
                    errors: err
                });
            }
            usuarioGuardado.password = ':)';
            res.status(200).json({
                ok: true,
                usuario: usuarioGuardado,
                usuarioToken: req.usuario
            });

        });
    });
});


// Crear un nuevo usuario
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    var body = req.body;
    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10), //encriptar password
        img: body.img,
        role: body.role
    });
    usuario.save((err, usuarioGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear usuario',
                errors: err
            });
        }
        usuarioGuardado.password = ':)'; //Para no mostrar el password

        res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            usuarioToken: req.usuario
        });
    });

});


// Eliminar un usuario por el id
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
        if (err) { //Si existe un error
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al Eliminar usuario',
                errors: err
            });
        }
        if (!usuarioBorrado) { //Si no existe un usuario con ese id
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un usuario con ese id',
                errors: { message: 'Error no existe un usuario con ese id' }
            });
        }

        res.status(200).json({
            ok: true,
            usuario: usuarioBorrado,
            usuarioToken: req.usuario
        });


    });
});

module.exports = app;