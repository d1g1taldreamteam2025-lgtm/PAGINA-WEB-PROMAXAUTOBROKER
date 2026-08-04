#!/usr/bin/env python3
"""Ajusta el arte que llega de ChatGPT a las medidas EXACTAS del hero del sitio.

Uso:
    python3 hero-fit.py pc  entrada.png  salida.webp   # -> 1942x809  (2.40:1)
    python3 hero-fit.py mov entrada.png  salida.webp   # -> 1122x1402 (0.80:1)

Recorta CENTRADO al ratio destino (perdiendo solo los margenes sacrificables
de arriba/abajo que el prompt reserva como zona no-critica), reescala con
Lanczos y guarda WebP q90 — mismos parametros que el resto de /assets/img/heroes/.
"""
import sys
from PIL import Image

DESTINOS = {"pc": (1942, 809), "mov": (1122, 1402)}


def encajar(modo, origen, destino):
    W, H = DESTINOS[modo]
    im = Image.open(origen).convert("RGB")
    w, h = im.size
    objetivo = W / H

    # Recorte centrado al ratio destino: se sacrifica alto o ancho, nunca ambos.
    if w / h > objetivo:
        nw = int(round(h * objetivo))
        caja = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
    else:
        nh = int(round(w / objetivo))
        caja = (0, (h - nh) // 2, w, (h - nh) // 2 + nh)

    recortada = im.crop(caja).resize((W, H), Image.LANCZOS)
    recortada.save(destino, "WEBP", quality=90, method=6)

    perdido_v = 100 * (1 - (caja[3] - caja[1]) / h)
    perdido_h = 100 * (1 - (caja[2] - caja[0]) / w)
    print(f"{origen} {w}x{h} -> {destino} {W}x{H} "
          f"(recorte vertical {perdido_v:.1f}%, horizontal {perdido_h:.1f}%)")


if __name__ == "__main__":
    if len(sys.argv) != 4 or sys.argv[1] not in DESTINOS:
        print(__doc__)
        sys.exit(1)
    encajar(sys.argv[1], sys.argv[2], sys.argv[3])
