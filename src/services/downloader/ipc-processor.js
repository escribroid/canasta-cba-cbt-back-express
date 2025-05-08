import fetch from "node-fetch";
import XLS from "xlsjs";
import { getValidIpcUrl } from "./url-validator.js";
import { baseIpcUrl, ipcMonth, ipcYear } from "./ipc.js";

export async function downloadProcessXlsIpc() {
    async function validacion(baseIpcUrl, ipcMonth, ipcYear) {
        const valid = await getValidIpcUrl(baseIpcUrl, ipcMonth, ipcYear);
        return valid;
    }

    let urlXlsIpc = await validacion(baseIpcUrl, ipcMonth, ipcYear);

    try {
        // Descargar el archivo XLS
        const response = await fetch(urlXlsIpc);
        //console.log("response", response.status);

        if (!(response.ok || response.status === 304)) {
            throw new Error(`Error al descargar el archivo: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        //console.log("arrayBuffer", arrayBuffer);

        // Obtener el peso del ArrayBuffer en bytes
        const bufferSize = arrayBuffer.byteLength;
        // console.log(`El tamaño del ArrayBuffer es: ${bufferSize} bytes`);

        // Verificar si el contenido está vacío
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("El archivo descargado está vacío o es inválido.");
        }

        const buffer = Buffer.from(arrayBuffer);

        // Intentar leer el archivo directamente desde el buffer
        try {
            workbook = XLS.read(buffer, { type: "buffer" });
        } catch (error) {
            throw new Error("El archivo descargado no es un archivo XLS válido.");
        }

        // Verificar si el workbook es válido y tiene hojas
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error("El archivo XLS no contiene hojas válidas.");
        }

        // Obtener la primera hoja
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!sheet) {
            throw new Error("La primera hoja del archivo XLS no existe o es inválida.");
        }

        const jsonData = XLS.utils.sheet_to_json(sheet);

        // Validar si el JSON tiene contenido
        if (!jsonData || jsonData.length === 0) {
            throw new Error("La hoja del archivo XLS está vacía o no contiene datos válidos.");
        }

        // ipc values all
        const ipcValuesAll = jsonData[6]; // Asegúrate de que jsonData[6] exista
        if (!ipcValuesAll || typeof ipcValuesAll !== "object") {
            throw new Error("No se encontraron valores válidos en la fila esperada.");
        }

        // ipc length
        const ipcObjSize = Object.keys(ipcValuesAll).length - 1;
        const ipcYears = ipcObjSize / 12;
        const ipcYearsInt = parseInt(ipcYears);

        // ipc year actual
        const ipcYearActual = 2017 + ipcYearsInt;

        // ipc month actual
        let ipcMonthActual = ipcObjSize % 12;
        if (ipcMonthActual === 0) {
            ipcMonthActual = 12;
        }

        // ipc value actual
        const ipcValuesArray = Object.values(ipcValuesAll);
        const ipcValueActual = ipcValuesArray[ipcValuesArray.length - 1];

        const ipcJson = {
            ipcValue: ipcValueActual,
            ipcMonth: ipcMonthActual,
            ipcYear: ipcYearActual,
        };

        //console.log("ipcJson", ipcJson);

        // Emitir un evento personalizado con datos
        eventManagerIpc.emit("ipcJson", ipcJson);

        return ipcJson;
    } catch (error) {
        console.error("Error durante el procesamiento del archivo XLS:", error.message);
        return null;
    }
}
downloadProcessXlsIpc();
