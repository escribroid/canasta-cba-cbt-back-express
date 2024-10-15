import express from "express";
import cors from "cors";
import {} from "./downloader.js";
import path from "path";
import { fileURLToPath } from "url";

import { downloadAndProcessXLS } from "./downloader.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Servir los archivos estáticos de Vite en producción
// app.use(express.static(path.join(__dirname, "client/dist")));
app.use(cors());

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

// Si ninguna ruta coincide, devuelve el archivo `index.html` generado por Vite
app.get("/", (req, res) => {
    res.send("HOME");
});

//Endpoint para servir el archivo XLS al frontend
app.get("/api/cba-cbt/", async (req, res) => {
    try {
        const jsonData = await downloadAndProcessXLS();
        if (jsonData) {
            res.json(jsonData); // Enviar el JSON como respuesta
        } else {
            res.status(503).send("Error al procesar el archivo.");
        }
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});

// Servidor escuchando
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
