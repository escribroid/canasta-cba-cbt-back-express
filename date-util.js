setInterval(() => {
    const now = new Date();
    if (now.getDate() === 1) {
        isDownloadedThisMonth = false; // Reinicia al primer día del mes
    }
    // ...resto de la lógica
}, 60 * 60 * 1000); // Verificar cada 1 hora
("https://www.indec.gob.ar/ftp/cuadros/sociedad/serie_cba_cbt.xls");

// Importar los módulos necesarios
import fetch from "node-fetch";
import fs from "fs";
import XLSX from "xlsx";

// URL del archivo XLS
const xlsUrl = "https://www.indec.gob.ar/ftp/cuadros/sociedad/serie_cba_cbt.xls";

// Función para descargar el archivo
async function downloadFile(url, outputPath) {
    const response = await fetch(url);

    // Verificar que la respuesta fue exitosa
    if (!response.ok) throw new Error(`Error al descargar: ${response.statusText}`);

    // Crear un stream para escribir el archivo
    const fileStream = fs.createWriteStream(outputPath);

    // Pipe de la respuesta al stream
    await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
    console.log(`Archivo descargado en: ${outputPath}`);
}

// Función para procesar el archivo XLS
function processXLS(filePath) {
    // Leer el archivo XLS usando xlsx
    const workbook = XLSX.readFile(filePath);

    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir la hoja a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Mostrar los datos
    console.log("Datos procesados del XLS:", jsonData[4]["__EMPTY_2"]);
}

// Ruta donde se guardará el archivo XLS temporalmente
const filePath = "./archivo-cba-cbt.xls";

// Ejecutar la descarga y procesamiento
(async () => {
    try {
        // Descargar el archivo
        await downloadFile(xlsUrl, filePath);

        // Procesar el archivo descargado
        processXLS(filePath);

        // Eliminar el archivo después de procesarlo si lo deseas
        //fs.unlinkSync(filePath);
        //console.log('Archivo eliminado después de procesar.');
    } catch (error) {
        console.error("Error:", error);
    }
})();
