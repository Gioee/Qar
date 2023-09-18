const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const client = new MongoClient(process.env.URI);
const qar = client.db(process.env.DB_NAME);
const utenti = qar.collection('utenti');
const coordinate = qar.collection('coordinate');
const veicoli = qar.collection('veicoli');

const nuovoUtente = async (nome, email, password, hash) => {
  await utenti.insertOne({
    nome,
    email,
    password,
    hash,
  });
};

const verificaPassword = async (email, password) => {
  const res = await utenti.findOne({
    email,
  });

  if (res === null) return false;

  const hashedPassword = await bcrypt.hash(password, res.hash);

  return hashedPassword.localeCompare(res.password);
};

const ultimeCoordinate = async () => coordinate.find().toArray();
const veicoliDB = async () => veicoli.find().toArray();

module.exports = {
  nuovoUtente,
  ultimeCoordinate,
  verificaPassword,
  veicoliDB,
};
