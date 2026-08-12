# Ronda

Ronda es una red social de descubrimiento de ropa usada: publicá tus prendas,
descubrí las de otras personas deslizando (swipe), seguí a vendedores que te
gusten y contactalos directamente por Instagram, WhatsApp o Facebook. No hay
pagos, envíos, billetera ni chat dentro de la app — el contacto y el acuerdo
de venta se hacen por fuera, en las redes del vendedor.

Este repo es un scaffold de MVP: prioriza tener pantallas funcionando de
punta a punta por sobre el pulido visual o la cobertura de casos borde.

## Stack técnico

- **Expo + TypeScript + Expo Router** (app única en la raíz del repo, sin
  monorepo).
- **Firebase**: Auth (email/contraseña + Google), Firestore, Storage.
- **TanStack Query** para el estado de servidor (fetch/cache/mutaciones) y
  **Zustand** para estado de cliente (sesión de auth, filtros de búsqueda).
- **react-native-gesture-handler + react-native-reanimated** para el mazo de
  swipe de Descubrir.
- UI en español, sin librerías de componentes externas (estilos con
  `StyleSheet` planos, a propósito, para mantener el scaffold simple).

## Estructura del proyecto

```
src/
  app/                  Rutas de Expo Router (file-based routing)
    (auth)/             login, registro, onboarding (sin sesión / sin perfil)
    (tabs)/             Descubrir, Siguiendo, Buscar, Avisos, Perfil
    listing/            detalle, alta y edición de publicaciones
    user/[id]            perfil público de otro usuario
    followers/[id], following/[id]
    my-listings, edit-profile, pro-request, rate/[userId]
  components/           UI compartida (Button, TextField, SwipeDeck, etc.)
  constants/            colores, categorías/talles/estados, límites de negocio
  features/             lógica de datos por dominio (auth, users, listings,
                         ratings, discovery, pro, notifications), cada una con
                         un archivo *Api.ts (Firestore/Storage) y hooks de
                         TanStack Query
  lib/                  inicialización de Firebase, query client, upload
  store/                stores de Zustand (sesión de auth, filtros)
  types/                modelo de datos compartido (TypeScript)
  utils/                deep links de contacto, formateo, validaciones

firestore.rules         reglas de seguridad de Firestore
storage.rules           reglas de seguridad de Storage
firestore.indexes.json  índices compuestos necesarios
firebase.json           referencia a los archivos de reglas/índices
```

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear un proyecto de Firebase

1. Creá un proyecto en <https://console.firebase.google.com>.
2. Habilitá **Authentication** → método **Email/contraseña** y **Google**.
3. Creá una base de **Firestore** (modo producción) y un bucket de
   **Storage**.
4. En "Configuración del proyecto" → "Tus apps", registrá una app web y
   copiá las credenciales del SDK.

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Completá `EXPO_PUBLIC_FIREBASE_*` con los datos del paso anterior. Todas
empiezan con `EXPO_PUBLIC_` porque Expo solo expone al bundle del cliente las
variables con ese prefijo; ninguna es secreta (es la config pública del SDK
web de Firebase).

Para el login con Google necesitás además crear credenciales OAuth en
[Google Cloud Console](https://console.cloud.google.com/apis/credentials) (un
client ID de tipo "Web" y, si vas a compilar apps nativas, uno de iOS y otro
de Android) y completar `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`. Si no las
completás, el botón "Continuar con Google" muestra un aviso en vez de
fallar silenciosamente.

### 4. Desplegar las reglas de seguridad (opcional pero recomendado)

