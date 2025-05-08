import { baseIpcUrl, ipcMonth, ipcYear } from "./ipc.js";

export async function getValidIpcUrl(baseIpcUrl, ipcMonth, ipcYear) {
    let currentIpcMonth = ipcMonth;
    console.log("-5- currentIpcMonth", currentIpcMonth);
    let currentIpcYear = ipcYear;
    console.log("-7- currentIpcYear", currentIpcYear);

    while (currentIpcYear >= "24") {
        console.log("-10- currentIpcMonth", currentIpcMonth);

        // Ajusta el año mínimo según sea necesario
        const apiIpcUrl = `${baseIpcUrl}${String(currentIpcMonth).padStart(
            2,
            "0"
        )}_${currentIpcYear}.xls`;
        console.log(`-17- Verificando IpcURL: ${apiIpcUrl}`);

        if (await verifyExcelFile(apiIpcUrl)) {
            console.log(`-20- Archivo válido encontrado: ${apiIpcUrl}`);
            return apiIpcUrl;
        } else {
            console.log(`23- Archivo no válido: ${apiIpcUrl}`);
            // Restar un mes
            currentIpcMonth -= 1;
            console.log("-26- currentIpcMonth", currentIpcMonth);

            if (currentIpcMonth < 1) {
                currentIpcMonth = 12;
                currentIpcYear -= 1;
            }
        }
    }
    console.log("34- No se encontró un archivo válido.");
    return null;
}

getValidIpcUrl(baseIpcUrl, ipcMonth, ipcYear).then((validIpcUrl) => {
    if (validIpcUrl) {
        console.log(`-40- URL valida: ${validIpcUrl}`);
    } else {
        console.log("-42- No se encontró una URL válida.");
    }
});

// Verifica si el archivo Excel es válido y no está vacío

export async function verifyExcelFile(apiIpcUrl) {
    //[${new Date().toISOString()}]
    console.log(`-50- Iniciando verificación verifyExcelFile: ${apiIpcUrl}`);
    try {
        // Primero verificar con HEAD para ahorrar ancho de banda
        const headResponse = await fetch(apiIpcUrl, { method: "HEAD" });
        const contentLength = parseInt(headResponse.headers.get("Content-Length"));

        //console.log("-32- headResponse.contentLength", contentLength);
        // console.log(
        //     `[${new Date().toISOString()}] Respuesta recibida en ${duration}ms. Status: ${
        //         headResponse.status
        //     }`
        // );
        // console.log("Headers:", JSON.stringify([...headResponse.headers.entries()]));

        // console.log("-40- headResponse.status", headResponse.status);

        if (contentLength < 10000) {
            console.log("-67- Archivo vacío.");
            return false;
        } else {
            console.log("-70- Archivo no vacío.");
            return true;
        }

        if (!(headResponse.ok || headResponse.status === 304)) {
            console.log(`-75- Archivo no disponible (HTTP ${headResponse.status})`);
            return false;
        }

        // Solicitar solo los primeros 8 bytes del archivo
        const response = await fetch(apiIpcUrl, {
            headers: { Range: "bytes=0-7" },
        });
        if (!response.ok) {
            console.log("-84- Error al obtener el archivo.");
            return false;
        }

        /*   // Obtener y Verificar Content-Type
        // const contentType = response.headers.get("Content-Type") || "";
        // console.log("-58- Content-Type:", contentType);
        // const validContentTypes = [
        //     "application/vnd.ms-excel",
        //     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        //     "application/octet-stream", // INDEC podría usar este
        // ];
        // if (!validContentTypes.some((type) => contentType.includes(type))) {
        //     console.log(`Content-Type no válido: ${contentType}`);
        //     return false;
        // } */

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

        // if (hexSignature.startsWith(xlsSignature) || hexSignature.startsWith(xlsxSignature)) {
        //     console.log("-81- El archivo es un Excel válido.");
        //     return true;
        // } else {
        //     console.log("-84- El archivo no es un Excel válido (firma incorrecta).");
        //     return false;
        // }
    } catch (error) {
        console.error(`-122- Error verifyExcelFile:`, error);

        return false;
    }
}
