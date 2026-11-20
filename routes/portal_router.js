import express from 'express';
import {
  verPerfil, guardarPerfil, verCatalogo, comprar, historial, reporte, reporteCsv,
} from '../controllers/portalController.js';

const router = express.Router(); // ya viene protegido (rutaProteger + soloComprador) desde index.js
router.get('/', (req, res) => res.redirect('/portal/comprar'));
router.get('/perfil', verPerfil);
router.post('/perfil', guardarPerfil);
router.get('/comprar', verCatalogo);
router.post('/comprar/:id', comprar);
router.get('/historial', historial);
router.get('/reporte', reporte);
router.get('/reporte.csv', reporteCsv);

export default router;