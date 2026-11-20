import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import { aInput, aVista, dinero } from './helpers/formato.js';
import { urlPublica } from './services/api.js';
import { rutaProteger, soloComprador } from './middleware/auth.js';
import router_auth from './routes/auth_router.js';
import router_portal from './routes/portal_router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ayudantes disponibles en todas las vistas
app.locals.aInput = aInput;
app.locals.aVista = aVista;
app.locals.dinero = dinero;
app.locals.imgUrl = urlPublica; // imágenes que sirve la API

// Carpeta pública y Bootstrap
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));

// Routing
app.use('/', router_auth);
app.use('/portal', rutaProteger, soloComprador, router_portal);

// 404 y errores
app.use((req, res) => res.status(404).render('error', { titulo: 'No encontrado', mensaje: 'La página no existe.' }));
app.use((err, req, res, next) => {
  console.error(err);
  const apiCaida = err.message === 'fetch failed' || err.cause?.code === 'ECONNREFUSED';
  res.status(apiCaida ? 503 : 500).render('error', {
    titulo: apiCaida ? 'Servicio no disponible' : 'Error',
    mensaje: apiCaida
      ? 'No se pudo conectar con el servidor de la Lonja. Inténtalo de nuevo en unos minutos.'
      : 'Ocurrió un error interno del servidor.',
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Lonja cliente en http://localhost:${port}`));