// Importar los módulos necesarios
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLS from "xlsjs"; // Importación corregida

// Obtener el equivalente a __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL del archivo XLS
const xlsUrl = "https://www.indec.gob.ar/ftp/cuadros/sociedad/serie_cba_cbt.xls";
// Ruta donde se guardará el archivo en el servidor
const filePathXls = path.join(__dirname, "archivo-cba-cbt.xls");
const filePathJson = path.join(__dirname, "archivo-cba-cbt.json");

// Función para convertir una fecha de Excel a una fecha de JavaScript
function excelDateToJSDate(excelDate) {
    const excelEpoch = new Date(1900, 0, 1);
    // Sumar el número de días desde la fecha de inicio
    const jsDate = new Date(excelEpoch.getTime() + (excelDate - 1) * 86400000);
    //console.log(`Fecha Excel`, jsDate);
    let month = jsDate.getMonth() + 1;
    let day = "01";
    const year = jsDate.getFullYear();

    if (month < 10) {
        month = "0" + month;
    }

    const dateString = `${year}-${month}-${day}`;

    //console.log(`Fecha Excel: ${excelDate} -> Fecha JS: ${dateString}`);

    return dateString;
}

async function downloadAndProcessXLS() {
    try {
        // Descargar el archivo XLS
        const response = await fetch(xlsUrl);
        if (!response.ok) {
            throw new Error(`Error al descargar el archivo: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        //console.log(`Tamaño del buffer: ${buffer.length}`);

        // Guardar el archivo en el servidor
        try {
            fs.writeFileSync(filePathXls, buffer);
            //console.log(`Archivo guardado en: ${filePathXls}`);
        } catch (writeError) {
            //console.error("Error al guardar el archivo XLS:", writeError);
        }

        // Lee el archivo
        const workbook = XLS.readFile(filePathXls);
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

        let simpliDataEnd = simpliData.length -1;
        simpliData = simpliData.slice(3, simpliDataEnd)

        //console.log("simpliData", simpliData);
        

        // Guardar los datos en un archivo JSON
        fs.writeFileSync(filePathJson, JSON.stringify(simpliData, null, 2)); // Formato legible
        //console.log(`Archivo JSON guardado en: ${filePathJson}`);

        // Muestra el nuevo array
        //console.log(simpliData[simpliData.length - 2]); // Accede a la cuarta fila simplificada

        const dataJson = fs.readFileSync(filePathJson, "utf8"); // Leer el archivo JSON
        // Parsear el contenido a un objeto JavaScript

        //.slice(3, jsonEnd)

        let data = JSON.parse(dataJson);
        

        // Muestra el contenido del archivo JSON
        //console.log(data);
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
}

// Ejecutar la función
downloadAndProcessXLS();

export { downloadAndProcessXLS };
