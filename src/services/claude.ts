import Anthropic from '@anthropic-ai/sdk';
import { buscarPlatosDb, obtenerCategoriasDb, guardarMensajeDb, obtenerHistorialDb } from '../db/queries.js';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey) {
  console.error('Error: ANTHROPIC_API_KEY no está configurada.');
}
const client = new Anthropic({ apiKey: anthropicApiKey });

const tools: Anthropic.Tool[] = [
  {
    name: 'buscar_platos',
    description: 'Busca platos en el menú de un restaurante.',
    input_schema: {
      type: 'object' as const,
      properties: {
        establecimiento: { type: 'string', enum: ['la_vereda', 'bar_ideal'], description: 'El restaurante.' },
        query: { type: 'string', description: 'Texto libre para buscar.' },
        categoria: { type: 'string', description: 'Categoría del plato.' }
      },
      required: ['establecimiento']
    }
  },
  {
    name: 'obtener_categorias',
    description: 'Obtiene categorías de platos disponibles.',
    input_schema: {
      type: 'object' as const,
      properties: {
        establecimiento: { type: 'string', enum: ['la_vereda', 'bar_ideal'], description: 'El restaurante.' }
      },
      required: ['establecimiento']
    }
  }
];

const SYSTEM_PROMPT = `Eres un Asistente Gastronómico de IA experto y el partner de cocina del Chef Gabriel para sus dos restaurantes en Tandil, Argentina: "La Vereda" y "Bar Ideal". Siempre consulta la base de datos antes de responder sobre platos o menús. Nunca inventes platos.`;

export async function procesarMensajeChef(chatId: number, textoUsuario: string): Promise<string> {
  const historialDb = await obtenerHistorialDb(chatId, 10);
  await guardarMensajeDb(chatId, 'user', textoUsuario);
  
  const messages: Anthropic.MessageParam[] = [
    ...historialDb.map((h: { rol: string; contenido: string }) => ({
      role: h.rol === 'user' ? 'user' as const : 'assistant' as const,
      content: h.contenido
    })),
    { role: 'user' as const, content: textoUsuario }
  ];

  let response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools,
    messages
  });

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use');
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      const { name, id, input } = toolUse;
      const args = input as Record<string, string>;
      let resultData: unknown;
      try {
        if (name === 'buscar_platos') {
          resultData = await buscarPlatosDb(args.establecimiento as 'la_vereda' | 'bar_ideal', args.query, args.categoria);
        } else if (name === 'obtener_categorias') {
          resultData = await obtenerCategoriasDb(args.establecimiento as 'la_vereda' | 'bar_ideal');
        } else {
          resultData = { error: `Herramienta ${name} no soportada.` };
        }
      } catch (err: unknown) {
        resultData = { error: err instanceof Error ? err.message : 'Error interno.' };
      }
      toolResults.push({ type: 'tool_result', tool_use_id: id, content: JSON.stringify(resultData) });
    }

    messages.push({ role: 'assistant' as const, content: response.content });
    messages.push({ role: 'user' as const, content: toolResults });
    response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages
    });
  }

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
  const respuestaFinal = textBlock?.text || 'No pude procesar una respuesta.';
  await guardarMensajeDb(chatId, 'model', respuestaFinal);
  return respuestaFinal;
}
