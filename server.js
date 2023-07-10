const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { Pool } = require('pg');

const app = express();
const port = 3030;

const pool = new Pool({
	user: 'bpf',
	host: 'dpg-cikh90tph6eg6kbe516g-a.frankfurt-postgres.render.com',
	database: 'csvvaled',
	password: 'lUOS8R2HMiJRKscNBsoobKsU4eML3R7b',
	port: 5432,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurazione di multer per l'upload di file
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/');
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname);
	},
});

const upload = multer({ storage: storage });

// Resto del codice







app.post('/register', async (req, res) => {
	const { email, password } = req.body;

	try {
		// Verifica se l'utente è già registrato
		const query = 'SELECT * FROM users WHERE email = $1';
		const values = [email];
		const result = await pool.query(query, values);
		const user = result.rows[0];

		if (user) {
			res.status(400).json({ message: 'L\'utente è già registrato' });
			return;
		}

		// Hash della password
		const hashedPassword = bcrypt.hashSync(password, 10);

		// Salva l'utente nel database
		const insertQuery = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id';
		const insertValues = [email, hashedPassword];
		const insertResult = await pool.query(insertQuery, insertValues);
		const userId = insertResult.rows[0].id;

		// Invia un'email di conferma all'indirizzo email fornito
		const transporter = nodemailer.createTransport({
			// Configura il tuo trasportatore di posta elettronica
		});

		const mailOptions = {
			from: 'tuo_indirizzo_email',
			to: email,
			subject: 'Registrazione completata',
			text: 'La tua registrazione è stata completata con successo.',
		};

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error);
			} else {
				console.log('Email inviata: ' + info.response);
			}
		});

		res.status(200).json({ message: 'Registrazione completata' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Errore durante la registrazione' });
	}
});







app.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
	// Salvail file caricato nel server
	res.status(200).json({ message: 'Upload completato' });
});

// Funzione per autenticare il token
function authenticateToken(req, res, next) {
	const token = req.headers.authorization;

	if (!token) {
		res.status(401).json({ message: 'Token di accesso mancante' });
		return;
	}

	// Verifica l'autenticazione del token
	// Esempio: decodifica e verifica il token

	const authenticated = true; // Esempio di verifica dell'autenticazione

	if (authenticated) {
		next(); // Passa alla gestione successiva
	} else {
		res.status(401).json({ message: 'Accesso non autorizzato' });
	}
}






app.post('/login', async (req, res) => {
	const { email, password } = req.body;

	try {
		// Verifica se l'utente esiste nel database
		const query = 'SELECT * FROM users WHERE email = $1';
		const values = [email];
		const result = await pool.query(query, values);
		const user = result.rows[0];

		if (!user) {
			res.status(401).json({ message: 'Credenziali non valide' });
			return;
		}

		// Verifica la password
		const validPassword = bcrypt.compareSync(password, user.password);

		if (validPassword) {
			// Genera un token di accesso e rispondi con successo
			res.status(200).json({ token: 'il_tuo_token_di_accesso' });
		} else {
			res.status(401).json({ message: 'Credenziali non valide' });
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Errore durante il login' });
	}
});







app.post('/reset-password', async (req, res) => {
	const { email } = req.body;

	try {
		// Genera una nuova password
		const newPassword = 'nuova_password_generata';

		// Salva la nuova password nel database
		const hashedPassword = bcrypt.hashSync(newPassword, 10);
		const query = 'UPDATE users SET password = $1 WHERE email = $2';
		const values = [hashedPassword, email];
		await pool.query(query, values);

		// Invia un'email contenente la nuova password all'indirizzo email fornito
		const transporter = nodemailer.createTransport({
			// Configura il tuo trasportatore di posta elettronica
		});

		const mailOptions = {
			from: 'tuo_indirizzo_email',
			to: email,
			subject: 'Reset password',
			text: `La tua nuova password è: ${newPassword}`,
		};

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error);
				res.status(500).json({ message: 'Errore durante l\'invio dell\'email' });
			} else {
				console.log('Email inviata: ' + info.response);
				res.status(200).json({ message: 'Email inviata con successo' });
			}
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Errore durante il reset della password' });
	}
});





app.listen(port, () => {
	console.log(`App listening on port ${port}`)
})
