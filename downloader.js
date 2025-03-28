// TODO
// usar XLS.read para verificar si existe el XLS
// si existe actualizar la userSelect
// una vez actualizada no intentar hasta mes proximo

// Importar los módulos necesarios
import fetch from "node-fetch";
import XLS from "xlsjs"; // Importación corregida
import { EventEmitter } from "events";

const now = new Date();
const ipcYearLarge = now.getFullYear();
let ipcYear = (ipcYearLarge % 100).toString();
let ipcMonth = (now.getMonth() + 1).toString();
const ipcDay = now.getDate().toString();

// Ejemplo de uso
const baseIpcUrl = "https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_";
let workbook;

if (ipcMonth < 10) {
    ipcMonth = "0" + ipcMonth;
}

async function verifyExcelFile(apiIpcUrl) {
    try {
        // Solicitar solo los primeros 8 bytes del archivo
        const response = await fetch(apiIpcUrl, {
            headers: { Range: "bytes=0-7" },
        });

        if (!response.ok) {
            console.log("Error al obtener el archivo.");
            return false;
        }

        // Obtener el Content-Type
        const contentType = response.headers.get("Content-Type");

        // Verificar el Content-Type
        if (
            !contentType.includes("application/vnd.ms-excel") &&
            !contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        ) {
            console.log("El archivo no es un Excel válido (Content-Type incorrecto).");
            return false;
        }

        // Leer los primeros 8 bytes
        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);

        // Convertir los bytes a una cadena hexadecimal
        const hexSignature = Array.from(uint8Array)
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join(" ");

        // Verificar la firma del archivo
        const xlsSignature = "d0 cf 11 e0 a1 b1 1a e1"; // Excel antiguo (.xls)
        const xlsxSignature = "50 4b 03 04"; // Excel moderno (.xlsx)

        if (hexSignature.startsWith(xlsSignature) || hexSignature.startsWith(xlsxSignature)) {
            console.log("El archivo es un Excel válido.");
            return true;
        } else {
            console.log("El archivo no es un Excel válido (firma incorrecta).");
            return false;
        }
    } catch (error) {
        console.error("Error al verificar el archivo:", error);
        return false;
    }
}

async function getValidIpcUrl(baseIpcUrl, ipcMonth, ipcYear) {
    let currentIpcMonth = ipcMonth;
    let currentIpcYear = ipcYear;

    while (currentIpcYear >= "2024") {
        // Ajusta el año mínimo según sea necesario
        const apiIpcUrl = `${baseIpcUrl}${String(currentIpcMonth).padStart(2, "0")}_${currentIpcYear}.xls`;
        console.log(`Verificando IpcURL: ${apiIpcUrl}`);

        if (await verifyExcelFile(apiIpcUrl)) {
            console.log(`Archivo válido encontrado: ${apiIpcUrl}`);
            return apiIpcUrl;
        } else {
            console.log(`Archivo no válido: ${apiIpcUrl}`);
            // Restar un mes
            currentIpcMonth -= 1;
            if (currentIpcMonth < 1) {
                currentIpcMonth = 12;
                currentIpcYear -= 1;
            }
        }
    }
    console.log("No se encontró un archivo válido.");
    return null;
}

getValidIpcUrl(baseIpcUrl, ipcMonth, ipcYear).then((validIpcUrl) => {
    if (validIpcUrl) {
        console.log(`URL válida: ${validIpcUrl}`);
    } else {
        console.log("No se encontró una URL válida.");
    }
});

// Crear una instancia de EventEmitter
const eventManagerIpc = new EventEmitter();

// Escuchar el evento fuera de la función
eventManagerIpc.on("ipcJson", (eventDetail) => {
    console.log("Evento ipcMonth:", eventDetail.ipcMonth);
});

