---
name: palabras-nuevas
description: Incorpora al juego de vocabulario (la app de Vercel) las palabras de inglés de una hoja de Daniela a partir de una foto o recorte del móvil — las lee, revisa sus traducciones, las clasifica en su categoría sin duplicar y las escribe directamente en la BD de la nube. Úsalo cuando te pasen una foto/recorte de una hoja de vocabulario o digan "palabras nuevas", "entran estas palabras", "añade esta hoja".
---

# Palabras nuevas desde una foto de la hoja

Daniela repasa en https://v0-interactive-english-quiz.vercel.app/ eligiendo **categorías**: lo que
entra en el examen tiene que estar en una categoría que coincida con su hoja, sin repetidas ni basura.

## Dónde viven las palabras

- **La BD de la nube manda** (MariaDB del hosting, credenciales en `.env.local`, que no se sube).
  Todo se hace con `bash scripts/vocab.sh` (necesita Docker Desktop arrancado: `docker desktop start`).
- `init-database.sql` es solo una **copia** para levantar la app en local; se regenera desde la nube
  con `bash scripts/vocab.sh export` después de cada cambio. Nunca se edita a mano para añadir palabras.
- No uses el panel de administración de la app para importar: crea filas repetidas y sus borrados
  no llegan a la BD.
- `data/words.json`, `public/vocabulary.csv` y `app/api/words` son restos antiguos: no se tocan.

## 1. Leer la hoja

1. La foto llega pegada en el chat o como fichero (`@...jpeg`, normalmente en la raíz del repo).
2. Suele venir girada y la columna a mano cuesta leerla. Si dudas, amplía y gira la zona con
   PowerShell y guarda el resultado en el **scratchpad**, nunca en el repo:
   ```powershell
   Add-Type -AssemblyName System.Drawing
   $src = [System.Drawing.Image]::FromFile("<ruta foto>")
   $x=140; $y=1150; $w=790; $h=560   # zona a recortar, en píxeles de la foto
   $bmp = New-Object System.Drawing.Bitmap ($w*2),($h*2)
   $g = [System.Drawing.Graphics]::FromImage($bmp); $g.InterpolationMode = 'HighQualityBicubic'
   $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0,0,($w*2),($h*2)), (New-Object System.Drawing.Rectangle $x,$y,$w,$h), 'Pixel')
   $bmp.RotateFlip('Rotate270FlipNone')   # o Rotate90FlipNone, según el giro
   $bmp.Save("<scratchpad>\zoom.png"); $g.Dispose(); $bmp.Dispose(); $src.Dispose()
   ```
3. **El inglés impreso manda.** La columna en castellano la escribe Daniela a mano y **puede estar
   mal** (ya pasó: puso "calcetines" al lado de *shoe*). Revisa cada traducción:
   - si es correcta, usa la suya (aunque haya otras posibles: es la que ella estudia);
   - si está mal, pon la correcta y apúntalo para avisar de que **corrija su hoja** antes del examen;
   - si no se lee o falta, pon la tuya y márcala como propuesta.
4. El título de la hoja (p. ej. "CLOTHES") es la categoría.

## 2. Clasificar sin duplicar

```bash
bash scripts/vocab.sh check                 # categorías, palabras, repetidas, partidas
bash scripts/vocab.sh words "Clothes"       # lo que ya tiene una categoría
```

- Las categorías se llaman **en inglés, como el título de la hoja** (Clothes, Animals, School,
  Daily Routine…). Si la hoja es de un tema que ya existe, se usa esa categoría.
- **El tema ya existe**: déjalo igual que la hoja — añade las que falten, corrige la traducción si la de
  la hoja es distinta y correcta, y no toques las que coinciden. Las palabras de la categoría que no
  salen en la hoja **no se borran sin preguntar**; dilas en el resumen.
- **Tema nuevo**: crea la categoría con el título de la hoja.
- Que una palabra esté también en otra categoría es normal (*watch* está en Clothes y en Time).
  Lo que no puede haber es la misma palabra dos veces en la misma categoría.
- Nunca categorías por fecha o por examen ("Lunes1205", "Repaso jueves"): así se llenó de basura.

## 3. Formato

- **english**: en minúsculas (salvo nombres propios, *English*…), sin artículos ni *to*, tal cual lo
  escribe la hoja (`t-shirt`, `baseball cap`). El juego exige escribir exactamente esto: una sola
  respuesta por palabra; si la hoja da dos (`big / large`), pregunta cuál.
- **spanish**: en minúsculas, con tildes, sin artículo, con el mismo número que el inglés
  (`sock` → `calcetín`, `boots` → `botas`).
- Máximo 100 caracteres. En SQL, comilla simple duplicada (`o''clock`).

## 4. Aplicar en la nube

1. Si todo se lee bien y no hay dudas, aplica directamente. Si hay palabras ilegibles o traducciones
   dudosas, enseña antes la tabla y espera el OK.
2. Escribe los cambios en un `.sql` en el **scratchpad** (sin `START TRANSACTION`/`COMMIT`; los pone
   el script). Las categorías y palabras se identifican por nombre, nunca con id escritos a mano:
   ```sql
   -- categoría nueva (si hace falta)
   INSERT INTO categories (id, name) SELECT UUID(), 'Weather' FROM DUAL
     WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Weather');
   -- palabra nueva, solo si no está ya en esa categoría
   INSERT INTO words (id, english, spanish, category_id)
     SELECT UUID(), 'rain', 'lluvia', c.id FROM categories c
     WHERE c.name = 'Weather'
       AND NOT EXISTS (SELECT 1 FROM words w WHERE w.category_id = c.id AND LOWER(w.english) = 'rain');
   -- traducción corregida
   UPDATE words w JOIN categories c ON c.id = w.category_id
     SET w.spanish = 'mochila' WHERE c.name = 'Clothes' AND LOWER(w.english) = 'bag';
   ```
3. `bash scripts/vocab.sh apply <scratchpad>/cambios.sql`, después `bash scripts/vocab.sh words "<Categoría>"`
   para comprobar que la categoría queda igual que la hoja, y `check` (0 repetidas, 0 tildes rotas).
4. Si vas a borrar algo o a cambiar mucho, antes `bash scripts/vocab.sh backup` (guarda fuera del repo).
   Si en algún momento hay que fusionar o borrar categorías, primero se mueven sus filas de
   `game_categories` a la categoría que se queda: borrar una categoría borra esas referencias del
   historial de partidas de Daniela.

## 5. Copia en el repo, limpieza y resumen

- `bash scripts/vocab.sh export` y commit (sin push, salvo que lo pidan) solo de `init-database.sql`:
  `vocab: <Categoría> (+N nuevas, M corregidas)`.
- Borra la foto si la dejaron en el repo (las imágenes de la raíz están en `.gitignore`, pero no deben
  quedarse). Los recortes, en el scratchpad.
- Resumen corto:
  - tabla `english | spanish | estado` (nueva / traducción cambiada / igual);
  - ⚠ lo que Daniela tiene que **corregir en su hoja**;
  - palabras de la categoría que no salen en la hoja, si las hay;
  - la categoría que tiene que marcar en el juego (ya está en la web, basta con recargar).
