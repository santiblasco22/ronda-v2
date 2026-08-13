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
| `npm run test:rules`| Tests de `firestore.rules` contra el emulador |

`npm run test:rules` levanta el emulador de Firestore (necesita Java 11+ y
descarga `firebase-tools` con `npx` la primera vez) y corre
`tests/rules/firestore.test.mjs`, que verifica cada garantía de seguridad
descrita más abajo. No toca ningún proyecto real: usa el proyecto de mentira
`demo-ronda-rules`.

## Modelo de datos (Firestore)

```
users/{uid}
  username, usernameLower, displayName, bio, avatarUrl, city,
  socialLinks: { instagram?, whatsapp?, facebook? },
  isPro, proSince,
  activeListingCount, lastListingOpId,   ← cupo del plan (ver más abajo)
  listingCount, followerCount, followingCount, ratingAvg, ratingCount,
                                         ← reservados para Cloud Functions:
                                           ningún cliente puede escribirlos
  createdAt, updatedAt

usernames/{usernameLower}                → { uid, createdAt }
  Índice de unicidad: el id del documento ES el nombre de usuario, así que
  reservarlo dos veces falla del lado del servidor. Se escribe en el mismo
  batch que el perfil.

  users/{uid}/following/{targetUid}      → { uid, username, displayName, avatarUrl, createdAt }
  users/{uid}/followers/{followerUid}    → { uid, username, displayName, avatarUrl, createdAt }
  users/{uid}/interactions/{listingId}   → { listingId, action: 'like'|'pass', createdAt }
  users/{uid}/notifications/{id}         → { type, title, body, read, createdAt, data? }
    id determinístico por emisor: "new_follower__{actorUid}" /
    "new_rating__{raterId}" (ver src/features/notifications/notificationIds.ts)

listings/{listingId}
  sellerId,
  sellerUsername, sellerDisplayName, sellerAvatarUrl, sellerIsPro,  ← denormalizado del vendedor
  title, description, price, category, size, condition, color, city,
  photos: string[] (1 a 5),
  status: 'active' | 'sold' | 'archived',
  likeCount,
  createdAt, updatedAt

ratings/{raterId}__{ratedUserId}   (id determinístico, inmutables)
  raterId, raterUsername, raterDisplayName, raterAvatarUrl,  ← denormalizado de quien califica
  ratedUserId, listingId?, listingTitle?,
  stars (1-5), comment,
  createdAt

pro_account_requests/{requestId}
  userId, userUsername, userDisplayName,  ← denormalizado del solicitante
  message, status: 'pending' | 'approved' | 'rejected',
  reviewerNote, createdAt, reviewedAt
```

## Seguridad: qué garantizan las reglas

Este proyecto **no usa Cloud Functions**, así que todo lo que se puede
garantizar se garantiza en `firestore.rules`. Cada punto de esta lista tiene
un test en `tests/rules/firestore.test.mjs` (`npm run test:rules`):

- **Números sociales no falsificables.** `followerCount`, `followingCount`,
  `listingCount`, `ratingAvg` y `ratingCount` viven en el documento pero
  **ningún cliente puede escribirlos**. La app no los lee: calcula los
  números al vuelo con agregaciones del servidor (`getUserStats()`), así que
  lo que ve el resto siempre sale de las colecciones de origen.
- **Tope de publicaciones activas aplicado por el servidor.**
  `activeListingCount` es el único contador escribible, porque las reglas lo
  necesitan para el tope del plan (FREE 15 / PRO 50, igual que
  `src/constants/limits.ts`). Solo puede moverse ±1 y siempre en el mismo
  batch que la publicación que lo justifica: crear, archivar/vender o
  reactivar. Las reglas comparan el estado de `listings/{id}` antes
  (`get()`) y después (`getAfter()`) del write, así que el mismo id no
  sirve dos veces para descontar cupo. Como una publicación activa no se
  puede borrar (hay que archivarla primero), no existe forma de bajar el
  contador sin dejar rastro. Los cambios de estado que **no** cruzan la
  frontera activa/no activa (vendida ↔ archivada) no mueven el cupo, y las
  reglas tampoco los dejan moverlo.
