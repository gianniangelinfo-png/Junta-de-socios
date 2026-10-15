const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas mediante variable de entorno
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Conectado'))
  .catch(err => console.error('Error MongoDB:', err));

// Esquemas
const SocioSchema = new mongoose.Schema({
  nombre: String,
  dni: String,
  telefono: String,
  aportes: [Number], // Array de 12 meses
});

const PrestamoSchema = new mongoose.Schema({
  socioId: String,
  monto: Number,
  tasa: Number,
  interesesCobrados: Number,
  estado: String,
});

const Socio = mongoose.model('Socio', SocioSchema);
const Prestamo = mongoose.model('Prestamo', PrestamoSchema);

// Rutas CRUD
app.get('/api/socios', async (req, res) => {
  const socios = await Socio.find();
  res.json(socios);
});

app.post('/api/socios', async (req, res) => {
  const nuevoSocio = new Socio(req.body);
  await nuevoSocio.save();
  res.json(nuevoSocio);
});

app.put('/api/socios/:id/aportes', async (req, res) => {
  const { id } = req.params;
  const { aportes } = req.body;
  const socio = await Socio.findByIdAndUpdate(id, { aportes }, { new: true });
  res.json(socio);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
