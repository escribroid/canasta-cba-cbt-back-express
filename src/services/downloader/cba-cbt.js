// Importar los módulos necesarios
import fetch from "node-fetch";
import XLS from "xlsjs";
import { EventEmitter } from "events";
import { verifyExcelFile } from "./src/services/downloader/verifyExcelFile.js"; // Asegúrate de que la ruta sea correcta

// URL del archivo XLS
const urlXlsCba = "https://www.indec.gob.ar/ftp/cuadros/sociedad/serie_cba_cbt.xls";

export async function downloadProcessXlsCbaCbt() {
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
