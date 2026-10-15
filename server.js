const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir la carpeta actual (donde está index.html)
app.use(express.static(__dirname));

// Conexión a MongoDB Atlas mediante variable de entorno
 
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://usuario:password@cluster0.xyz.mongodb.net/junta_db?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Conectado Exitosamente'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Esquema de Socios
const SocioSchema = new mongoose.Schema({
  nombre: String,
  dni: String,
  telefono: String,
  aportes: [Number], // Array de 12 meses
});

// Esquema de Préstamos
const PrestamoSchema = new mongoose.Schema({
  socioId: String,
  monto: Number,
  tasa: Number,
  mesInicio: Number,
  interesesCobrados: Number,
  estado: String,
});

const Socio = mongoose.model('Socio', SocioSchema);
const Prestamo = mongoose.model('Prestamo', PrestamoSchema);

// --- RUTAS API ---

// Obtener todos los socios
app.get('/api/socios', async (req, res) => {
  try {
    const socios = await Socio.find();
    res.json(socios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener socios' });
  }
});

// Guardar nuevo socio
app.post('/api/socios', async (req, res) => {
  try {
    const nuevoSocio = new Socio({
      ...req.body,
      aportes: req.body.aportes || Array(12).fill(0)
    });
    await nuevoSocio.save();
    res.json(nuevoSocio);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar socio' });
  }
});

// Actualizar aportes de un socio
app.put('/api/socios/:id/aportes', async (req, res) => {
  try {
    const { id } = req.params;
    const { aportes } = req.body;
    const socio = await Socio.findByIdAndUpdate(id, { aportes }, { new: true });
    res.json(socio);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar aportes' });
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

// RUTA PRINCIPAL: Servir la página web visual (index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Puerto de ejecución
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
