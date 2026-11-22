# Fútbol sala · Pizarra del equipo

Web del equipo (verde y blanco) con:

- **Jugadas**: rotaciones del 3-1, jugadas de ataque y defensa en zona 1-2-1, animadas paso a paso.
- **Pizarra**: mueve jugadores y balón, dibuja flechas y crea y guarda tus propias jugadas.
- **Vídeos y teoría**: vídeos por categoría (conceptos básicos, rotaciones y ataque, defensa) con la teoría y los movimientos clave.

## Publicar con GitHub Pages
Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
La web queda en `https://aaron-vg.github.io/Futsal/`.

## Añadir o cambiar jugadas
Las jugadas están en `tools/plays_src.py` (coordenadas en metros: x de 0 a 40 hacia la portería rival, y de 0 a 20).
Después de editarlas, ejecuta:

```
python3 tools/plays_src.py
```

Eso regenera `data/plays.json` y `data/plays.js`, que es lo que lee la web.

## Añadir vídeos
Edita `assets/content.js`. Para un vídeo de YouTube: `{ type: "yt", id: "ID_DEL_VIDEO", short: true, tag, title, desc }`.
Para un vídeo propio, súbelo a `videos/` y usa `{ type: "mp4", src: "videos/archivo.mp4", poster: "videos/archivo.jpg", ... }`.
