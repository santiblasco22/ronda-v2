/**
 * Tests de las reglas de seguridad de Firestore contra el emulador.
 *
 *   npm run test:rules
 *
 * Cada test describe una garantía concreta de firestore.rules. Si alguna
 * afirmación de seguridad del README deja de ser cierta, acá tiene que fallar.
 */
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

import { createTestEnv, listingDoc, seed, userDoc } from './helpers.mjs';

let testEnv;

before(async () => {
  testEnv = await createTestEnv();
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

function db(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

async function seedUsers(...uids) {
  await seed(
    testEnv,
    uids.flatMap((uid) => [
      [`users/${uid}`, userDoc(uid)],
      [`usernames/${uid}`, { uid, createdAt: 1700000000000 }],
    ])
  );
}

/** Batch de alta de perfil + reserva de nombre de usuario. */
function signUpBatch(client, uid, username = uid) {
  const batch = writeBatch(client);
  batch.set(doc(client, 'users', uid), userDoc(uid, { username, usernameLower: username }));
  batch.set(doc(client, 'usernames', username), { uid, createdAt: 1700000000000 });
  return batch;
}

/** Batch que crea una publicación activa y sube el contador del vendedor. */
function createListingBatch(client, uid, listingId, { activeBefore = 0, overrides = {} } = {}) {
  const batch = writeBatch(client);
  batch.set(doc(client, 'listings', listingId), listingDoc(uid, overrides));
  batch.update(doc(client, 'users', uid), {
    activeListingCount: activeBefore + 1,
    lastListingOpId: listingId,
    updatedAt: 1700000001000,
  });
  return batch;
}

// ---------------------------------------------------------------------------
describe('users/{uid}', () => {
  it('deja al dueño editar su perfil', async () => {
    await seedUsers('alice');
    await assertSucceeds(
      updateDoc(doc(db('alice'), 'users', 'alice'), {
        displayName: 'Alicia',
        bio: 'Vendo vintage',
        updatedAt: 1700000002000,
      })
    );
  });

  it('no deja editar el perfil de otra persona', async () => {
    await seedUsers('alice', 'bob');
    await assertFails(
      updateDoc(doc(db('bob'), 'users', 'alice'), { displayName: 'Hackeada', updatedAt: 1 })
    );
  });

  it('no deja auto-otorgarse la cuenta PRO', async () => {
    await seedUsers('alice');
    await assertFails(
      updateDoc(doc(db('alice'), 'users', 'alice'), { isPro: true, updatedAt: 1700000002000 })
    );
  });

  it('no deja inflar los contadores sociales', async () => {
    await seedUsers('alice');
    const client = db('alice');
    await assertFails(updateDoc(doc(client, 'users', 'alice'), { followerCount: 9999 }));
    await assertFails(updateDoc(doc(client, 'users', 'alice'), { followingCount: 9999 }));
    await assertFails(updateDoc(doc(client, 'users', 'alice'), { ratingAvg: 5, ratingCount: 400 }));
    await assertFails(updateDoc(doc(client, 'users', 'alice'), { listingCount: 42 }));
  });

  it('no deja cambiar el nombre de usuario ya registrado', async () => {
    await seedUsers('alice');
    await assertFails(
      updateDoc(doc(db('alice'), 'users', 'alice'), {
        username: 'otra',
        usernameLower: 'otra',
        updatedAt: 1700000002000,
      })
    );
  });

  it('no deja bajar activeListingCount sin una publicación que lo justifique', async () => {
    await seed(testEnv, [['users/alice', userDoc('alice', { activeListingCount: 3 })]]);
    await assertFails(
      updateDoc(doc(db('alice'), 'users', 'alice'), {
        activeListingCount: 2,
        lastListingOpId: 'inventado',
        updatedAt: 1700000002000,
      })
    );
  });

  it('crea el perfil propio con los contadores en cero y sin PRO', async () => {
    await assertSucceeds(signUpBatch(db('alice'), 'alice').commit());

    const bob = db('bob');
    const proFromDayOne = writeBatch(bob);
    proFromDayOne.set(doc(bob, 'users', 'bob'), userDoc('bob', { isPro: true, proSince: 1 }));
    proFromDayOne.set(doc(bob, 'usernames', 'bob'), { uid: 'bob', createdAt: 1 });
    await assertFails(proFromDayOne.commit());

    const carol = db('carol');
    const fakeFollowers = writeBatch(carol);
    fakeFollowers.set(doc(carol, 'users', 'carol'), userDoc('carol', { followerCount: 100 }));
    fakeFollowers.set(doc(carol, 'usernames', 'carol'), { uid: 'carol', createdAt: 1 });
    await assertFails(fakeFollowers.commit());
  });

  it('exige reservar el nombre de usuario junto con el perfil', async () => {
    await assertFails(setDoc(doc(db('alice'), 'users', 'alice'), userDoc('alice')));
  });

  it('no deja quedarse con un nombre de usuario ya tomado', async () => {
    await assertSucceeds(signUpBatch(db('alice'), 'alice', 'vintage').commit());
    await assertFails(signUpBatch(db('bob'), 'bob', 'vintage').commit());
  });

  it('no deja reservar un nombre para otra persona ni liberarlo', async () => {
    await seedUsers('alice');
    await assertFails(
      setDoc(doc(db('bob'), 'usernames', 'nuevo'), { uid: 'alice', createdAt: 1 })
    );
    await assertFails(deleteDoc(doc(db('alice'), 'usernames', 'alice')));
  });
});

// ---------------------------------------------------------------------------
describe('listings: alta y tope del plan', () => {
  it('permite crear una publicación si sube el contador en el mismo write', async () => {
    await seedUsers('alice');
    await assertSucceeds(createListingBatch(db('alice'), 'alice', 'l1').commit());

    let activeListingCount = null;
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const snap = await getDoc(doc(ctx.firestore(), 'users', 'alice'));
      activeListingCount = snap.data().activeListingCount;
    });
    assert.equal(activeListingCount, 1);
  });

  it('rechaza crear una publicación sin tocar el contador (evade el tope)', async () => {
    await seedUsers('alice');
    await assertFails(setDoc(doc(db('alice'), 'listings', 'l1'), listingDoc('alice')));
  });

  it('rechaza subir el contador más de 1 por publicación', async () => {
    await seedUsers('alice');
    const client = db('alice');
    const batch = writeBatch(client);
    batch.set(doc(client, 'listings', 'l1'), listingDoc('alice'));
    batch.update(doc(client, 'users', 'alice'), { activeListingCount: 5, lastListingOpId: 'l1' });
    await assertFails(batch.commit());
  });

  it('aplica el tope FREE de 15 publicaciones activas', async () => {
    await seed(testEnv, [['users/alice', userDoc('alice', { activeListingCount: 14 })]]);
    await assertSucceeds(
      createListingBatch(db('alice'), 'alice', 'l15', { activeBefore: 14 }).commit()
    );

    await seed(testEnv, [['users/bob', userDoc('bob', { activeListingCount: 15 })]]);
    await assertFails(createListingBatch(db('bob'), 'bob', 'l16', { activeBefore: 15 }).commit());
  });

  it('aplica el tope PRO de 50 publicaciones activas', async () => {
    await seed(testEnv, [['users/pro', userDoc('pro', { isPro: true, activeListingCount: 49 })]]);
    await assertSucceeds(
      createListingBatch(db('pro'), 'pro', 'l50', {
        activeBefore: 49,
        overrides: { sellerIsPro: true },
      }).commit()
    );

    await seed(testEnv, [['users/pro2', userDoc('pro2', { isPro: true, activeListingCount: 50 })]]);
    await assertFails(
      createListingBatch(db('pro2'), 'pro2', 'l51', {
        activeBefore: 50,
        overrides: { sellerIsPro: true },
      }).commit()
    );
  });

  it('rechaza publicar en nombre de otra persona', async () => {
    await seedUsers('alice', 'bob');
    const client = db('bob');
    const batch = writeBatch(client);
    batch.set(doc(client, 'listings', 'l1'), listingDoc('alice'));
    batch.update(doc(client, 'users', 'bob'), { activeListingCount: 1, lastListingOpId: 'l1' });
    await assertFails(batch.commit());
  });

  it('rechaza falsear los campos denormalizados del vendedor', async () => {
    await seedUsers('alice');
    await assertFails(
      createListingBatch(db('alice'), 'alice', 'l1', {
        overrides: { sellerIsPro: true },
      }).commit()
    );
    await assertFails(
      createListingBatch(db('alice'), 'alice', 'l2', {
        overrides: { sellerUsername: 'marca_famosa' },
      }).commit()
    );
    await assertFails(
      createListingBatch(db('alice'), 'alice', 'l3', {
        overrides: { sellerDisplayName: 'Otra persona' },
      }).commit()
    );
  });

  it('rechaza más de 5 fotos y precios inválidos', async () => {
    await seedUsers('alice');
    await assertFails(
      createListingBatch(db('alice'), 'alice', 'l1', {
        overrides: { photos: ['a', 'b', 'c', 'd', 'e', 'f'] },
      }).commit()
    );
    await assertFails(
      createListingBatch(db('alice'), 'alice', 'l2', { overrides: { price: 0 } }).commit()
    );
  });

  it('permite publicar sin fotos (Storage deshabilitado)', async () => {
    await seedUsers('alice');
    await assertSucceeds(
      createListingBatch(db('alice'), 'alice', 'l1', { overrides: { photos: [] } }).commit()
    );
  });
});

// ---------------------------------------------------------------------------
describe('listings: edición, estado y borrado', () => {
  it('deja al vendedor editar su publicación pero no cambiar sellerId ni likeCount', async () => {
    await seed(testEnv, [
      ['users/alice', userDoc('alice', { activeListingCount: 1 })],
      ['listings/l1', listingDoc('alice', { likeCount: 3 })],
    ]);
    const client = db('alice');
    await assertSucceeds(
      updateDoc(doc(client, 'listings', 'l1'), { title: 'Otro título', updatedAt: 2 })
    );
    await assertFails(updateDoc(doc(client, 'listings', 'l1'), { sellerId: 'bob' }));
    await assertFails(updateDoc(doc(client, 'listings', 'l1'), { likeCount: 999 }));
    await assertFails(updateDoc(doc(client, 'listings', 'l1'), { sellerIsPro: true }));
  });

  it('no deja editar la publicación de otra persona', async () => {
    await seedUsers('alice', 'bob');
    await seed(testEnv, [['listings/l1', listingDoc('alice')]]);
    await assertFails(updateDoc(doc(db('bob'), 'listings', 'l1'), { price: 1 }));
  });

  it('exige bajar el contador al marcar como vendida', async () => {
    await seed(testEnv, [
      ['users/alice', userDoc('alice', { activeListingCount: 1 })],
      ['listings/l1', listingDoc('alice')],
    ]);
    const client = db('alice');

    await assertFails(updateDoc(doc(client, 'listings', 'l1'), { status: 'sold', updatedAt: 2 }));

    const batch = writeBatch(client);
    batch.update(doc(client, 'listings', 'l1'), { status: 'sold', updatedAt: 2 });
    batch.update(doc(client, 'users', 'alice'), { activeListingCount: 0, lastListingOpId: 'l1' });
    await assertSucceeds(batch.commit());
  });

  it('no deja reutilizar el mismo id de operación para bajar el contador dos veces', async () => {
    await seed(testEnv, [
      ['users/alice', userDoc('alice', { activeListingCount: 5 })],
      ['listings/l1', listingDoc('alice', { status: 'sold' })],
    ]);
    await assertFails(
      updateDoc(doc(db('alice'), 'users', 'alice'), {
        activeListingCount: 4,
        lastListingOpId: 'l1',
      })
    );
  });

  it('exige subir el contador (y respetar el tope) al reactivar', async () => {
    await seed(testEnv, [
      ['users/alice', userDoc('alice', { activeListingCount: 0 })],
      ['listings/l1', listingDoc('alice', { status: 'archived' })],
      ['users/bob', userDoc('bob', { activeListingCount: 15 })],
      ['listings/l2', listingDoc('bob', { status: 'archived' })],
    ]);

    const alice = db('alice');
    const ok = writeBatch(alice);
    ok.update(doc(alice, 'listings', 'l1'), { status: 'active', updatedAt: 2 });
    ok.update(doc(alice, 'users', 'alice'), { activeListingCount: 1, lastListingOpId: 'l1' });
    await assertSucceeds(ok.commit());

    const bob = db('bob');
    const overCap = writeBatch(bob);
    overCap.update(doc(bob, 'listings', 'l2'), { status: 'active', updatedAt: 2 });
    overCap.update(doc(bob, 'users', 'bob'), { activeListingCount: 16, lastListingOpId: 'l2' });
    await assertFails(overCap.commit());
  });

  it('solo permite borrar publicaciones que no estén activas', async () => {
    await seed(testEnv, [
      ['users/alice', userDoc('alice', { activeListingCount: 1 })],
      ['listings/activa', listingDoc('alice')],
      ['listings/archivada', listingDoc('alice', { status: 'archived' })],
    ]);
    const client = db('alice');
    await assertFails(deleteDoc(doc(client, 'listings', 'activa')));
    await assertSucceeds(deleteDoc(doc(client, 'listings', 'archivada')));
  });
});

// ---------------------------------------------------------------------------
describe('likeCount idempotente', () => {
  async function seedLike() {
    await seedUsers('alice', 'bob');
    await seed(testEnv, [['listings/l1', listingDoc('alice', { likeCount: 0 })]]);
  }

  function likeBatch(client, uid, likeCountAfter) {
    const batch = writeBatch(client);
    batch.set(doc(client, 'users', uid, 'interactions', 'l1'), {
      listingId: 'l1',
      action: 'like',
      createdAt: 1700000003000,
    });
    batch.update(doc(client, 'listings', 'l1'), { likeCount: likeCountAfter });
    return batch;
  }

  it('permite un like por usuario junto con su interacción', async () => {
    await seedLike();
    await assertSucceeds(likeBatch(db('bob'), 'bob', 1).commit());
  });

  it('rechaza sumar likes sin registrar la interacción', async () => {
    await seedLike();
    await assertFails(updateDoc(doc(db('bob'), 'listings', 'l1'), { likeCount: 1 }));
  });

  it('rechaza el segundo like del mismo usuario', async () => {
    await seedLike();
    await assertSucceeds(likeBatch(db('bob'), 'bob', 1).commit());
    await assertFails(likeBatch(db('bob'), 'bob', 2).commit());
  });

  it('rechaza restar likes y saltos de más de 1', async () => {
    await seedUsers('alice', 'bob');
    await seed(testEnv, [['listings/l1', listingDoc('alice', { likeCount: 10 })]]);
    await assertFails(likeBatch(db('bob'), 'bob', 9).commit());
    await assertFails(likeBatch(db('bob'), 'bob', 20).commit());
  });

  it('no deja borrar interacciones para volver a likear', async () => {
    await seedLike();
    await assertSucceeds(likeBatch(db('bob'), 'bob', 1).commit());
    await assertFails(deleteDoc(doc(db('bob'), 'users', 'bob', 'interactions', 'l1')));
  });

  it('no deja ver el historial de swipes de otra persona', async () => {
    await seedLike();
    await assertSucceeds(likeBatch(db('bob'), 'bob', 1).commit());
    await assertFails(getDoc(doc(db('alice'), 'users', 'bob', 'interactions', 'l1')));
  });
});

// ---------------------------------------------------------------------------
describe('follows simétricos', () => {
  function followBatch(client, followerId, targetId) {
    const edge = (uid) => ({
      uid,
      username: uid,
      displayName: `Usuario ${uid}`,
      avatarUrl: null,
      createdAt: 1700000004000,
    });
    const batch = writeBatch(client);
    batch.set(doc(client, 'users', followerId, 'following', targetId), edge(targetId));
    batch.set(doc(client, 'users', targetId, 'followers', followerId), edge(followerId));
    return batch;
  }

  it('permite seguir escribiendo las dos puntas a la vez', async () => {
    await seedUsers('alice', 'bob');
    await assertSucceeds(followBatch(db('bob'), 'bob', 'alice').commit());
  });

  it('rechaza escribir una sola punta', async () => {
    await seedUsers('alice', 'bob');
    const client = db('bob');
    await assertFails(
      setDoc(doc(client, 'users', 'alice', 'followers', 'bob'), { uid: 'bob', createdAt: 1 })
    );
    await assertFails(
      setDoc(doc(client, 'users', 'bob', 'following', 'alice'), { uid: 'alice', createdAt: 1 })
    );
  });

  it('rechaza agregar seguidores ajenos', async () => {
    await seedUsers('alice', 'bob', 'carol');
    const client = db('bob');
    const batch = writeBatch(client);
    batch.set(doc(client, 'users', 'carol', 'following', 'alice'), { uid: 'alice', createdAt: 1 });
    batch.set(doc(client, 'users', 'alice', 'followers', 'carol'), { uid: 'carol', createdAt: 1 });
    await assertFails(batch.commit());
  });
});

// ---------------------------------------------------------------------------
describe('ratings únicas e inmutables', () => {
  function ratingData(raterId, ratedUserId, overrides = {}) {
    return {
      raterId,
      raterUsername: raterId,
      raterDisplayName: `Usuario ${raterId}`,
      raterAvatarUrl: null,
      ratedUserId,
      listingId: null,
      listingTitle: null,
      stars: 5,
      comment: 'Todo perfecto',
      createdAt: 1700000005000,
      ...overrides,
    };
  }

  it('acepta una calificación con id determinístico', async () => {
    await seedUsers('alice', 'bob');
    await assertSucceeds(
      setDoc(doc(db('bob'), 'ratings', 'bob__alice'), ratingData('bob', 'alice'))
    );
  });

  it('rechaza ids que no correspondan al par calificador/calificado', async () => {
    await seedUsers('alice', 'bob');
    await assertFails(setDoc(doc(db('bob'), 'ratings', 'random123'), ratingData('bob', 'alice')));
    await assertFails(
      setDoc(doc(db('bob'), 'ratings', 'carol__alice'), ratingData('carol', 'alice'))
    );
  });

  it('rechaza calificar dos veces al mismo usuario', async () => {
    await seedUsers('alice', 'bob');
    const client = db('bob');
    await assertSucceeds(setDoc(doc(client, 'ratings', 'bob__alice'), ratingData('bob', 'alice')));
    await assertFails(
      setDoc(doc(client, 'ratings', 'bob__alice'), ratingData('bob', 'alice', { stars: 1 }))
    );
    await assertFails(updateDoc(doc(client, 'ratings', 'bob__alice'), { stars: 1 }));
    await assertFails(deleteDoc(doc(client, 'ratings', 'bob__alice')));
  });

  it('rechaza autocalificarse y estrellas fuera de rango', async () => {
    await seedUsers('alice', 'bob');
    await assertFails(setDoc(doc(db('bob'), 'ratings', 'bob__bob'), ratingData('bob', 'bob')));
    await assertFails(
      setDoc(doc(db('bob'), 'ratings', 'bob__alice'), ratingData('bob', 'alice', { stars: 6 }))
    );
    await assertFails(
      setDoc(doc(db('bob'), 'ratings', 'bob__alice'), ratingData('bob', 'alice', { stars: 0 }))
    );
  });

  it('rechaza falsear la identidad de quien califica', async () => {
    await seedUsers('alice', 'bob');
    await assertFails(
      setDoc(
        doc(db('bob'), 'ratings', 'bob__alice'),
        ratingData('bob', 'alice', { raterDisplayName: 'Cuenta verificada' })
      )
    );
  });
});

// ---------------------------------------------------------------------------
describe('notificaciones no falsificables', () => {
  const notification = (type, actorUid, overrides = {}) => ({
    type,
    title: 'Nuevo seguidor',
    body: 'Alguien te empezó a seguir.',
    read: false,
    createdAt: 1700000006000,
    data: { uid: actorUid },
    ...overrides,
  });

  it('rechaza notificaciones sueltas', async () => {
    await seedUsers('alice', 'bob');
    await assertFails(
      setDoc(
        doc(db('bob'), 'users', 'alice', 'notifications', 'n1'),
        notification('new_follower', 'bob')
      )
    );
  });

  it('acepta la notificación que acompaña a un follow real', async () => {
    await seedUsers('alice', 'bob');
    const client = db('bob');
    const batch = writeBatch(client);
    batch.set(doc(client, 'users', 'bob', 'following', 'alice'), { uid: 'alice', createdAt: 1 });
    batch.set(doc(client, 'users', 'alice', 'followers', 'bob'), { uid: 'bob', createdAt: 1 });
    batch.set(
      doc(client, 'users', 'alice', 'notifications', 'n1'),
      notification('new_follower', 'bob')
    );
    await assertSucceeds(batch.commit());

    // Ya siendo seguidor, no puede seguir generando avisos.
    await assertFails(
      setDoc(
        doc(client, 'users', 'alice', 'notifications', 'n2'),
        notification('new_follower', 'bob')
      )
    );
  });

  it('acepta la notificación que acompaña a una calificación real', async () => {
    await seedUsers('alice', 'bob');
    const client = db('bob');
    const batch = writeBatch(client);
    batch.set(doc(client, 'ratings', 'bob__alice'), {
      raterId: 'bob',
      raterUsername: 'bob',
      raterDisplayName: 'Usuario bob',
      raterAvatarUrl: null,
      ratedUserId: 'alice',
      listingId: null,
      listingTitle: null,
      stars: 4,
      comment: '',
      createdAt: 1700000005000,
    });
    batch.set(
      doc(client, 'users', 'alice', 'notifications', 'n1'),
      notification('new_rating', 'bob', { title: 'Nueva calificación' })
    );
    await assertSucceeds(batch.commit());
  });

  it('rechaza suplantar a otro usuario como autor del aviso', async () => {
    await seedUsers('alice', 'bob', 'carol');
    const client = db('bob');
    const batch = writeBatch(client);
    batch.set(doc(client, 'users', 'bob', 'following', 'alice'), { uid: 'alice', createdAt: 1 });
    batch.set(doc(client, 'users', 'alice', 'followers', 'bob'), { uid: 'bob', createdAt: 1 });
    batch.set(
      doc(client, 'users', 'alice', 'notifications', 'n1'),
      notification('new_follower', 'carol')
    );
    await assertFails(batch.commit());
  });

  it('rechaza avisos de cuenta PRO desde el cliente', async () => {
    await seedUsers('alice');
    await assertFails(
      setDoc(
        doc(db('alice'), 'users', 'alice', 'notifications', 'n1'),
        notification('pro_request_approved', 'alice', { title: 'Sos PRO' })
      )
    );
  });

  it('solo deja al dueño marcarla como leída', async () => {
    await seedUsers('alice', 'bob');
    await seed(testEnv, [
      ['users/alice/notifications/n1', notification('new_follower', 'bob')],
    ]);
    await assertFails(updateDoc(doc(db('bob'), 'users', 'alice', 'notifications', 'n1'), { read: true }));
    await assertSucceeds(
      updateDoc(doc(db('alice'), 'users', 'alice', 'notifications', 'n1'), { read: true })
    );
    await assertFails(
      updateDoc(doc(db('alice'), 'users', 'alice', 'notifications', 'n1'), { body: 'otro' })
    );
  });
});

// ---------------------------------------------------------------------------
describe('pro_account_requests', () => {
  const request = (uid, overrides = {}) => ({
    userId: uid,
    userUsername: uid,
    userDisplayName: `Usuario ${uid}`,
    message: 'Vendo ropa vintage curada.',
    status: 'pending',
    reviewerNote: null,
    createdAt: 1700000007000,
    reviewedAt: null,
    ...overrides,
  });

  it('permite pedir cuenta PRO para uno mismo', async () => {
    await seedUsers('alice');
    await assertSucceeds(setDoc(doc(db('alice'), 'pro_account_requests', 'r1'), request('alice')));
  });

  it('rechaza solicitudes ya aprobadas o en nombre de otro', async () => {
    await seedUsers('alice', 'bob');
    await assertFails(
      setDoc(doc(db('alice'), 'pro_account_requests', 'r1'), request('alice', { status: 'approved' }))
    );
    await assertFails(setDoc(doc(db('bob'), 'pro_account_requests', 'r2'), request('alice')));
  });

  it('no deja leer solicitudes ajenas ni modificarlas', async () => {
    await seedUsers('alice', 'bob');
    await seed(testEnv, [['pro_account_requests/r1', request('alice')]]);
    await assertFails(getDoc(doc(db('bob'), 'pro_account_requests', 'r1')));
    await assertFails(
      updateDoc(doc(db('alice'), 'pro_account_requests', 'r1'), { status: 'approved' })
    );
  });
});

// ---------------------------------------------------------------------------
describe('acceso anónimo', () => {
  it('bloquea lectura y escritura sin sesión', async () => {
    await seedUsers('alice');
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, 'users', 'alice')));
    await assertFails(setDoc(doc(anon, 'listings', 'l1'), listingDoc('alice')));
  });
});