- **Identidad no suplantable.** Los campos denormalizados (`seller*` en
  listings, `rater*` en ratings, `user*` en solicitudes PRO) se validan
  contra `users/{uid}`: no se puede publicar a nombre de otra persona ni
  pintarse la insignia PRO. `isPro`, `username` y `createdAt` son inmutables
  desde el cliente.
- **Likes idempotentes.** `likeCount` solo puede subir de a 1, y únicamente
  en el mismo write que crea `users/{uid}/interactions/{listingId}`, que es
  inmutable. Resultado: como mucho un like por persona y publicación, sin
  forma de restar ni de "re-likear" borrando el historial.
- **Una calificación por par de usuarios.** El id de `ratings` es
  `{raterId}__{ratedUserId}` y solo se permite `create`, así que la unicidad
  la impone Firestore. Tampoco se pueden editar ni borrar.
- **Follows simétricos en las dos direcciones.** `users/A/following/B` y
  `users/B/followers/A` se crean —y se borran— en el mismo write, o no pasa
  nada: no se puede dejar una punta huérfana inflando el contador de
  seguidores del otro perfil. Nadie puede agregarse seguidores ajenos.
- **Notificaciones no forjables ni spameables.** Solo se pueden crear como
  efecto de una acción real verificable en el mismo write (empezar a seguir o
  calificar), con `data.uid` == quien la manda. Además el id es
  determinístico y depende del emisor (`new_follower__{uid}` /
  `new_rating__{uid}`), así que una persona no puede acumular avisos en la
  bandeja de otra: seguir y dejar de seguir en loop reescribe siempre el
  mismo documento, y tampoco sirve meter varios avisos en un mismo batch.
  Los avisos de cuenta PRO no se pueden emitir desde el cliente.
- **Nombre de usuario único.** Se reserva en `usernames/{usernameLower}`
  dentro del mismo batch que el alta del perfil.

### Pendientes para Cloud Functions

Hay cosas que no se pueden resolver bien sin backend. Cuando el proyecto pase
a plan Blaze, estos son los triggers a escribir (y, al hacerlo, conviene
volver a leer los números desde el documento en vez de agregarlos en cada
pantalla):

| Trigger | Qué haría | Por qué no se puede desde el cliente |
| --- | --- | --- |
| `onCreate`/`onDelete` en `users/{uid}/followers/**` | Mantener `followerCount` / `followingCount` | Escribiría el documento de **otra** persona; hoy la app cuenta con `getCountFromServer` en cada visita al perfil |
| `onCreate` en `ratings/**` | Mantener `ratingAvg` / `ratingCount` | Ídem: el promedio vive en el perfil calificado |
| `onWrite` en `listings/**` | Ser la única fuente de `activeListingCount` y `listingCount` | Hoy el cliente lo mueve ±1 con el par verificado por reglas; con CF se le puede negar la escritura por completo |
| `onUpdate` en `pro_account_requests/**` | Aplicar `isPro` al aprobar y avisar al usuario | `isPro` y las notificaciones de PRO están bloqueadas para todo cliente |
| `onCreate` en `users/{uid}/notifications/**` | Enviar push (FCM / Expo) | No hay integración de push todavía |

Mientras tanto, el costo de calcular los números al vuelo es bajo: son
agregaciones del lado del servidor (`count()` / `average()`), no descargan
documentos.

### Índices

Cada consulta de la app tiene su índice en `firestore.indexes.json`:

| Consulta | Índice |
| --- | --- |
| Descubrir / Buscar: `status == 'active'` + `createdAt desc` | `listings(status, createdAt desc)` |
| Mis publicaciones y perfil ajeno: `sellerId ==` + `createdAt desc` | `listings(sellerId, createdAt desc)` |
| Feed de seguidos: `sellerId in` + `status ==` + `createdAt desc`, y el conteo de publicaciones activas del perfil | `listings(sellerId, status, createdAt desc)` |
| Calificaciones recibidas: `ratedUserId ==` + `createdAt desc` (y el promedio del perfil) | `ratings(ratedUserId, createdAt desc)` |
| Última solicitud PRO: `userId ==` + `createdAt desc` | `pro_account_requests(userId, createdAt desc)` |

