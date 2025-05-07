import { EventEmitter } from "events";

// Crear una clase que extienda EventEmitter
class EventManager extends EventEmitter {}

// Exportar una instancia única para compartirla
const eventManager = new EventManager();
export default eventManager;