async function downloadProcessXlsIpc() {
    async function validacion(baseIpcUrl, ipcMonth, ipcYear) {
        const valid = await getValidIpcUrl(baseIpcUrl, ipcMonth, ipcYear);
        return valid;
    }

    let urlXlsIpc = await validacion(baseIpcUrl, ipcMonth, ipcYear);

    try {
        // Descargar el archivo XLS
        const response = await fetch(urlXlsIpc);
        //console.log("response", response.status);

        if (!response.ok) {
            throw new Error(`Error al descargar el archivo: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        //console.log("arrayBuffer", arrayBuffer);

        // Obtener el peso del ArrayBuffer en bytes
        const bufferSize = arrayBuffer.byteLength;
        console.log(`El tamaño del ArrayBuffer es: ${bufferSize} bytes`);

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

/* *********************************************************** */
// Función para convertir una fecha de Excel a una fecha de JavaScript
function excelDateToJSDate(excelDate) {
    const excelEpoch = new Date(1900, 0, 1);
    const jsDate = new Date(excelEpoch.getTime() + (excelDate - 1) * 86400000);
    let month = jsDate.getMonth() + 1;
    let day = "01";
    const year = jsDate.getFullYear();

    if (month < 10) {
        month = "0" + month;
    }

    return `${year}-${month}-${day}`;
}

// URL del archivo XLS
const urlXlsCba = "https://www.indec.gob.ar/ftp/cuadros/sociedad/serie_cba_cbt.xls";

async function downloadProcessXlsCbaCbt() {
    try {
        // Descargar el archivo XLS
        const response = await fetch(urlXlsCba);

        if (!response.ok) {
            throw new Error(`Error al descargar el archivo: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Leer el archivo directamente desde el buffer
        const workbook = XLS.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Obtén la primera hoja

        const jsonData = XLS.utils.sheet_to_json(sheet);

        let simpliData = jsonData.map((row) => ({
            fecha: excelDateToJSDate(
                row[
                    "Canasta básica alimentaria y canasta básica total. Valores mensuales por adulto equivalente, expresados en pesos"
                ]
            ),
            cba: row["__EMPTY"],
            cbt: row["__EMPTY_2"],
        }));

        // Datos procesados
        let simpliDataEnd = simpliData.length - 1;
        simpliData = simpliData.slice(3, simpliDataEnd);

        for (let i = 0; i < simpliData.length; i++) {
            const cbaValue = simpliData[i].cba;
            const cbtValue = simpliData[i].cbt;

            function transformarNumero(str) {
                if (str) {
                    // Si tiene comas y decimales (2 dígitos)
                    if (str.match(/,\d{2}$/)) {
                        // Reemplazar la última coma por punto (si tiene decimales)
                        let result = str.replace(/,(?=[^,]*$)/, ".");
                        // Eliminar todas las demás comas
                        result = result.replace(/,/g, "");
                        return result; // Devolver el valor transformado
                    } else {
                        // Si no tiene decimales, eliminar todas las comas
                        return str.replace(/,/g, ""); // Eliminar comas
                    }
                }
                return str; // Si la cadena está vacía o no es válida, devolvemos la original
            }

            // Transformar cba si es una cadena
            if (typeof cbaValue === "string") {
                let transformedCba = transformarNumero(cbaValue);
                simpliData[i].cba = parseFloat(transformedCba); // Convertir a float
            }

            // Transformar cbt si es una cadena
            if (typeof cbtValue === "string") {
                let transformedCbt = transformarNumero(cbtValue);
                simpliData[i].cbt = parseFloat(transformedCbt); // Convertir a float
            }
        }

        // Aquí puedes devolver los datos procesados directamente
        return simpliData;
    } catch (error) {
        console.error("Error:", error);
        return null; // O lanzar un error dependiendo de cómo quieras manejarlo
    }
}

// Ejecutar la función (puedes comentarlo al usarlo como un módulo)
downloadProcessXlsCbaCbt();

/* *********************************************************************************************************** */
export { downloadProcessXlsCbaCbt, downloadProcessXlsIpc };
