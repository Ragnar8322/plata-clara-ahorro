const KEYWORD_EMOJI: [string[], string][] = [
  [["ps5", "ps4", "playstation", "xbox", "nintendo", "switch", "consola"], "🎮"],
  [["viaje", "vacacion", "vacaciones", "tiquete", "vuelo", "crucero"], "✈️"],
  [["moto", "motocicleta"], "🏍️"],
  [["bicicleta", "bici"], "🚲"],
  [["carro", "auto", "vehiculo", "camioneta"], "🚗"],
  [["casa", "apartamento", "apto", "vivienda", "finca"], "🏠"],
  [["laptop", "portatil", "computador", "computadora", "pc"], "💻"],
  [["celular", "iphone", "telefono", "smartphone"], "📱"],
  [["camara"], "📷"],
  [["boda", "matrimonio"], "💍"],
  [["bebe", "bebé"], "👶"],
  [["estudio", "universidad", "curso", "maestria", "posgrado", "colegiatura"], "🎓"],
  [["salud", "emergencia", "medico", "cirugia"], "🏥"],
  [["ropa", "zapatos", "tenis"], "👕"],
  [["mueble", "sofa", "sala"], "🛋️"],
  [["tv", "televisor", "pantalla"], "📺"],
  [["gimnasio", "gym"], "💪"],
  [["mascota", "perro", "gato"], "🐾"],
  [["regalo"], "🎁"],
  [["fiesta", "cumpleanos", "cumpleaños"], "🎉"],
  [["guitarra", "instrumento", "piano", "bateria"], "🎸"],
  [["reloj"], "⌚"],
  [["libro", "libros"], "📚"],
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function sugerirEmoji(nombre: string): string | null {
  const texto = normalizar(nombre);
  if (!texto.trim()) return null;

  for (const [palabras, emoji] of KEYWORD_EMOJI) {
    if (palabras.some((p) => texto.includes(normalizar(p)))) {
      return emoji;
    }
  }
  return null;
}