"¿Ya califiqué a esta persona?" y "¿está libre este nombre de usuario?" ya no
son consultas: son lecturas por id (`ratings/{raterId}__{ratedUserId}` y
`usernames/{usernameLower}`), así que no necesitan índice.

### Cuentas PRO

`isPro` **no se puede activar desde el cliente**: las solicitudes se crean en
`pro_account_requests` con estado `pending`, y quedan pendientes de una
revisión manual (por ahora, desde la consola de Firebase, editando
directamente el documento en `users/{uid}` y en la solicitud). Es la única
pieza de moderación manual del MVP; documentarla acá para que no se confunda
con un bug.

Límites de publicaciones activas (`src/constants/limits.ts`, replicados en
`firestore.rules`):

- Cuenta gratuita: 15 publicaciones activas.
- Cuenta PRO: 50 publicaciones activas.

Si cambiás estos números hay que tocar los dos lados (y el test
`aplica el tope FREE de 15 publicaciones activas` avisa si se desincronizan).

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
calificación) que crea el cliente que dispara la acción, **en el mismo write
que la acción**: las reglas rechazan cualquier aviso que no venga acompañado
del follow o de la calificación que lo justifica, así que no se pueden
inventar ni usar para spamear. La pestaña "Avisos" los lista y permite
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
    `activeListingCount` debe bajar. Pasar después de "Vendido" a
    "Archivado" (y al revés) tiene que funcionar sin volver a mover el
    contador, porque ninguno de los dos ocupa cupo.
15. Alcanzar el límite de publicaciones activas (15 en cuenta gratuita) →
    "Publicar" debe bloquearse con un aviso, hasta archivar/vender alguna o
    pedir cuenta PRO. El tope también lo aplican las reglas: aunque se fuerce
    el alta, Firestore la rechaza.
16. Eliminar una publicación activa → la app la archiva primero (liberando el
    cupo) y después la borra; debe desaparecer de todos lados y el contador
    tiene que quedar bien.

### Descubrimiento (swipe) y feed

17. En "Descubrir", deslizar a la derecha (o tocar el corazón) sobre una
    publicación → debe registrar un "me gusta" (no debe volver a aparecer en
    la cola) y sumar 1 al `likeCount` de la publicación.
18. Deslizar a la izquierda (o tocar la X) → debe registrar un "paso" y
    tampoco volver a aparecer.
18b. Tocar el corazón dos veces muy rápido, o tocar el botón mientras se
    arrastra la carta → debe registrarse **una sola** interacción y avanzar
    una sola carta.
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
    perfil) con estrellas + comentario → debe generarle una notificación y
    subir el promedio que se ve en su perfil. Al volver a entrar a
    "Calificar" (desde cualquier publicación de esa persona) debe avisar que
    ya la calificaste: es una calificación por cuenta.

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
25b. Seguir y dejar de seguir varias veces desde la otra cuenta → tiene que
    quedar **un solo** aviso de "nuevo seguidor" (se reescribe), no uno por
    cada vez. Y al dejar de seguir, el perfil no puede quedar con el
    seguidor contado de más.

### Rutas protegidas

26. Con la sesión cerrada, abrir un deep link a una pantalla interna
    (`ronda://listing/new`, `ronda://edit-profile`, `ronda://user/<uid>`) →
    debe redirigir al login, no mostrar una pantalla vacía.
27. Con sesión iniciada pero sin perfil creado (registro a medias), cualquier
    ruta interna debe llevar al onboarding.

## Verificación automática

- `npm run typecheck` (TypeScript en modo estricto) sin errores.
- `npm run lint` (ESLint con `eslint-config-expo`) sin errores.
- `npm run test:rules`: tests de las reglas de seguridad contra el emulador
  de Firestore (tope FREE/PRO, contadores, likes idempotentes, unicidad de
  calificaciones y de nombres de usuario, follows simétricos y
  notificaciones no forjables).
- `npx expo export --platform web` genera correctamente las rutas estáticas
  de la app (smoke test de que todas las pantallas montan sin errores de
  import/render).
