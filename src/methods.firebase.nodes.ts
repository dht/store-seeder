import kleur from 'kleur';
import { firebase } from './methods.firebase.base';
import { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { Firestore } from 'firebase/firestore/lite';
import { ISeedStructure } from './types';

let globalState: Json = {};

type Json = Record<string, any>;

let app: FirebaseApp, db: Firestore;

const ts = () => new Date().toISOString();

export const initFirebase = (firebaseConfig: FirebaseOptions) => {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.getFirestore(app);
};

const generateCreatedDate = () => ({
    _createdDate: ts(),
});

const generateModifiedDate = () => ({
    _modifiedDate: ts(),
});

const withDates = (
    data: Json,
    withCreatedDate: boolean,
    withModifiedDate: boolean
) => {
    let output = { ...data };

    if (withCreatedDate) {
        output = { ...output, ...generateCreatedDate() };
    }

    if (withModifiedDate) {
        output = { ...output, ...generateModifiedDate() };
    }

    return output;
};

async function singleGet(nodeName: string) {
    const ref = firebase.doc(db, 'singles', nodeName);
    const response = await firebase.getDoc(ref);
    return response.data();
}

function singlePatch(nodeName: string, data: Json) {
    const ref = firebase.doc(db, 'singles', nodeName);
    return firebase.setDoc(ref, withDates(data, false, true), { merge: true });
}

async function collectionGet(nodeName: string) {
    const ref = firebase.collection(db, nodeName);
    const snapshot = await firebase.getDocs(ref);
    return snapshot.docs.map((doc) => doc.data());
}

function collectionUpdateMany(nodeName: string, data: Json) {
    const batch = firebase.writeBatch(db);

    Object.keys(data).forEach((id) => {
        const ref = firebase.doc(db, nodeName, id);
        batch.update(ref, data[id]);
    });

    return batch.commit();
}

function collectionAddMany(nodeName: string, data: Json) {
    const batch = firebase.writeBatch(db);

    Object.keys(data).forEach((id) => {
        const ref = firebase.doc(db, nodeName, id);
        batch.set(ref, data[id]);
    });

    return batch.commit();
}

function collectionDeleteMany(nodeName: string, ids: string[]) {
    const batch = firebase.writeBatch(db);

    ids.forEach((id) => {
        const ref = firebase.doc(db, nodeName, id);
        batch.delete(ref);
    });

    return batch.commit();
}

function collectionPatchItem(nodeName: string, id: string, data: Json) {
    const ref = firebase.doc(db, nodeName, id);
    return firebase.setDoc(ref, withDates(data, false, true), { merge: true });
}

function collectionDeleteItem(nodeName: string, id: string) {
    const ref = firebase.doc(db, nodeName, id);
    return firebase.deleteDoc(ref);
}

function collectionAddItem(nodeName: string, data: Json) {
    const ref = firebase.collection(db, nodeName);
    return firebase.addDoc(ref, withDates(data, true, true));
}

function groupedListPushItem(nodeName: string, id: string, data: Json) {
    const ref = firebase.collection(db, nodeName, id, 'items');
    return firebase.addDoc(ref, withDates(data, true, true));
}

function groupedListDeleteItem(nodeName: string, id: string, itemId: string) {
    const ref = firebase.doc(db, nodeName, id, 'items', itemId);
    return firebase.deleteDoc(ref);
}

function groupedListSetItem(
    nodeName: string,
    id: string,
    itemId: string,
    data: Json
) {
    const ref = firebase.doc(db, nodeName, id, 'items', itemId);
    return firebase.setDoc(ref, withDates(data, false, true));
}

async function groupedListPatch(nodeName: string, dataAll: Json) {
    for (let data of Object.values(dataAll)) {
        const { items } = data;
        delete data['items'];

        await collectionPatchItem(nodeName, data.id, data);

        for (let item of items) {
            await groupedListSetItem(nodeName, data.id, item.id, item);
        }
    }
}

const getByType = (nodeTypes: Json, nodeType: string) => {
    return Object.keys(nodeTypes)
        .filter((key) => nodeTypes[key] === nodeType)
        .map((key) => {
            const nodeData = globalState[key];
            return [key, nodeData];
        }) as [string, Json][];
};

export const seed = async (data: Json, nodeTypes: ISeedStructure) => {
    let promises: Promise<any>[];

    globalState = data;

    console.time('total');
    console.log(header('singles'));

    console.time('singles');
    promises = getByType(nodeTypes, 'single').map(([key, data]) => {
        console.log(nodeNameWithItemsCount(key, 'single'));
        return singlePatch(key, { id: key, ...data });
    });

    await Promise.all(promises);
    console.timeEnd('singles');
    console.log('');

    console.log(header('collections'));

    console.time('collections');
    promises = getByType(nodeTypes, 'collection').map(([key, data]) => {
        console.log(nodeNameWithItemsCount(key, 'collection'));
        return collectionAddMany(key, data);
    });

    await Promise.all(promises);
    console.timeEnd('collections');
    console.log('');

    console.log(header('groupedLists'));

    console.time('groupedLists');
    promises = getByType(nodeTypes, 'groupedList').map(([key, data]) => {
        console.log(nodeNameWithItemsCount(key, 'groupedList'));
        return groupedListPatch(key, data);
    });

    await Promise.all(promises);
    console.timeEnd('groupedLists');
    console.log('');

    console.log(kleur.green('done\n'));
    console.timeEnd('total');
};

export const nodeNameWithItemsCount = (
    nodeName: string,
    entityType: 'single' | 'collection' | 'groupedList',
    totalLength: number = 30
) => {
    const dotsLength = totalLength - nodeName.length - 1;

    let count = 1;

    if (entityType !== 'single') {
        count = Object.keys(globalState[nodeName]).length;
    }

    return [
        kleur.magenta(nodeName),
        '.'.repeat(dotsLength),
        ' ',
        kleur.cyan(count),
    ].join('');
};

export const header = (text: string, totalLength: number = 30) => {
    const dashesLength = totalLength - text.length - 2;
    const dashesLengthLeft = Math.ceil(dashesLength / 2);
    const dashesLengthRight = Math.floor(dashesLength / 2);

    return kleur.yellow(
        [
            '='.repeat(dashesLengthLeft),
            ' ',
            text,
            ' ',
            '='.repeat(dashesLengthRight),
        ].join('')
    );
};
