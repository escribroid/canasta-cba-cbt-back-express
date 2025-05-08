import express from "express";
import { downloadProcessXlsIpc } from "../services/downloader/ipc-processor.js";
import { downloadProcessXlsCbaCbt } from "../services/downloader/cba-cbt.js";

const router = express.Router();

// Endpoint: Procesar CBA/CBT
router.get("/cba-cbt/", async (req, res) => {
    try {
        const jsonData = await downloadProcessXlsCbaCbt();
        if (jsonData) {
            res.json(jsonData); // Enviar el JSON como respuesta
        } else {
            res.status(503).send("Error al procesar el archivo.");
        }
    } catch (error) {
        console.error("Error en /api/v1/cba-cbt/", error);
        res.status(500).send(`Error interno del servidor: ${error.message}`);
    }
});

// Endpoint: Procesar IPC
router.get("/ipc/", async (req, res) => {
    try {
        const jsonDataIpc = await downloadProcessXlsIpc();
        if (jsonDataIpc) {
            res.json(jsonDataIpc); // Enviar el JSON como respuesta
        } else {
            res.status(503).send("Error al procesar el archivo.");
        }
    } catch (error) {
        console.error("Error en /api/v1/ipc/", error);
        res.status(500).send(`Error interno del servidor: ${error.message}`);
    }
});

export default router;
