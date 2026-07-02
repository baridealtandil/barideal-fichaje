import dotenv from 'dotenv';
import { procesarMensajeChef } from './services/gemini.js';

dotenv.config();

async function test() {
  console.log('--- Probando comunicación local con Gemini y DB ---');
  const chatId = 9999999; // ID de prueba
  const mensaje = 'Hola, qué platos con bondiola tenemos en La Vereda?';
  
  console.log(`Mensaje enviado: "${mensaje}"`);
  
  try {
    const respuesta = await procesarMensajeChef(chatId, mensaje);
    console.log('\n--- Respuesta recibida de Gemini ---');
    console.log(respuesta);
    console.log('------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR DETECTADO:', error);
    process.exit(1);
  }
}

test();
