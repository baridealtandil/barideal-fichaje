import { GoogleGenerativeAI, FunctionDeclaration, SchemaType, Content } from '@google/generative-ai';
import { buscarPlatosDb, obtenerCategoriasDb, obtenerHistorialDb, guardarMensajeDb } from '../db/queries.js';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('Advertencia: GEMINI_API_KEY no está configurada.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // gemini-2.5-flash es el modelo por defecto en 2026

// Definición de las funciones disponibles para la IA
const buscarPlatosDeclaration: FunctionDeclaration = {
  name: 'buscar_platos',
  description: 'Busca platos en el catálogo del restaurante especificado (la_vereda o bar_ideal). Permite filtrar por un término de búsqueda (ej. \'pollo\') o por categoría.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      establecimiento: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: ['la_vereda', 'bar_ideal'],
        description: 'El restaurante sobre el cual se realiza la consulta. Obligatorio.',
      },
      query: {
        type: SchemaType.STRING,
        description: 'Término de búsqueda para filtrar platos (ej: "bondiola", "pasta", "milanesa"). Opcional.',
      },
      categoria: {
        type: SchemaType.STRING,
        description: 'Categoría específica de platos (ej: "pastas", "carnes", "postres", "entradas_sugerencias"). Opcional.',
      }
    },
    required: ['establecimiento'],
  },
};

const obtenerCategoriasDeclaration: FunctionDeclaration = {
  name: 'obtener_categorias',
  description: 'Obtiene el listado de categorías únicas de platos disponibles en un establecimiento.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      establecimiento: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: ['la_vereda', 'bar_ideal'],
        description: 'El restaurante sobre el cual se realiza la consulta. Obligatorio.',
      }
    },
    required: ['establecimiento'],
  },
};

// Prompt del sistema con las directrices del chef y perfiles gastronómicos
const SYSTEM_PROMPT = `
Eres un Asistente Gastronómico de IA experto y el partner de cocina del Chef Gabriel para sus dos restaurantes en Tandil, Argentina: "La Vereda" y "Bar Ideal".

### Regla de Oro
Los catálogos de platos de ambos restaurantes están en la misma base de datos pero pertenecen a establecimientos diferentes. Debes tratarlos siempre por separado. NUNCA mezcles platos de "La Vereda" con platos de "Bar Ideal" en tus respuestas ni sugerencias a menos que el chef lo pida de forma explícita.

### Perfiles Gastronómicos para sugerencias creativas:
1. **La Vereda**: Su identidad está marcada en salsas cremosas (roquefort, 4 quesos, panceta y puerro), pastas caseras rellenas, y guarniciones tipo puré, papas a la provenzal o papas españolas. Su menú fijo diario tiene una estructura rígida de Carne / Pasta / Vegetariano.
2. **Bar Ideal**: Es un restaurante histórico, con perfil de carta y sugerencias más elaboradas. Entradas más finas (langostinos, gambas, croquetas variadas) y principales con técnicas más trabajadas (grillado, ratatouille, reducciones, etc.).

### Tareas en las que asistes (Fase 1):
- Consultar platos existentes: Usa las herramientas provistas para buscar platos o categorías.
- Proponer menús semanales o sugerencias diarias: Utiliza solo los platos que existen en el catálogo histórico de ese local.
- Sugerir platos nuevos: Si el chef te pide una propuesta de plato que no está en la base de datos, génerala de forma creativa PERO respetando fielmente el perfil gastronómico del restaurante consultado. Si el chef te da restricciones (como ingredientes de temporada, stock o costos), incorpóralas.

### Estilo de comunicación y formato de respuestas (CRÍTICO):
- **Sin introducciones ni saludos**: NUNCA uses frases de inicio como "¡Excelente, Chef!", "Preparar el menú es una tarea importante...", ni explicaciones o justificaciones de lo que vas a tener en cuenta.
- **Sin cierres ni preguntas conversacionales**: NUNCA uses frases de cierre como "Espero que esta propuesta esté a la altura...", "Espero que capture la esencia...", ni preguntas como "¿Qué te parece?". La respuesta debe terminar de forma limpia con los datos solicitados.
- **Transición ultra breve**: Limítate únicamente a una introducción ultra corta cuando sea estrictamente necesario para presentar la información (ej: "Acá tenés una propuesta de lunes a viernes:").
- **Tono**: Sé formal, respetuoso, directo y profesional. Habla en español rioplatense (voseo de Argentina: "tenés", "mirá", "hacé") sin modismos informales o vulgares (está prohibido usar "che").
`;

