const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/junta_db';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Conectado Exitosamente'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Esquema de Socios con Aportes Históricos por Año y Detalle Mensual
const SocioSchema = new mongoose.Schema({
  nombre: String,
  dni: String,
  telefono: String,
  // Objeto con totales por año: { "2023": 100, "2024": 1200, "2025": 1200, "2026": 500 }
  aportesAnuales: {
    type: Map,
    of: Number,
    default: {}
  },
  // Matriz de aportes mensuales del año en curso
  aportesMensuales: {
    type: Map,
    of: [Number],
    default: {}
  }
});

const PrestamoSchema = new mongoose.Schema({
  socioId: String,
  monto: Number,
  tasa: Number,
  mesInicio: Number,
  anio: { type: Number, default: 2026 },
  interesesCobrados: Number,
  estado: { type: String, default: 'Activo' }
});

const Socio = mongoose.model('Socio', SocioSchema);
const Prestamo = mongoose.model('Prestamo', PrestamoSchema);

// RUTAS API

// Obtener socios
app.get('/api/socios', async (req, res) => {
  try {
    const socios = await Socio.find();
    res.json(socios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener socios' });
  }
});

// Crear socio con aportes históricos iniciales
app.post('/api/socios', async (req, res) => {
  try {
    const nuevoSocio = new Socio(req.body);
    await nuevoSocio.save();
    res.json(nuevoSocio);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar socio' });
  }
});

// Actualizar aportes anuales de un socio
app.put('/api/socios/:id/aportes-anuales', async (req, res) => {
  try {
    const { id } = req.params;
    const { aportesAnuales } = req.body;
    const socio = await Socio.findByIdAndUpdate(id, { aportesAnuales }, { new: true });
    res.json(socio);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar aportes anuales' });
  }
});

// Actualizar aportes mensuales
app.put('/api/socios/:id/aportes-mensuales', async (req, res) => {
  try {
    const { id } = req.params;
    const { anio, aportes } = req.body;
    const socio = await Socio.findById(id);
    if (!socio.aportesMensuales) socio.aportesMensuales = new Map();
    
    socio.aportesMensuales.set(anio.toString(), aportes);
    
    // Actualizar el total anual del año
    const totalAnio = aportes.reduce((a, b) => a + b, 0);
    if (!socio.aportesAnuales) socio.aportesAnuales = new Map();
    socio.aportesAnuales.set(anio.toString(), totalAnio);

    await socio.save();
    res.json(socio);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar aportes mensuales' });
  }
});

// Eliminar socio
app.delete('/api/socios/:id', async (req, res) => {
  try {
    await Socio.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Socio eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar socio' });
  }
});

// Obtener préstamos
app.get('/api/prestamos', async (req, res) => {
  try {
    const prestamos = await Prestamo.find();
    res.json(prestamos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener préstamos' });
  }
});

// Guardar préstamo
app.post('/api/prestamos', async (req, res) => {
  try {
    const nuevoPrestamo = new Prestamo(req.body);
    await nuevoPrestamo.save();
    res.json(nuevoPrestamo);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar préstamo' });
  }
});

// Servir la web visual
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
