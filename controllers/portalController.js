import { api, mensajes } from '../services/api.js';
import { aVista } from '../helpers/formato.js';

const volver = (res, ruta, msg, esError = false) =>
  res.redirect(`${ruta}?${esError ? 'error' : 'mensaje'}=${encodeURIComponent(msg)}`);

// La API responde 404 + codigo SIN_PERFIL cuando el usuario aún no captura sus datos de comprador
const sinPerfil = (r) => r.status === 404 && r.data?.codigo === 'SIN_PERFIL';

// ---------- Mis datos ----------
export const verPerfil = async (req, res) => {
  const r = await api('/portal/perfil', { token: req.token });
  res.render('portal/perfil', {
    titulo: 'Mis datos',
    registro: r.ok ? r.data : { nombre: req.usuario.nombre.slice(0, 15) },
    nuevo: !r.ok, errores: [], mensaje: req.query.mensaje || null,
  });
};

export const guardarPerfil = async (req, res) => {
  const { nombre, apellido_paterno, apellido_materno, direccion } = req.body;
  const r = await api('/portal/perfil', {
    method: 'PUT', token: req.token, body: { nombre, apellido_paterno, apellido_materno, direccion },
  });

  // 201 = comprador creado (primera vez), 200 = actualizado
  if (r.ok) return res.redirect(r.status === 201 ? '/portal/comprar' : '/portal/perfil?mensaje=' + encodeURIComponent('Datos actualizados'));

  const previo = await api('/portal/perfil', { token: req.token });
  res.status(r.status === 422 ? 422 : 400).render('portal/perfil', {
    titulo: 'Mis datos', registro: req.body, nuevo: !previo.ok, errores: mensajes(r), mensaje: null,
  });
};

// ---------- Comprar ----------
export const verCatalogo = async (req, res) => {
  const r = await api('/portal/catalogo', { token: req.token });
  if (sinPerfil(r)) return res.redirect('/portal/perfil');
  res.render('portal/comprar', {
    titulo: 'Comprar', lotes: r.data, mensaje: req.query.mensaje || null, error: req.query.error || null,
  });
};

export const comprar = async (req, res) => {
  const r = await api('/portal/compras', { method: 'POST', token: req.token, body: { id_lte: req.params.id } });
  if (sinPerfil(r)) return res.redirect('/portal/perfil');
  if (!r.ok) return volver(res, '/portal/comprar', mensajes(r)[0], true);
  return volver(res, '/portal/historial', `Compraste el lote #${r.data.id_cmp}`);
};

// ---------- Historial ----------
export const historial = async (req, res) => {
  const r = await api('/portal/compras', { token: req.token, query: { desde: req.query.desde, hasta: req.query.hasta } });
  if (sinPerfil(r)) return res.redirect('/portal/perfil');
  const { compras, total, desde, hasta } = r.data;
  res.render('portal/historial', {
    titulo: 'Historial de compras', compras, total, desde: desde || '', hasta: hasta || '',
    mensaje: req.query.mensaje || null,
  });
};

// ---------- Reporte por periodo ----------
const pedirReporte = (req) =>
  api('/portal/reporte', { token: req.token, query: { desde: req.query.desde, hasta: req.query.hasta } });

export const reporte = async (req, res) => {
  const vista = {
    titulo: 'Reporte de compras', comprador: null, desde: '', hasta: '', hayRango: false, error: null,
    compras: [], totalKilos: 0, totalImporte: 0, generado: aVista(new Date()),
  };

  if (req.query.desde || req.query.hasta) {
    const r = await pedirReporte(req);
    if (sinPerfil(r)) return res.redirect('/portal/perfil');
    if (r.ok) Object.assign(vista, r.data, { hayRango: true });
    else vista.error = mensajes(r)[0];
  }
  res.render('portal/reporte', vista);
};

// Mismo reporte en CSV (se abre directo en Excel)
export const reporteCsv = async (req, res) => {
  const r = await pedirReporte(req);
  if (sinPerfil(r)) return res.redirect('/portal/perfil');
  if (!r.ok) return res.redirect('/portal/reporte');

  const { desde, hasta, compras } = r.data;
  const celda = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = [['Compra', 'Fecha', 'Especies', 'Kilos', 'Precio por kilo', 'Total']];
  for (const c of compras) {
    filas.push([
      c.id_cmp, aVista(c.fecha), c.lote.especies.map((e) => e.nombre).join(', '),
      c.lote.kilos, c.precio_kilo_final, c.precio_total,
    ]);
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="compras_${desde}_a_${hasta}.csv"`);
  res.send('\uFEFF' + filas.map((f) => f.map(celda).join(',')).join('\r\n'));
};