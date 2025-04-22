// TODO
/* 
    #Link canasta crianza
https://www.indec.gob.ar/ftp/cuadros/sociedad/serie_canasta_crianza.xlsx
    #Link ipc (mes 12 en el link es la del mes 11)
https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_12_24.xls
*/

import express from "express";
import { config } from "dotenv";
import cors from "cors";
import {} from "./downloader.js";
import path from "path";
import { fileURLToPath } from "url";
import { downloadProcessXlsCbaCbt, downloadProcessXlsIpc } from "./downloader.js";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
const version = "1.0.5";

// Carga las variables de entorno del archivo .env
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Servir los archivos estáticos de Vite en producción
// app.use(express.static(path.join(__dirname, "client/dist")));
// app.use(cors());

// Configuración de CORS
app.use(cors({
    origin: 'https://canasta-cba-cbt-front-vite.vercel.app' // Permitir solicitudes solo desde este dominio
}));

app.use(morgan('combined'));

// Configuración del límite de solicitudes
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 10, // Máximo 10 solicitudes por IP
    message: "Has excedido el límite de solicitudes. Intenta nuevamente más tarde."
});
// Aplicar el middleware a todas las rutas
app.use(limiter);

  
  
app.get('/api/v1/ipc', (req, res) => {
    res.json({ message: 'Endpoint alcanzado exitosamente' });
});
  

// Variable para rastrear si el archivo ya ha sido descargado este mes
//let isDownloadedThisMonth = false;

// Configuración del intervalo de verificación
// setInterval(() => {
//   const now = new Date();
//   if (isDownloadedThisMonth) {
//     console.log('Ya se ha descargado el archivo este mes. No se realizarán más verificaciones.');
//     return; // Detiene la verificación si ya se descargó este mes
//   }

//   if (isWithinDateRange(now)) {
//     checkAndUpdateXLS().then(downloaded => {
//       if (downloaded) {
//         isDownloadedThisMonth = true; // Marca que el archivo ha sido descargado
//       }
//     }).catch(console.error);
//   } else {
//     console.log('No es el momento de verificar la API.');
//   }
//
//   // Reinicia la variable el primer día del mes
//   if (now.getDate() === 1) {
//     isDownloadedThisMonth = false;
//   }
// }, 60 * 60 * 1000); // Verificar cada 1 hora

// Ruta de inicio. Si ninguna ruta coincide, devuelve el archivo `index.html` generado por Vite
app.get("/", (req, res) => {
    res.send("<h1>HOME</h1>");
});

// Endpoint: Procesar CBA/CBT
app.get("/api/v1/cba-cbt/", async (req, res) => {
    try {
        const jsonData = await downloadProcessXlsCbaCbt();
        if (jsonData) {
            res.json(jsonData); // Enviar el JSON como respuesta
        } else {
            res.status(503).send("Error al procesar el archivo.");
        }
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});

// Endpoint: Procesar IPC
app.get("/api/v1/ipc/", async (req, res) => {
    try {
        const jsonDataIpc = await downloadProcessXlsIpc();
        if (jsonDataIpc) {
            res.json(jsonDataIpc); // Enviar el JSON como respuesta
        } else {
            res.status(503).send("Error al procesar el archivo.");
        }
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});

// Manejador para rutas no encontradas
app.use((req, res) => {
    res.status(404).send("Ruta no encontrada");
});

// Si estás ejecutando localmente, usa app.listen() para iniciar el servidor
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor desarrollo en puerto ${PORT}`);
    });
}



// localhost:3000
/* app.listen(PORT, () => {
    console.log(`Servidor desarrollo escuchando en puerto ${PORT}`);
}); */

// Exporta la aplicación para producción (como en Vercel)
export default app;
