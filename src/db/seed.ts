import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL no está definida en las variables de entorno.');
  process.exit(1);
}

const sql = postgres(databaseUrl);

interface PlatoInsert {
  nombre: string;
  establecimiento: 'la_vereda' | 'bar_ideal';
  categoria: string;
  descripcion?: string;
  plato_compartido?: boolean;
}

const platosLaVereda: PlatoInsert[] = [
  // --- CARNES ---
  // Bondiola
  { nombre: "Bondiola a la riojana con puré de batatas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola a la riojana con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola a la mostaza con puré de calabaza", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola a la mostaza y miel con puré de batatas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola a la cerveza y miel con puré de batata", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola con salsa agridulce and puré de batata", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola braseada con papas a la provenzal", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola braseada con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola braseada con batatas al horno", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola braseada con batatas y vegetales al horno", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola de cerdo a la mostaza con batatas fritas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bondiola al verdeo con puré", establecimiento: "la_vereda", categoria: "carnes" },

  // Matambre
  { nombre: "Matambre a la pizza con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambre a la pizza con papas a la provenzal", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambre a la pizza con papas españolas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambre a la pizza con milhojas de papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambre de cerdo a la pizza con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambre de cerdo a la fugaseta con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambre de cerdo a la fugaseta con batatas fritas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambre de cerdo a la provenzal con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambre de cerdo con salsa agridulce y puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambre de ternera a la pizza con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambrito de cerdo a la fugaseta con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambrito de cerdo a la provenzal con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambrito de cerdo al limón con papas a la provenzal", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Matambrito de cerdo relleno con salsa agridulce y batatas al horno", establecimiento: "la_vereda", categoria: "carnes" },

  // Pechito de cerdo
  { nombre: "Pechito de cerdo a la barbacoa con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pechito de cerdo a la barbacoa con batatas al horno", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pechito de cerdo a la barbacoa con papas a la provenzal", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pechito de cerdo a la barbacoa con papas rústicas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pechito de cerdo braseado con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pechito de cerdo con batatas y chutney de manzanas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pechito de cerdo con reducción de cerveza y miel con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pechito de cerdo con puré gratinado", establecimiento: "la_vereda", categoria: "carnes" },

  // Chuletas y bifes de cerdo
  { nombre: "Chuletas de cerdo a la riojana con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Chuletas de cerdo a la riojana con puré de batatas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Chuletas de cerdo a la riojana con batatas al horno", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Chuletas de cerdo a la barbacoa con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Chuletas de cerdo a la barbacoa con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Chuletas de cerdo a la barbacoa con puré de batatas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Chuletas de cerdo con reducción de cerveza y miel con puré de boniato", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Chuletas de cerdo con salsa agridulce y puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bifes de cerdo a la criolla con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bifes de cerdo a la riojana con batatas al horno", establecimiento: "la_vereda", categoria: "carnes" },

  // Vacuno
  { nombre: "Bife de chorizo con papas españolas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bife de chorizo a la riojana con papas españolas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Bife de chorizo con salsa de champi y papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Lomo al champi con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Lomo a la riojana con revuelto de gramajo", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Escalope de ternera con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Chuleta de ternera a la portuguesa con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Albóndigas a la pomarola con arroz", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Albóndigas a la pomarola con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Carne al horno con vegetales y papas españolas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Solomillo mechado con reducción agridulce y puré de batatas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Solomillo a la riojana con batatas fritas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Solomillo a la teriyaki con arroz cremoso", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Osobuco braseado al malbec con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Osobuco braseado al vino tinto con puré rústico", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pastel de carne de cerdo con puré mixto", establecimiento: "la_vereda", categoria: "carnes" },

  // Pollo
  { nombre: "Pollo al champi con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo al champi con puré mixto", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo con salsa de espinaca y puré rústico", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo en salsa cremosa de espinaca y parmesano con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo a la mostaza y miel con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo a la naranja con puré de calabaza", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo a la portuguesa con papas españolas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo a la florentina (crema de espinaca) con papas rústicas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo a la teriyaki con rúcula, cherri y parmesano", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo a la naranja con croquetas de arroz", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo al curry con arroz cremoso", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pollo a la pizza con papas a la provenzal", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Brochet de pollo con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Muslo al champiñón con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Muslo al champiñón con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Muslo con salsa vereda (crema, jamón, roquefort y ketchup) con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Muslo a la provenzal con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Muslo relleno con puré de calabaza", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Cazuela de pollo", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Guiso de arroz con pollo", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Risotto de pollo y champi", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Risotto de azafrán con pollo y champi", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Pastel de pollo con puré mixto", establecimiento: "la_vereda", categoria: "carnes" },

  // Milanesas (ternera y pollo)
  { nombre: "Milanesa a los 4 quesos con papas rústicas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa al roquefort con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa con cheddar, panceta y perejil con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa con espinaca y quesos gratinado con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa con fileto, berenjena y parmesano con puré de papa", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa con muzza, jamón y roquefort con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa con muzza panceta cheddar con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa con panceta, muzza, cheddar, barbacoa y huevo", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa de ternera a los 4 quesos con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa de ternera con muzza cheddar y panceta y papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa de ternera con muzza roquefort y jamón y papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa de ternera serrana con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa de ternera serrana con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa gran césar con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa jamón, muzza y roquefort con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa jamón, muzza y roquefort con bombas de papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa la gran césar con papas a la provenzal", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa la gran césar (muzzarela, verdes, tomate y aderezo césar) con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa La Vereda con fritas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa napolitana con puré", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa rellena (provolone, morrones asados y panceta) con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa rellena con papas rústicas a la provenzal", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa serrana (muzzarela, jamón crudo, rúcula y parmesano) con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa a la Suiza con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa a la Suiza con puré rústico", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa de peceto a caballo con revuelto de gramajo", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa de peceto a caballo con papas", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa de pollo con jamón, muzza, roquefort y perejil fresco con croquetas de arroz", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa de pollo con jamón, muzza, roquefort y perejil fresco con puré de calabaza", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesa de pollo con salsa blanca y espinaca gratinada con bombas de papa", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesas de merluza con croquetas de arroz", establecimiento: "la_vereda", categoria: "carnes" },
  { nombre: "Milanesas de merluza con croquetas de verdura", establecimiento: "la_vereda", categoria: "carnes" },

  // --- PESCADOS Y MARISCOS ---
  { nombre: "Merluza al limón con puré", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Merluza al roquefort con puré de papa y espinaca", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Merluza al roquefort con bocaditos de acelga", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Escalope de merluza con puré", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Escalope de merluza con puré de calabaza", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Escalope de merluza con bocaditos/bocadillos de acelga", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Escalope de merluza con papas españolas", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Milanesa de merluza con puré", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Milanesa de merluza con puré de calabaza", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Milanesa de merluza con papas españolas", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Filet de merluza al roquefort con puré", establecimiento: "la_vereda", categoria: "pescados", plato_compartido: true },
  { nombre: "Filet de merluza apanado con puré rústico", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Rol de merluza con arroz pilaf", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Rol de merluza al roquefort con arroz", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Rol de merluza con arroz a los 4 quesos", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Papillot de merluza con papas", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Abadejo con crema de roquefort y arroz pilaf", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Abadejo con salsa de roquefort con puré de papas", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Sorrentinos de salmón con crema y albahaca", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Sorrentinos de mar con crema de azafrán", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Tomates rellenos con arroz y atún con ensalada", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Pene rigati a la mediterránea (atún, cherri, albahaca, aceitunas y parmesano)", establecimiento: "la_vereda", categoria: "pescados" },
  { nombre: "Pappardele negros con crema de gambas", establecimiento: "la_vereda", categoria: "pescados" },

  // --- PASTAS ---
  // Ñoquis
  { nombre: "Ñoquis de papa con estofado de pollo", establecimiento: "la_vereda", categoria: "pastas", plato_compartido: true },
  { nombre: "Ñoquis de papa con estofado de carne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de papa con salsa bolognesa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de papa con salsa fileto", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de papa a la parisienne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de espinaca a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de espinaca con salsa bolognesa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de espinaca con salsa de champi", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de espinaca con salsa de panceta y puerro", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de espinaca a la parisienne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de espinaca gratinado a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de calabaza con salsa 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis de boniato a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis verdes con salsa parisienne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis a la boloñesa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis a la parissienne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ñoquis gratinados a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Malfatis de espinaca y ricota a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },

  // Ravioles
  { nombre: "Raviolones de verdura con estofado de pollo", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Raviolones de verdura con estofado de carne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ravioles de verdura con estofado de carne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ravioles de verdura con crema de albahaca", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Raviolones de calabaza con salsa de champi", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Raviolones de calabaza con salsa de puerro", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Raviolones de calabaza con salsa mixta", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Raviolones de calabaza con salsa 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Raviolones de muzza y calabaza con pomodoro", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Raviolones de pollo y espinaca con salsa rosa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Raviolones de pollo y espinaca con salsa de puerro y champi", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Raviolones de osobuco con salsa rosa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ravioles de pollo con salsa de puerros", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ravioles de pollo con salsa champi", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ravioles de calabaza al champiñón", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ravioles de cordero con salsa fileto", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Ravioles de cordero con manteca y salvia", establecimiento: "la_vereda", categoria: "pastas" },

  // Sorrentinos
  { nombre: "Sorrentinos de jyq con salsa bolognesa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Sorrentinos de jyq con salsa parisienne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Sorrentinos de jyq con salsa vereda", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Sorrentinos de jyq al verdeo", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Sorrentinos de jyq con estofado de carne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Sorrentinos de jyq a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Sorrentinos de verdura con salsa mixta", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Sorrentinos de verdura con salsa bolognesa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Sorrentinos de verdura al champiñón", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Sorrentinos de cabutia, cebolla caramelizada y roquefort con salsa crema de albahaca", establecimiento: "la_vereda", categoria: "pastas" },

  // Panzotis
  { nombre: "Panzotis de jamón, ricota y nuez a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Panzotis de ricota, nuez y jamón con salsa rosa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Panzotis de verdura con salsa bolognesa", establecimiento: "la_vereda", categoria: "pastas" },

  // Canelones y Conchinglioni
  { nombre: "Canelones de pollo y espinaca con salsa mixta", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Canelones de pollo y espinaca con salsa rosa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Canelones de verdura con salsa mixta", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Canelones de verdura con salsa bolognesa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Canelones de verdura con salsa bechamel", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Canelones de humita con salsa mixta", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Canelones de humita con crema de verdeo", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Canelones de jyq con salsa bolognesa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Canelones de jyq con salsa mixta", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Canelones de jyq con salsa fileto", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Canelones a la rossini con salsa bechamel", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Conchinglioni de jyq con salsa mixta", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Conchinglioni de jyq con salsa fileto", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Conchinglioni de verdura con salsa fileto", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Conchinglioni de jyq con estofado de carne", establecimiento: "la_vereda", categoria: "pastas" },

  // Lasagna
  { nombre: "Lasagna de verdura con salsa bolognesa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Lasagna de verdura con salsa fileto", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Lasagna de verdura con salsa mixta", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Lasagna de verdura y carne con salsa fileto", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Lasagna de jamón y queso con bolognesa", establecimiento: "la_vereda", categoria: "pastas" },

  // Tallarines / Espaguetis / Fetuccini / Pene
  { nombre: "Tallarines a la carbonara", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Tallarines al pesto", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Tallarines al champi", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Tallarines a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Tallarines con albóndigas", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Espaguetis a la carbonara", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Espaguetis a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Espaguetis a la bolognesa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Espaguetis con albóndigas", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Espaguetis con salsa de frutos de mar", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Fetuccini a la carbonara", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Fetuccini con estofado de albóndigas", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Fetuccini de espinaca con estofado de carne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Fetuccini con salsa de zucchini", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Fetuccini con estofado de pollo", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Pene rigati a la carbonara (Barilla)", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Pene rigati a la mediterránea", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Pene rigati a la bolognesa", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Pene rigati al champi", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Pene rigati con crema de zucchini", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Pene rigati con salsa vereda (champi, jamón, cebolla y crema)", establecimiento: "la_vereda", categoria: "pastas" },

  // Rotolo / Crepes rellenas
  { nombre: "Rotolo de verdura con salsa mixta", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Rotolo de verdura con salsa parisienne", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Rotolo de verdura a los 4 quesos", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Crepes de humita con crema de verdeo", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Crepes de verdura con salsa bechamel", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Crep de humita con salsa mixta", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Crep de humita con crema de albahaca", establecimiento: "la_vereda", categoria: "pastas" },

  // Risotto y otros
  { nombre: "Risotto de pollo y champi", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Risotto de azafrán con pollo y champi", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Risotto de calabaza", establecimiento: "la_vereda", categoria: "pastas" },
  { nombre: "Wok de vegetales y arroz", establecimiento: "la_vereda", categoria: "pastas", plato_compartido: true },
  { nombre: "Wok de arroz, vegetales y salsa de soja", establecimiento: "la_vereda", categoria: "pastas", plato_compartido: true },
  { nombre: "Polenta cremosa con salsa bolognesa", establecimiento: "la_vereda", categoria: "pastas", plato_compartido: true },
  { nombre: "Polenta cremosa con osobuco braseado", establecimiento: "la_vereda", categoria: "pastas" },

  // --- PIZZAS ---
  { nombre: "Pizza individual de vegetales y rúcula", establecimiento: "la_vereda", categoria: "pizzas" },
  { nombre: "Pizza individual napolitana", establecimiento: "la_vereda", categoria: "pizzas" },
  { nombre: "Pizza individual de rúcula, cherri y parmesano", establecimiento: "la_vereda", categoria: "pizzas" },
  { nombre: "Pizza individual con espinaca, salsa blanca y queso gratinado", establecimiento: "la_vereda", categoria: "pizzas" },
  { nombre: "Pizza integral de vegetales y rúcula", establecimiento: "la_vereda", categoria: "pizzas" },
  { nombre: "Pizza americana", establecimiento: "la_vereda", categoria: "pizzas" },

  // --- HAMBURGUESAS ---
  { nombre: "Hamburguesa todo terreno (panceta, morrón y rúcula) con papas", establecimiento: "la_vereda", categoria: "hamburguesas" },
  { nombre: "Hamburguesa callejera con papas", establecimiento: "la_vereda", categoria: "hamburguesas" },
  { nombre: "Hamburguesa completa con papas", establecimiento: "la_vereda", categoria: "hamburguesas" },
  { nombre: "Hamburguesa mexicana con papas", establecimiento: "la_vereda", categoria: "hamburguesas" },
  { nombre: "Hamburguesa con muzza, aros de cebolla, cheddar y panceta con papas", establecimiento: "la_vereda", categoria: "hamburguesas" },
  { nombre: "Hamburguesa con panceta, cheddar, tomate y lechuga con papas", establecimiento: "la_vereda", categoria: "hamburguesas" },
  { nombre: "Hamburguesa con lechuga, tomate, barbacoa y muzzarela", establecimiento: "la_vereda", categoria: "hamburguesas" },
  { nombre: "Hamburguesa con jamón y queso con papas", establecimiento: "la_vereda", categoria: "hamburguesas" },
  { nombre: "Hamburguesa con criolla, panceta, cheddar y huevo", establecimiento: "la_vereda", categoria: "hamburguesas" },
  { nombre: "Hamburguesa La Vereda con papas", establecimiento: "la_vereda", categoria: "hamburguesas" },
  { nombre: "Hamburguesa con panceta y salsa de mostaza y miel, rúcula y palta", establecimiento: "la_vereda", categoria: "hamburguesas" },

  // --- SANDWICHES ---
  { nombre: "Sandwich clásico (jamón crudo, tomates confitados, rúcula y parmesano)", establecimiento: "la_vereda", categoria: "sandwiches" },
  { nombre: "Sandwich de milanesa serrana (muzzarela, jamón crudo, rúcula, parmesano)", establecimiento: "la_vereda", categoria: "sandwiches" },
  { nombre: "Sandwich de milanesa completa", establecimiento: "la_vereda", categoria: "sandwiches" },
  { nombre: "Sandwich de bondiola desmenuzada en pan ciabatta", establecimiento: "la_vereda", categoria: "sandwiches" },
  { nombre: "Sandwich de carne desmenuzada al vino tinto con rúcula y aros de cebolla en pan ciabatta", establecimiento: "la_vereda", categoria: "sandwiches" },
  { nombre: "Sandwich de ternera desmechada en pan ciabatta", establecimiento: "la_vereda", categoria: "sandwiches" },
  { nombre: "Sandwich en ciabatta de pollo grillado, jamón, queso, lechuga y tomate", establecimiento: "la_vereda", categoria: "sandwiches" },
  { nombre: "Sandwich en ciabatta de vacío de cerdo desmenuzado", establecimiento: "la_vereda", categoria: "sandwiches" },

  // --- OMELETTES Y TARTAS ---
  { nombre: "Omelette de pollo con mix", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Omelette de pollo y puerro con papas", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Omelette caprese con mix", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Omelette de espinaca y queso con mix", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Omelette de jyq con mix", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Omelette de vegetales con mix", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Omelette a los 4 quesos con mix", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Omelette de 4 quesos con papas", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Omelette caprese con mix verdes", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Tarta de brócoli con mix verdes", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Tarta de panceta y puerro con hojas verdes", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Tarta de puerro, panceta y muzzarela", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Tarta de verdura con mix", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Tarta de verdura y salsa blanca", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Tarta de pollo", establecimiento: "la_vereda", categoria: "omelettes_tartas" },
  { nombre: "Tarta de zapallitos con mix", establecimiento: "la_vereda", categoria: "omelettes_tartas" },

  // --- ENSALADAS ---
  { nombre: "Ensalada Caesar", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada Vereda", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada Chela", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada mediterránea", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada de espinaca, pera caramelizada, roquefort y nuez", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada de espinaca, frutilla, nueces, tomate, huevo y vinagreta de naranja", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada de espinaca, espárragos, cherri y huevo", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada de lentejas, palta, huevo, cherri, zanahoria, vinagreta de limón y mostaza", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada de calabaza asada, mix verdes, tomate cherri, zanahoria, semillas de sésamo y aliño", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada de garbanzos, durazno, cherri, cebolla morada y perejil", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada de espinaca, Roquefort, pera, tomate y vinagreta", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Ensalada de lenteja, zanahoria, remolacha, huevo, choclo y rúcula", establecimiento: "la_vereda", categoria: "ensaladas" },
  { nombre: "Torre de panqueques con mix de verdes", establecimiento: "la_vereda", categoria: "ensaladas" },

  // --- VEGETARIANOS ---
  { nombre: "Milanesa de berenjena con mix verdes", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Milanesa de berenjena napolitana con mix", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Milanesa de calabaza al roquefort con mix", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Milanesa de zucchini a la napolitana con mix", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Milanesa de zucchini a los 4 quesos con mix", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Milanesa de soja napolitana con mix verdes", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Milanesa de soja con queso azul y mix verdes", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Berenjena rellena con mix verdes", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Zapallito relleno de carne con arroz", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Zapallitos rellenos con arroz (vegetariano)", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Calabaza rellena", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Mix de croquetas veggies (espinaca, arroz, papa) con ensalada", establecimiento: "la_vereda", categoria: "vegetarianos" },
  { nombre: "Croquetas de espinaca", establecimiento: "la_vereda", categoria: "vegetarianos", plato_compartido: true },

  // --- GUISOS Y SOPAS ---
  { nombre: "Guiso de lentejas", establecimiento: "la_vereda", categoria: "guisos_sopas" },
  { nombre: "Guiso de pollo y arroz", establecimiento: "la_vereda", categoria: "guisos_sopas" },
  { nombre: "Sopa crema de calabaza con bocaditos de roquefort", establecimiento: "la_vereda", categoria: "guisos_sopas" },

  // --- POSTRES ---
  { nombre: "Tiramisú", establecimiento: "la_vereda", categoria: "postres" },
  { nombre: "Peras al malbec con helado de americana", establecimiento: "la_vereda", categoria: "postres" },
  { nombre: "Arroz con leche", establecimiento: "la_vereda", categoria: "postres" },
  { nombre: "Panqueques flambeados al ron", establecimiento: "la_vereda", categoria: "postres" },
  { nombre: "Torre de panqueques", establecimiento: "la_vereda", categoria: "postres" },
  { nombre: "Brownie sin gluten", establecimiento: "la_vereda", categoria: "postres" },
  { nombre: "Pastafrola sin gluten", establecimiento: "la_vereda", categoria: "postres" },

  // --- ENTRADAS ---
  { nombre: "Empanada de carne", establecimiento: "la_vereda", categoria: "entradas", plato_compartido: true },
  { nombre: "Empanada de vigilia", establecimiento: "la_vereda", categoria: "entradas", plato_compartido: true },
  { nombre: "Provoleta", establecimiento: "la_vereda", categoria: "entradas" }
];

const platosBarIdeal: PlatoInsert[] = [
  // --- PLATOS DEL DÍA (pastas y guisos) ---
  { nombre: "Spaguetis a los 4 quesos", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Spaguetis con albóndigas", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Spaguetis a la carbonara", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Pene rigate con salsa pomodoro", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Polenta con salsa bolognesa", establecimiento: "bar_ideal", categoria: "platos_del_dia", plato_compartido: true },
  { nombre: "Polenta con boloñesa", establecimiento: "bar_ideal", categoria: "platos_del_dia", plato_compartido: true },
  { nombre: "Ñoquis de espinaca con crema de champiñones", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Ñoquis gratinado a los 4 quesos", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Ñoquis de calabaza con crema de cuatro quesos", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Ñoquis mixtos (calabaza y papa) con salsa de champiñones", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Ñoquis de papa con estofado de pollo", establecimiento: "bar_ideal", categoria: "platos_del_dia", plato_compartido: true },
  { nombre: "Ravioles de pollo con salsa de panceta y puerro", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Ravioles de pollo con crema de verdeo", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Canelones de verdura y ricota con salsa mixta", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Lasagna de verdura", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Lasaña de verdura con salsa mixta", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Fetuccinis a la carbonara", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Sorrentinos de jamón y queso con salsa de verdeo", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Zapallitos rellenos de carne con arroz cremoso", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Filet de merluza con puré rústico", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Filet de merluza con puré de papas", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Bondiola braseada con papas rústicas", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Wok de pollo y vegetales", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Wok de vegetales, arroz y salsa de soja", establecimiento: "bar_ideal", categoria: "platos_del_dia", plato_compartido: true },
  { nombre: "Chuleta de cerdo con salsa agridulce and cabutia al horno", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Chuleta de cerdo con salsa agridulce y puré de boniato", establecimiento: "bar_ideal", categoria: "platos_del_dia" },
  { nombre: "Espaguetis con salsa pomodoro", establecimiento: "bar_ideal", categoria: "platos_del_dia" },

  // --- PRINCIPALES CARNES (sugerencias) ---
  { nombre: "Bondiola a la mostaza con papas", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Bondiola a la barbacoa con cabutia asadas", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Bondiola a la barbacoa con batatas fritas", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Bondiola braseada con vegetales al horno", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Matambre de cerdo a la fugaseta con batatas fritas", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Matambre de cerdo a la pizza con papas españolas a la provenzal", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Pechito de cerdo a la barbacoa con puré de batatas", establecimiento: "bar_ideal", categoria: "principales_carnes", plato_compartido: true },
  { nombre: "Pastel de carne mixto", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Pastel de papa", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Pan de carne", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Cazuela de pollo", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Pollo al horno con papas", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Pollo al champiñones con puré de papa rústico", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Pollo al champiñones con papas rústicas", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Pollo relleno con crema de cibulet y puré de calabaza", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Colita de cuadril al horno con salsa criolla y papas rústicas", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Tapa de ternera braseada con papas fritas, ensalada mixta o vegetales al horno", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Vacío braseado con puré", establecimiento: "bar_ideal", categoria: "principales_carnes" },
  { nombre: "Lomo relleno con crema de puerro y papas rústicas", establecimiento: "bar_ideal", categoria: "principales_carnes" },

  // --- PRINCIPALES PESCADOS ---
  { nombre: "Escalope de merluza con puré mixto", establecimiento: "bar_ideal", categoria: "principales_pescados" },
  { nombre: "Escalope de merluza con puré rústico", establecimiento: "bar_ideal", categoria: "principales_pescados" },
  { nombre: "Roll de merluza al roquefort con papas al natural", establecimiento: "bar_ideal", categoria: "principales_pescados" },
  { nombre: "Filet de merluza al roquefort con puré gratinado", establecimiento: "bar_ideal", categoria: "principales_pescados", plato_compartido: true },
  { nombre: "Filet de merluza a la romana con puré de papas", establecimiento: "bar_ideal", categoria: "principales_pescados" },
  { nombre: "Trucha con salsa de limón en colchón de vegetales", establecimiento: "bar_ideal", categoria: "principales_pescados" },
  { nombre: "Trucha con crema de limón y ensalada de rúcula y cherry", establecimiento: "bar_ideal", categoria: "principales_pescados" },
  { nombre: "Risotto con frutos de mar", establecimiento: "bar_ideal", categoria: "principales_pescados" },
  { nombre: "Cazuela de arroz con mariscos", establecimiento: "bar_ideal", categoria: "principales_pescados" },
  { nombre: "Salmón grillado con salsa de lima y menta, con ratatouille de vegetales", establecimiento: "bar_ideal", categoria: "principales_pescados" },
  { nombre: "Ravioles de osobuco al malbec con salsa mixta", establecimiento: "bar_ideal", categoria: "principales_pescados" },

  // --- PRINCIPALES VEGETARIANOS ---
  { nombre: "Risotto de remolacha y queso parmesano", establecimiento: "bar_ideal", categoria: "principales_vegetarianos" },
  { nombre: "Risotto de ragú y hongos", establecimiento: "bar_ideal", categoria: "principales_vegetarianos" },
  { nombre: "Risotto de pollo y hongos", establecimiento: "bar_ideal", categoria: "principales_vegetarianos" },
  { nombre: "Pastel de pollo y calabaza", establecimiento: "bar_ideal", categoria: "principales_vegetarianos" },
  { nombre: "Croquetas de espinaca", establecimiento: "bar_ideal", categoria: "principales_vegetarianos", plato_compartido: true },

  // --- SOPAS / ENTRADAS FUERTES ---
  { nombre: "Sopa crema de calabaza", establecimiento: "bar_ideal", categoria: "sopas_entradas" },
  { nombre: "Sopa de papa y puerro", establecimiento: "bar_ideal", categoria: "sopas_entradas" },

  // --- ENTRADAS / SUGERENCIAS ---
  { nombre: "Empanada de carne (a cuchillo, frita)", establecimiento: "bar_ideal", categoria: "entradas_sugerencias", plato_compartido: true },
  { nombre: "Empanada de vigilia", establecimiento: "bar_ideal", categoria: "entradas_sugerencias", plato_compartido: true },
  { nombre: "Bruschetta con tomate confitado y pesto", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Bruschetta con rúcula y mortadela", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Bruschetta italiana (muzzarela, tomates confitados y rúcula)", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Bastones de muzzarela con salsa barbacoa", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Bocaditos de espinaca y queso azul", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Bocaditos de acelga", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Buñuelos de acelga y queso azul", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Gambas al ajillo", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Gambas rebozadas", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Mejillones a la provenzal", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Croquetas de arroz", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Croquetas de jamón crudo", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Croquetas de verdura y queso azul", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Dúo de bocaditos (espinaca y remolacha)", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Finger de pollo con salsa de barbacoa", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Bomba de papa rellena de queso", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Lengua a la vinagreta", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Brocheta de langostinos envueltos en panceta crocante", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Rabas y langostinos empanados", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },
  { nombre: "Entrada con empanadas y croquetas de jamón", establecimiento: "bar_ideal", categoria: "entradas_sugerencias" },

  // --- CARTA FIJA / PLATOS ESPECIALES ---
  { nombre: "Rotolo", establecimiento: "bar_ideal", categoria: "carta_fija" },
  { nombre: "Bife de chorizo con papas y huevo", establecimiento: "bar_ideal", categoria: "carta_fija" },
  { nombre: "Costillar al horno con papas y batatas", establecimiento: "bar_ideal", categoria: "carta_fija" },
  { nombre: "Matambre arrollado con ensalada rusa", establecimiento: "bar_ideal", categoria: "carta_fija" },
  { nombre: "Milanesas de ternera o pollo con fritas o ensaladas", establecimiento: "bar_ideal", categoria: "carta_fija" },
  { nombre: "Colita de cuadril al horno con salsa criolla y papas rústicas", establecimiento: "bar_ideal", categoria: "carta_fija" },
  { nombre: "Bondiola de cerdo a la mostaza con papas rústicas", establecimiento: "bar_ideal", categoria: "carta_fija" },

  // --- PASTA / PIZZA GRUPAL ---
  { nombre: "Pasta italiana Barilla - bolognesa", establecimiento: "bar_ideal", categoria: "pasta_pizza_grupal" },
  { nombre: "Pizzas (menú grupal, opción 1)", establecimiento: "bar_ideal", categoria: "pasta_pizza_grupal" },

  // --- CAFETERÍA Y PANIFICADOS ---
  { nombre: "Medialunas caseras", establecimiento: "bar_ideal", categoria: "cafeteria" },
  { nombre: "Croissant", establecimiento: "bar_ideal", categoria: "cafeteria" },
  { nombre: "Tostado jamón y queso", establecimiento: "bar_ideal", categoria: "cafeteria" },
  { nombre: "Mini sandwichs fríos", establecimiento: "bar_ideal", categoria: "cafeteria" },
  { nombre: "Facturas", establecimiento: "bar_ideal", categoria: "cafeteria" },
  { nombre: "Panes", establecimiento: "bar_ideal", categoria: "cafeteria" },
  { nombre: "Tortas (variedad a elección)", establecimiento: "bar_ideal", categoria: "cafeteria" },
  { nombre: "Alfajores (BLAUSUS)", establecimiento: "bar_ideal", categoria: "cafeteria" },
  { nombre: "Churros", establecimiento: "bar_ideal", categoria: "cafeteria" },

  // --- POSTRES ---
  { nombre: "Budín de pan de medialunas caseras", establecimiento: "bar_ideal", categoria: "postres" },
  { nombre: "Torrejas", establecimiento: "bar_ideal", categoria: "postres" },
  { nombre: "Flan (casero mixto)", establecimiento: "bar_ideal", categoria: "postres" },
  { nombre: "Panacota de frutos rojos", establecimiento: "bar_ideal", categoria: "postres" },
  { nombre: "Brownie con helado de americana y frutos rojos", establecimiento: "bar_ideal", categoria: "postres" }
];

async function seed() {
  console.log('Iniciando carga de base de datos...');
  try {
    // 1. Ejecutar esquema si es necesario
    // Nota: El esquema debe haberse creado antes, pero por si acaso, podemos leer el schema.sql e insertarlo
    const fs = await import('fs');
    const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Aplicando esquema schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await sql.unsafe(schemaSql);
      console.log('Esquema SQL aplicado con éxito.');
    }

    // 2. Limpiar platos anteriores para evitar duplicados
    console.log('Limpiando tabla de platos anterior...');
    await sql`TRUNCATE TABLE platos RESTART IDENTITY CASCADE;`;

    // 3. Unir platos
    const todosLosPlatos = [...platosLaVereda, ...platosBarIdeal];
    console.log(`Insertando ${todosLosPlatos.length} platos en la base de datos...`);

    // Insertar en lotes o uno por uno
    for (const plato of todosLosPlatos) {
      await sql`
        INSERT INTO platos (nombre, establecimiento, categoria, plato_compartido)
        VALUES (${plato.nombre}, ${plato.establecimiento}, ${plato.categoria}, ${plato.plato_compartido || false})
      `;
    }

    console.log('Carga finalizada con éxito.');
  } catch (error) {
    console.error('Error durante el seeding:', error);
  } finally {
    await sql.end();
  }
}

seed();