Con la [CLI de Firebase](https://firebase.google.com/docs/cli):

```bash
firebase login
firebase use --add   # elegí tu proyecto
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

### 5. Correr la app

```bash
npx expo start
```

Escaneá el QR con la app Expo Go (Android) o la cámara (iOS), o presioná `i`
/ `a` para abrir un simulador si tenés el entorno nativo configurado.

### Scripts disponibles

| Script              | Descripción                                  |
| ------------------- | --------------------------------------------- |
| `npm run start`     | Inicia el servidor de desarrollo de Expo      |
| `npm run ios`       | Abre en simulador de iOS                      |
| `npm run android`   | Abre en emulador/dispositivo Android          |
| `npm run web`       | Corre la versión web (soporte parcial)        |
| `npm run lint`      | ESLint (`eslint-config-expo`)                 |
| `npm run typecheck` | Chequeo de tipos con `tsc --noEmit`           |

## Modelo de datos (Firestore)

```
users/{uid}
  username, usernameLower, displayName, bio, avatarUrl, city,
  socialLinks: { instagram?, whatsapp?, facebook? },
  isPro, proSince,
  listingCount, activeListingCount,      ← contadores denormalizados
  followerCount, followingCount,         ← contadores denormalizados
  ratingAvg, ratingCount,                ← contadores denormalizados
  createdAt, updatedAt

  users/{uid}/following/{targetUid}      → { uid, username, displayName, avatarUrl, createdAt }
  users/{uid}/followers/{followerUid}    → { uid, username, displayName, avatarUrl, createdAt }
  users/{uid}/interactions/{listingId}   → { listingId, action: 'like'|'pass', createdAt }
  users/{uid}/notifications/{id}         → { type, title, body, read, createdAt, data? }

listings/{listingId}
  sellerId,
  sellerUsername, sellerDisplayName, sellerAvatarUrl, sellerIsPro,  ← denormalizado del vendedor
  title, description, price, category, size, condition, color, city,
  photos: string[] (1 a 5),
  status: 'active' | 'sold' | 'archived',
  likeCount,
  createdAt, updatedAt

ratings/{ratingId}   (inmutables una vez creadas)
  raterId, raterUsername, raterDisplayName, raterAvatarUrl,  ← denormalizado de quien califica
  ratedUserId, listingId?, listingTitle?,
  stars (1-5), comment,
  createdAt

pro_account_requests/{requestId}
  userId, userUsername, userDisplayName,  ← denormalizado del solicitante
  message, status: 'pending' | 'approved' | 'rejected',
  reviewerNote, createdAt, reviewedAt
```

### Contadores denormalizados y límites conocidos

Este scaffold **no usa Cloud Functions**. Los contadores
(`followerCount`, `followingCount`, `listingCount`, `activeListingCount`,
`ratingAvg`, `ratingCount`) se recalculan y escriben desde el propio cliente
dueño del documento:

- `listingCount` / `activeListingCount`: se actualizan de forma atómica
  cuando el vendedor crea, cambia el estado o borra su propia publicación
  (siempre auto-escritura, es seguro).
- `followingCount`: se actualiza cuando el propio usuario sigue/deja de
  seguir a alguien (auto-escritura).
- `followerCount` y `ratingAvg`/`ratingCount`: dependen de acciones de
  **otros** usuarios (que te sigan, que te califiquen). Por eso se
  recalculan mediante `refreshOwnAggregates()` (consultas de conteo +
  promedio) cada vez que el propio usuario abre la pestaña "Perfil". Esto
  significa que estos números pueden estar unos segundos/minutos
  desactualizados hasta que el usuario dueño vuelva a abrir su perfil.

Para producción, la recomendación es mover este mantenimiento a **Cloud
Functions** (Firestore triggers `onCreate`/`onDelete` en `followers`,
`ratings`, etc.) para que los contadores sean 100% autoritativos e
inmediatos. Las reglas de seguridad (`firestore.rules`) están escritas para
que ningún cliente pueda alterar los contadores de **otro** usuario ni
otorgarse `isPro` a sí mismo.

### Cuentas PRO

`isPro` **no se puede activar desde el cliente**: las solicitudes se crean en
`pro_account_requests` con estado `pending`, y quedan pendientes de una
revisión manual (por ahora, desde la consola de Firebase, editando
directamente el documento en `users/{uid}` y en la solicitud). Es la única
pieza de moderación manual del MVP; documentarla acá para que no se confunda
con un bug.

Límites de publicaciones activas (`src/constants/limits.ts`):

- Cuenta gratuita: 5 publicaciones activas.
- Cuenta PRO: 50 publicaciones activas.

## Búsqueda

Firestore no tiene búsqueda de texto completo nativa. La pantalla de Buscar
trae las publicaciones activas (ordenadas por fecha, con un único índice
simple) y filtra por categoría/talle/estado/ciudad/precio/texto en el
cliente. Es una solución razonable para el volumen de datos de un MVP; si el
catálogo crece mucho conviene integrar Algolia/Typesense o Firestore
Vector/Full-text search.

## Contacto vendedor-comprador

No hay chat dentro de la app. Desde el detalle de una publicación (y desde el
perfil del vendedor) se muestran botones que abren deep links a:

- Instagram (`instagram://` / `https://instagram.com/<usuario>`)
- WhatsApp (`https://wa.me/<telefono>?text=...`)
- Facebook (`https://facebook.com/<usuario>`)

Ver `src/utils/deepLinks.ts`.

## Fuera de alcance (a propósito)

- Pagos, cobros o comisiones.
- Envíos / logística.
- Billetera o saldo dentro de la app.
- Chat / mensajería interna.
- Panel de administración (la moderación de cuentas PRO es manual, ver
  arriba).
- Push notifications reales (hay una bandeja de notificaciones en Firestore,
  pero no está integrado Firebase Cloud Messaging / Expo Notifications; ver
  "Notificaciones" abajo).

## Notificaciones (stub)

`users/{uid}/notifications` guarda avisos in-app (nuevo seguidor, nueva
calificación) que se crean directamente desde el cliente que dispara la
acción (ver reglas de seguridad). La pestaña "Avisos" los lista y permite
marcarlos como leídos. No hay integración con push notifications (FCM/Expo
Notifications) todavía — es el siguiente paso natural para pasar de "stub" a
notificaciones reales.

## Plan de pruebas manual

Checklist para validar el MVP de punta a punta con un proyecto de Firebase
real conectado (dos cuentas de prueba ayudan a probar follow/rating):

### Autenticación y onboarding

1. Registrarse con email + contraseña → debería pedir completar usuario,
   nombre y ciudad (onboarding) antes de entrar a las tabs.
2. Cerrar la app y volver a abrirla → debería mantener la sesión (persistencia
   con AsyncStorage) y entrar directo a Descubrir.
3. Cerrar sesión desde Perfil → debería volver a la pantalla de login.
4. Iniciar sesión con credenciales incorrectas → debería mostrar un mensaje de
   error en español, sin crashear.
5. (Si está configurado Google) Iniciar sesión con Google → debería crear
   sesión y, si es la primera vez, pedir onboarding igual que con email.

### Perfil y redes sociales

6. Editar perfil: cambiar nombre, bio, ciudad, foto y redes (Instagram,
   WhatsApp, Facebook) → los cambios deben reflejarse en Perfil.
7. Ver el perfil de otro usuario (`user/[id]`) → deben verse sus redes, su
   calificación y sus publicaciones activas.

### Follow / seguidores

8. Seguir a otro usuario desde su perfil o desde el detalle de una
   publicación → el botón cambia a "Siguiendo" y el contador `followingCount`
   propio se actualiza.
9. Dejar de seguir → el botón vuelve a "Seguir".
10. Abrir "Seguidores"/"Siguiendo" desde el propio perfil o el de otro
    usuario → debe listar los usuarios correctos con link a su perfil.

### Publicaciones (listings)

11. Publicar una prenda con 1 a 5 fotos, completando categoría/talle/estado/
    precio → debe aparecer en "Mis publicaciones" y en Descubrir/Buscar de
    otras cuentas.
12. Intentar subir una 6ª foto → el selector debe bloquear el límite de 5.
13. Editar una publicación (texto, fotos, precio) → los cambios deben
    reflejarse en el detalle.
14. Cambiar el estado a "Vendido" y a "Archivado" → debe desaparecer de
    Descubrir/Buscar (ambos solo muestran `active`) y el contador
    `activeListingCount` debe bajar.
15. Alcanzar el límite de publicaciones activas (5 en cuenta gratuita) →
    "Publicar" debe bloquearse con un aviso, hasta archivar/vender alguna o
    pedir cuenta PRO.
16. Eliminar una publicación → debe desaparecer de todos lados y ajustar los
    contadores.

### Descubrimiento (swipe) y feed

17. En "Descubrir", deslizar a la derecha (o tocar el corazón) sobre una
    publicación → debe registrar un "me gusta" (no debe volver a aparecer en
    la cola) y sumar 1 al `likeCount` de la publicación.
18. Deslizar a la izquierda (o tocar la X) → debe registrar un "paso" y
    tampoco volver a aparecer.
19. Seguir a un vendedor y verificar que sus publicaciones activas aparecen
    en la pestaña "Siguiendo".

### Búsqueda

20. Buscar por texto y aplicar filtros (categoría, talle, estado, ciudad,
    precio máximo) → los resultados deben respetar todos los filtros
    combinados.

### Contacto y calificación

21. Desde el detalle de una publicación ajena, tocar Instagram/WhatsApp/
    Facebook → debe abrir la app o el navegador con el deep link
    correspondiente (si el vendedor cargó esa red).
22. Calificar a un vendedor (desde el detalle de una publicación o desde su
    perfil) con estrellas + comentario → debe generarle una notificación y,
    al volver a intentar calificar la misma publicación, debe avisar que ya
    lo calificaste.

### Cuenta PRO

23. Solicitar cuenta PRO con un mensaje → el estado debe quedar "en revisión"
    y no permitir enviar otra solicitud mientras esté pendiente.
24. (Simulando aprobación manual desde la consola de Firebase: marcar
    `isPro: true` en el documento del usuario) → el límite de publicaciones
    activas debe subir a 50 y debe verse la insignia "PRO".

### Notificaciones

25. Generar una notificación (seguir a alguien, calificarlo) desde otra
    cuenta → debe aparecer en "Avisos" con el badge de no leído en la tab, y
    marcarse como leída al abrirla.

## Verificación automática incluida en este PR

- `npm run typecheck` (TypeScript en modo estricto) sin errores.
- `npm run lint` (ESLint con `eslint-config-expo`) sin errores.
- `npx expo export --platform web` genera correctamente las 28 rutas
  estáticas de la app (smoke test de que todas las pantallas montan sin
  errores de import/render).
