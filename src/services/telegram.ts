import dotenv from 'dotenv';
import { procesarMensajeChef } from './gemini.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const telegramApiUrl = `https://api.telegram.org/bot${token}`;

export async function enviarMensajeTelegram(chatId: number, texto: string): Promise<boolean> {
  if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN no configurado.');
    return false;
  }

  try {
    const res = await fetch(`${telegramApiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: 'Markdown',
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json();
      console.error('Error al enviar mensaje a Telegram:', errorJson);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Excepción al enviar mensaje a Telegram:', error);
    return false;
  }
}

export async function procesarWebhookTelegram(update: any): Promise<void> {
  console.log('[Telegram Webhook] Update recibido:', JSON.stringify(update));
  
  const message = update.message;
  if (!message || !message.text || !message.chat || !message.chat.id) {
    console.log('[Telegram Webhook] No contiene un mensaje de texto válido.');
    return;
  }

  const chatId = message.chat.id;
  const textoUsuario = message.text;

  // Indicar que la IA está procesando (acción "typing")
  try {
    await fetch(`${telegramApiUrl}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action: 'typing',
      }),
    });
  } catch (e) {
    console.error('Error enviando typing action:', e);
  }

  try {
    // Procesar con Gemini (que llamará a la DB mediante herramientas si es necesario)
    const respuestaIa = await procesarMensajeChef(chatId, textoUsuario);

    // Enviar respuesta al chef
    await enviarMensajeTelegram(chatId, respuestaIa);
  } catch (error: any) {
    console.error('Error al procesar el mensaje en el webhook:', error);
    await enviarMensajeTelegram(
      chatId,
      `⚠️ *Error en el servidor:* Ocurrió un problema al procesar tu solicitud.\n\`${error.message || error}\``
    );
  }
}

export async function configurarWebhookTelegram(url: string): Promise<boolean> {
  if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN no configurado.');
    return false;
  }

  try {
    const webhookUrl = `${url}/webhook`;
    console.log(`Configurando webhook de Telegram a: ${webhookUrl}`);
    
    const res = await fetch(`${telegramApiUrl}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });

    const resJson: any = await res.json();
    console.log('[Telegram API] setWebhook response:', resJson);
    return resJson.ok;
  } catch (error) {
    console.error('Error configurando webhook:', error);
    return false;
  }
}
