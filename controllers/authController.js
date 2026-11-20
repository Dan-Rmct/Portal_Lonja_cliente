import { api, mensajes } from '../services/api.js';

const vistaLogin = (res, errores = [], mensaje = null) =>
  res.render('login/login', { titulo: 'Iniciar sesión', mensaje, errores });

const vistaRegistro = (res, persona = null, errores = []) =>
  res.render('login/loginformulario', { titulo: 'Registro', persona, errores });

export const login = (req, res) => vistaLogin(res);

export const verRegistro = (req, res) => vistaRegistro(res);

export const registrologin = async (req, res) => {
  const { nombre, email, password, password2 } = req.body;
  const r = await api('/auth/registro', { method: 'POST', body: { nombre, email, password, password2 } });
  if (!r.ok) return vistaRegistro(res, req.body, mensajes(r));

  res.render('login/confirmacion', {
    titulo: 'Registro',
    pagina: 'Revisa tu correo',
    mensaje: 'Te enviamos un enlace para confirmar tu cuenta. Al confirmarlo ya podrás iniciar sesión.',
    enlace: '/',
  });
};

// El correo apunta al cliente (URL_CLIENTE/confirmarinscripcion/:token); el cliente le pide a la API que confirme
export const confirmarIncripcionEnlace = async (req, res) => {
  const r = await api(`/auth/confirmar/${encodeURIComponent(req.params.token)}`, { method: 'POST' });
  if (!r.ok) {
    return res.render('login/confirmacion', {
      titulo: 'Confirmación',
      pagina: 'No se pudo confirmar tu cuenta',
      mensaje: 'El enlace no es válido o ya fue utilizado.',
      enlace: '/',
    });
  }
  res.render('login/confirmacion', {
    titulo: 'Confirmación',
    pagina: 'Cuenta confirmada',
    mensaje: 'Tu correo fue confirmado. Ya puedes iniciar sesión.',
    enlace: '/',
  });
};

export const credenciales = async (req, res) => {
  const { email, password } = req.body;
  const r = await api('/auth/login', { method: 'POST', body: { email, password } });

  if (!r.ok) {
    return vistaLogin(res, mensajes(r).map((msg) => ({ msg })), r.status === 403 ? 'Acceso denegado' : 'Credenciales no válidas');
  }
  if (r.data.usuario.rol !== 'usuario') {
    return vistaLogin(res, [{ msg: 'Este portal es solo para compradores' }], 'Acceso denegado');
  }

  return res
    .cookie('_token', r.data.token, {
      httpOnly: true, // no accesible desde JavaScript del navegador
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', // true cuando haya HTTPS
      maxAge: 2 * 60 * 60 * 1000, // 2 horas (igual que la expiración del JWT)
    })
    .redirect('/portal/comprar');
};

export const cerrarsesion = (req, res) => {
  res.clearCookie('_token', { httpOnly: true, sameSite: 'lax' });
  return res.redirect('/');
};