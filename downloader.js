// Importar los módulos necesarios
import fetch from "node-fetch";
import XLS from "xlsjs"; // Importación corregida

// URL del archivo XLS
const xlsUrl = "https://www.indec.gob.ar/ftp/cuadros/sociedad/serie_cba_cbt.xls";

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

async function downloadAndProcessXLS() {
    try {
        // Descargar el archivo XLS
        const response = await fetch(xlsUrl);
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

        console.log("simpliData", simpliData[101]);

        // Aquí puedes devolver los datos procesados directamente
        return simpliData;
    } catch (error) {
        console.error("Error:", error);
        return null; // O lanzar un error dependiendo de cómo quieras manejarlo
    }
}

// Ejecutar la función (puedes comentarlo al usarlo como un módulo)
downloadAndProcessXLS();

export { downloadAndProcessXLS };
