require('dotenv').config();

const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const fs = require('fs');

const db = require('./utility/db');
const initializePassport = require('./utility/passport-config');

initializePassport(passport);

const app = express();

app.set('view-engine', 'ejs');
app.use(express.static(path.join(__dirname, '/assets')));
app.use(express.urlencoded({ extended: false }));

app.get('/coordinate', async (req, res) => {
  const coor = await db.ultimeCoordinate();
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(coor);
});

app.get('/veicoli', async (req, res) => {
  const veicoli = await db.veicoliDB();
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(veicoli);
});

app.get('/video', (req, res) => {
  const { range } = req.headers;
  if (!range) {
    res.status(400).send('Requires Range header');
  }
  const videoPath = './assets/demo/demo.mp4';
  const videoSize = fs.statSync(videoPath).size;
  const CHUNK_SIZE = 10 ** 6;
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
  };
  res.writeHead(206, headers);
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
});

app.get('/:pagina', (req, res) => {
  const pagina = req.params.pagina.toLowerCase();

  console.log(pagina);

  res.setHeader('Content-Type', 'text/html; charset=UTF-8');

  let monitoraggio = '';
  let storico = '';
  let impostazioni = '';
  let profilo = '';
  let altro = false;

  switch (pagina) {
    case 'monitoraggio':
      monitoraggio = 'active';
      break;
    case 'storico':
      storico = 'active';
      break;
    case 'impostazioni':
      impostazioni = 'active';
      break;
    case 'profilo':
      profilo = 'active';
      break;
    case 'accesso':
    case 'registrazione':
      altro = true;
      break;
    default:
      res.status(404).send('La pagina è inesistente');
  }

  if ((monitoraggio || storico || impostazioni || profilo) === 'active' || altro) {
    res.render(`./${pagina}.ejs`, {
      titolo: pagina.charAt(0).toUpperCase() + pagina.slice(1),
      monitoraggio,
      storico,
      impostazioni,
      profilo,
    });
  }

  res.end();
});

app.post('/accesso', async (req, res) => {
  if ((await db.verificaPassword(req.body.email, req.body.password)) === 0) {
    res.redirect('/monitoraggio');
  } else {
    res.redirect('/accesso');
  }
});

app.post('/registrazione', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    await db.nuovoUtente(req.body.nome, req.body.email, hashedPassword, salt);
    res.redirect('/monitoraggio');
  } catch (error) {
    console.error(error);
    res.redirect('/registrazione');
  }
});

app.listen(process.env.PORT);

console.log('Server attivo');
