// Importar los módulos necesarios
import fetch from "node-fetch";
import XLS from "xlsjs"; // Importación corregida
import { EventEmitter } from "events";

const now = new Date();
const ipcYearLarge = now.getFullYear();
let ipcYearXls = (ipcYearLarge % 100).toString();
let ipcMonthNew = (now.getMonth() + 1).toString();
const ipcDay = now.getDate().toString();
let workbook;

if (ipcMonthNew < 10) {
    ipcMonthNew = "0" + ipcMonthNew;
}



setInterval(() => {
    if (ipcDay == "27") {
    }
    // ...resto de la lógica
}, 5000); // Verificar cada 1 hora

let comprobarURL;

if (ipcDay >= 28) {
    comprobarURL = true;
    probarURL();
}

let ipcMonthXls; // = "12";
//ipcYearXls = "24"; // (ipcYearLarge % 100).toString();

function probarURL() {
    console.log("comprobarURL-1", comprobarURL);
    //ipcYearXls = "24";
    //ipcMonthNew = "03";
    const urlXlsIpcNew = `https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_${ipcMonthNew}_${ipcYearXls}.xls`;

    async function downloadXlsIpcNew() {
        try {
            // Download new file XLS
            const response = await fetch(urlXlsIpcNew);
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

            try {
                workbook = XLS.read(buffer, { type: "buffer" });
                console.log("VALIDO");
                ipcMonthXls = ipcMonthNew;
                comprobarURL = false;
            } catch (error) {
                console.log("NO VALIDO");
                //ipcMonthXls = ipcMonthNew -1;
                throw new Error("El archivo descargado no es un archivo XLS válido.");
            }
        } catch (error) {
            console.error("Error durante el procesamiento del archivo XLS:", error.message);
            return null;
        }
    }
    downloadXlsIpcNew();

    return comprobarURL;
}

console.log("comprobarURL-2", comprobarURL);

console.log("ipcYearXls", ipcYearXls);
console.log("ipcMonthNew", ipcMonthNew);
console.log("ipcDay", ipcDay);
console.log("ipcYearXls", ipcYearXls);
console.log("ipcMonthXls", ipcMonthXls);

// usar XLS.read para verificar si existe el XLS
// si existe actualizar la userSelect
// una vez actualizada no intentar hasta mes proximo

// Crear una instancia de EventEmitter
const eventManager = new EventEmitter();

// Escuchar el evento fuera de la función
eventManager.on("ipcJson", (eventDetail) => {
    console.log("Evento ipcMonth:", eventDetail.ipcMonth);
});

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

async function downloadProcessXlsIpc() {
    let urlXlsIpc = `https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_${ipcMonthXls}_${ipcYearXls}.xls`;
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

        try {
            workbook = XLS.read(buffer, { type: "buffer" });
            console.log(`FUNCIONA ABAJO MES ${ipcMonthXls}`);
            console.log(`FUNCIONA ABAJO AÑO ${ipcYearXls}`);

        } catch (error) {
            console.log("NO FUNCIONA ABAJO");
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
