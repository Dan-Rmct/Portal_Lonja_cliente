import { api } from '../services/api.js';

// Autenticación: el token (JWT que emitió la API) vive en una cookie httpOnly del cliente.
// Se le pregunta a la API quién es; si no lo reconoce, se manda al login.
export const rutaProteger = async (req, res, next) => {
  const token = req.cookies._token;
  if (!token) return res.redirect('/');

  const r = await api('/auth/me', { token });
  if (!r.ok) return res.clearCookie('_token').redirect('/');

  req.token = token;
  req.usuario = r.data;
  res.locals.usuario = r.data;
  next();
};

// El portal es solo para compradores (rol "usuario")
export const soloComprador = (req, res, next) => {
  if (req.usuario.rol !== 'usuario') {
    return res.status(403).render('error', { titulo: 'Acceso denegado', mensaje: 'Este portal es solo para compradores.' });
  }
  next();
};