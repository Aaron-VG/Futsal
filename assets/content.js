/* Vídeos por categoría + teoría. Para añadir un vídeo de YouTube: { type: "yt", id: "ID", short: true|false, ... } */
window.VIDEO_CATS = [
  {
    id: "basicos",
    title: "Conceptos básicos",
    theory: `
      <h3>El juego</h3>
      <p>Cinco contra cinco: un portero y cuatro jugadores de campo. Los cambios son ilimitados y volantes, siempre por la zona de cambios. Se juegan dos partes de 20 minutos a reloj parado.</p>
      <h3>Reglas que más se notan</h3>
      <p>Saques de banda y de esquina con el pie, en menos de 4 segundos. El portero no puede tener el balón controlado en su campo más de 4 segundos. Desde la 6ª falta acumulada en una parte, cada falta es un tiro libre directo sin barrera desde el doble penalti (10 m).</p>
      <h3>Las posiciones</h3>
      <p><b>Portero (1)</b>, <b>cierre (2)</b>, el último defensa y quien organiza; <b>alas (3 y 4)</b>, que ocupan las bandas; y <b>pívot (5)</b>, el más adelantado, de espaldas a la portería.</p>`,
    terms: [],
    videos: [
      { type: "mp4", src: "videos/conceptos-basicos.mp4", poster: "videos/conceptos-basicos.jpg",
        tag: "Nuestro vídeo", title: "Fútbol sala: conceptos básicos", desc: "La pista, los jugadores, el tiempo, la regla de los 4 segundos, las faltas acumuladas, los sistemas y la defensa. 3 min." },
    ],
  },
  {
    id: "rotaciones",
    title: "Rotaciones y ataque 3-1",
    theory: `
      <h3>El sistema 3-1</h3>
      <p>Tres jugadores atrás (el cierre y los dos alas) mueven el balón, y el pívot se queda arriba fijando a la defensa. Visto desde arriba es un rombo.</p>
      <h3>Por qué rotamos</h3>
      <p>Si cada uno se queda en su sitio, la defensa nos tiene controlados. Al rotar, el defensor tiene que decidir si sigue a su jugador o cambia de marca, y en esa duda aparecen los espacios. La rotación no para: cada vez que el balón llega a un ala, el que ha pasado sigue su pase.</p>
      <h3>Rotación cierre al ala</h3>
      <p>El cierre pasa al ala y sigue su pase. Va hacia el ala y ocupa la banda. El ala baja a la posición de cierre con el balón y hace lo mismo hacia el otro lado.</p>
      <h3>Opciones del corte del cierre</h3>
      <p>Cuando el cierre corta hacia el ala, puede recibir en <b>paralela</b> (por fuera, pegado a la banda) o con una <b>pared</b> (por dentro, de primeras). Si al ala le aprietan, el cierre puede ir a hacerle un <b>bloqueo</b> o una <b>cortina</b> para liberarlo.</p>
      <h3>Corte del ala</h3>
      <p>El ala entra entre líneas, entre los defensores de delante y los de atrás. Esto crea dudas en la defensa y abre opciones de pared o de paralela. También deja la banda libre para que el pívot reciba allí con facilidad.</p>`,
    terms: [
      { name: "Paralela", text: "Pase hacia delante pegado a la banda, para el compañero que corta por fuera.", play: "corte-cierre-paralela" },
      { name: "Pared (uno-dos)", text: "Paso al compañero y me la devuelve de primeras mientras sigo corriendo.", play: "corte-cierre-pared" },
      { name: "Bloqueo / cortina", text: "Me pongo en el camino del defensor de un compañero para que este salga libre.", play: "corte-cierre-bloqueo" },
      { name: "Corte entre líneas", text: "Desmarque en diagonal hacia el centro, entre los defensores de delante y los de atrás.", play: "corte-ala" },
      { name: "Apoyo del pívot", text: "El pívot baja unos metros a recibir para descargar el balón a un compañero que llega.", play: "jugada-rompe-defensas" },
      { name: "Segundo palo", text: "El poste más lejano al pasador. Es un sitio ideal para llegar desde el lado contrario y empujarla.", play: "jugada-rompe-defensas" },
    ],
    videos: [
      { type: "mp4", src: "videos/rotaciones-y-jugadas.mp4", poster: "videos/rotaciones-y-jugadas.jpg",
        tag: "Nuestro vídeo", title: "Rotaciones, movimientos y jugadas del 3-1", desc: "La rotación cierre al ala, sus opciones (paralela, pared y bloqueo), el corte del ala, la jugada «rompe defensas» y la defensa 1-2-1." },
      { type: "yt", id: "H6pgaN1juig", short: true, tag: "Vídeo del entrenador",
        title: "Rotación que rompe defensas en 5 segundos (3-1 rombo)", desc: "Futsal Training. Rotación cierre al ala y jugada con apoyo del pívot y pase al segundo palo." },
      { type: "yt", id: "c-IuaU12R74", tag: "Vídeo del entrenador",
        title: "Iniciación a la rotación del 3-1 sin pívot", desc: "FUTS4LL (Ángel Ros). Corte del cierre (minuto 0:07) y corte del ala (minuto 1:28)." },
    ],
  },
  {
    id: "defensa",
    title: "Defensa",
    theory: `
      <h3>Defensa en zona 1-2-1 (rombo)</h3>
      <p>Cada jugador defiende una zona, no a un jugador concreto. Uno delante (5), dos en medio (3 y 4) y el cierre atrás (2), cerca del pívot rival y de nuestra portería.</p>
      <h3>Cómo se mueve el rombo</h3>
      <p>El rombo se mueve entero hacia el lado del balón (<b>basculación</b>). Cuando el balón va a una banda, el jugador de ese lado sale a presionarlo y el de delante cierra el pase por dentro. El del lado contrario se mete hacia el centro para vigilar el segundo palo, y el cierre sigue al pívot rival por ese lado.</p>
      <h3>Claves</h3>
      <p>Nos movemos todos a la vez y a la vez que el balón. Las distancias entre nosotros tienen que ser cortas. Y nunca dejamos libre el centro ni el pase al pívot.</p>`,
    terms: [
      { name: "Basculación", text: "Todo el bloque defensivo se desplaza hacia el lado del balón y vuelve cuando el balón cambia de lado.", play: "defensa-zona-121" },
      { name: "Defensa en zona", text: "Cada uno defiende un espacio y al rival que entra en él, en lugar de seguir siempre a un jugador.", play: "defensa-zona-121" },
    ],
    videos: [
      { type: "yt", id: "SGD7Gqmh62c", short: true, tag: "Vídeo del entrenador",
        title: "Defensa en zona 1-2-1 (2º vídeo)", desc: "Fernando Martín. Posiciones básicas de la defensa en zona en rombo y cómo se mueven con el balón." },
      { type: "mp4", src: "videos/rotaciones-y-jugadas.mp4", poster: "videos/rotaciones-y-jugadas.jpg", start: 167.5,
        tag: "Nuestro vídeo", title: "La defensa 1-2-1, en nuestro vídeo de rotaciones", desc: "La última parte del vídeo explica el rombo defensivo paso a paso." },
    ],
  },
];
