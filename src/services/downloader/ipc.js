// Importar los módulos necesarios

import { EventEmitter } from "events";

const now = new Date();
const ipcYearLarge = now.getFullYear();
export let ipcYear = (ipcYearLarge % 100).toString();
export let ipcMonth = (now.getMonth() + 1).toString();
export const ipcDay = now.getDate().toString();

export const baseIpcUrl = "https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_";

if (ipcMonth < 10) {
    ipcMonth = "0" + ipcMonth;
}

// Crear una instancia de EventEmitter
const eventManagerIpc = new EventEmitter();

// Escuchar el evento fuera de la función
eventManagerIpc.on("ipcJson", (eventDetail) => {
    console.log("Evento ipcMonth:", eventDetail.ipcMonth);
});
