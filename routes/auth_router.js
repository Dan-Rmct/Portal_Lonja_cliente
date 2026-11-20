import express from 'express';
import {
  login, verRegistro, registrologin, confirmarIncripcionEnlace, credenciales, cerrarsesion,
} from '../controllers/authController.js';
import { rutaProteger } from '../middleware/auth.js';

const router = express.Router();

router.get('/', login);
router.get('/ver_registro', verRegistro);
router.post('/registrar_login', registrologin);
router.get('/confirmarinscripcion/:token', confirmarIncripcionEnlace);
router.post('/credenciales', credenciales);
router.get('/inicio', rutaProteger, (req, res) => res.redirect('/portal/comprar'));
router.get('/cerrarsesion', cerrarsesion);

export default router;