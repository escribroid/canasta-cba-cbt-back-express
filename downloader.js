// Importar los módulos necesarios
import fetch from "node-fetch";
import XLS from "xlsjs"; // Importación corregida
import { EventEmitter } from "events";

const now = new Date();
console.log("Year", now.getFullYear());
console.log("Month", now.getMonth() + 1);
console.log("Day", now.getDate());

// usar XLS.read para verificar si existe el XLS
// si existe actualizar la userSelect
// una vez actualizada no intentar hasta mes proximo

// Crear una instancia de EventEmitter
const eventManager = new EventEmitter();

// URL del archivo XLS
const urlXlsCba = "https://www.indec.gob.ar/ftp/cuadros/sociedad/serie_cba_cbt.xls";

// Escuchar el evento fuera de la función
eventManager.on("ipcJson", (eventDetail) => {
    console.log("Evento ipcMonth:", eventDetail.ipcMonth);
});

let ipcMonthXls = "01";
let ipcYearXls = "25";

// if (ipcMonthXls % 12 === 0) {
//     ipcYearXls+= 1;
// }

const urlXlsIpc = `https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_${ipcMonthXls}_${ipcYearXls}.xls`;

// const urlXlsIpc = "https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_12_24.xls";

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

        //console.log("jsonData", jsonData);

        let simpliData = jsonData.map((row) => ({
            fecha: excelDateToJSDate(
                row[
                    "Canasta básica alimentaria y canasta básica total. Valores mensuales por adulto equivalente, expresados en pesos"
                ]
            ),
            cba: row["__EMPTY"],
            cbt: row["__EMPTY_2"],
        }));
        //console.log("simpliData", simpliData);

        // Datos procesados
        let simpliDataEnd = simpliData.length - 1;
        simpliData = simpliData.slice(3, simpliDataEnd);

        /*         console.log("simpliData1", simpliData[101]); */

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

        //console.log("simpliData2", simpliData[101]); // Ver resultado

        // Aquí puedes devolver los datos procesados directamente
        //console.log("simpliData", simpliData);
        return simpliData;
    } catch (error) {
        console.error("Error:", error);
        return null; // O lanzar un error dependiendo de cómo quieras manejarlo
    }
}

// Ejecutar la función (puedes comentarlo al usarlo como un módulo)
downloadProcessXlsCbaCbt();

let ipcJson;

async function downloadProcessXlsIpc() {
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
        //console.log("buffer", buffer);

        // Intentar leer el archivo directamente desde el buffer
        let workbook;

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

        console.log("ipcJson", ipcJson);

        // Emitir un evento personalizado con datos
        eventManager.emit("ipcJson", ipcJson);

        return ipcJson;
    } catch (error) {
        console.error("Error durante el procesamiento del archivo XLS:", error.message);
        return null;
    }
}
downloadProcessXlsIpc();

//console.log("ipcMonth", ipcJson);

export { downloadProcessXlsCbaCbt, downloadProcessXlsIpc };