// Controlador principal de la conversación con el Chef
export async function procesarMensajeChef(chatId: number, mensajeTexto: string): Promise<string> {
  // 1. Guardar mensaje del usuario en la base de datos
  await guardarMensajeDb(chatId, 'user', mensajeTexto);

  // 2. Obtener historial reciente para contexto
  const historial = await obtenerHistorialDb(chatId, 15);

  // 3. Formatear historial al formato de Gemini
  const contents: Content[] = historial.map(msg => ({
    role: msg.rol === 'user' ? 'user' : 'model',
    parts: [{ text: msg.contenido }],
  }));

  // Asegurar que el último mensaje (el actual) está al final del historial si no está ya
  // En este flujo, obtenerHistorialDb ya nos devuelve el mensaje guardado en el paso 1 si se inserta rápido
  const ultimoMensajeEnHistorial = contents[contents.length - 1];
  if (!ultimoMensajeEnHistorial || ultimoMensajeEnHistorial.parts[0].text !== mensajeTexto) {
    contents.push({
      role: 'user',
      parts: [{ text: mensajeTexto }]
    });
  }

  // 4. Configurar el modelo con tools y system instruction
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
  }, {
    apiVersion: 'v1beta'
  });

  // 5. Enviar mensaje a Gemini
  let result = await model.generateContent({
    contents,
    tools: [{ functionDeclarations: [buscarPlatosDeclaration, obtenerCategoriasDeclaration] }],
  });

  // 6. Ciclo de resolución de herramientas (Function Calling)
  let functionCalls = result.response.functionCalls();
  while (functionCalls && functionCalls.length > 0) {
    const toolResults: any[] = [];

    for (const call of functionCalls) {
      const { name, args } = call;
      console.log(`[Gemini ToolCall] Ejecutando tool: ${name} con argumentos:`, args);

      let resultData: any;
      try {
        if (name === 'buscar_platos') {
          const { establecimiento, query, categoria } = args as any;
          resultData = await buscarPlatosDb(establecimiento, query, categoria);
        } else if (name === 'obtener_categorias') {
          const { establecimiento } = args as any;
          resultData = await obtenerCategoriasDb(establecimiento);
        } else {
          resultData = { error: `Herramienta ${name} no soportada.` };
        }
      } catch (err: any) {
        console.error(`Error ejecutando tool ${name}:`, err);
        resultData = { error: err.message || 'Error interno de base de datos.' };
      }

      toolResults.push({
        functionResponse: {
          name,
          response: { result: resultData }
        }
      });
    }

    // Agregar el mensaje de llamada de función e historial al chat
    contents.push(result.response.candidates?.[0]?.content || {
      role: 'model',
      parts: [{ functionCall: functionCalls[0] }] // Ajuste si hay llamadas
    });

    // Agregar el resultado de la función
    contents.push({
      role: 'user',
      parts: toolResults
    });

    // Volver a llamar al modelo con las respuestas de las funciones
    result = await model.generateContent({
      contents,
      tools: [{ functionDeclarations: [buscarPlatosDeclaration, obtenerCategoriasDeclaration] }],
    });

    functionCalls = result.response.functionCalls();
  }

  const respuestaFinal = result.response.text() || 'No pude procesar una respuesta.';

  // 7. Guardar la respuesta final de la IA en la base de datos
  await guardarMensajeDb(chatId, 'model', respuestaFinal);

  return respuestaFinal;
}
