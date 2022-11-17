import kleur from 'kleur';
import { RequestBuilder, restAdapter } from './methods.rest.base';
import { ISeedOptions, ISeedStructure } from './types';

let globalState: Json = {};

type Json = Record<string, any>;

const ts = () => new Date().toISOString();

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

async function singlePatch(nodeName: string, data: Json) {
    const request = new RequestBuilder()
        .withParams({
            argsApiVerb: 'patch',
            argsMethod: 'PATCH',
            argsNodeName: nodeName,
            argsNodeType: 'SINGLE_NODE' as any,
            argsPath: `/${nodeName}`,
            argsParams: withDates(data, true, true),
        })
        .build();

    await restAdapter.fireRequest(request);
}

async function collectionAddOne(nodeName: string, data: Json) {
    const request = new RequestBuilder()
        .withParams({
            argsApiVerb: 'add',
            argsMethod: 'POST',
            argsNodeName: nodeName,
            argsNodeType: 'COLLECTION_NODE' as any,
            argsPath: `/${nodeName}`,
            argsParams: withDates(data, true, true),
        })
        .build();

    return restAdapter.fireRequest(request);
}

async function collectionAddMany(nodeName: string, data: Json) {
    const promises = Object.values(data).map((item) => {
        return collectionAddOne(nodeName, item);
    });

    await Promise.all(promises);
}

async function collectionPatchItem(nodeName: string, id: string, data: Json) {
    const request = new RequestBuilder()
        .withParams({
            argsApiVerb: 'patchItem',
            argsMethod: 'PATCH',
            argsNodeName: nodeName,
            argsNodeType: 'GROUPED_LIST_NODE' as any,
            argsPath: `/${nodeName}/${id}`,
            resourceId: id,
            argsParams: withDates(data, true, true),
        })
        .build();

    await restAdapter.fireRequest(request);
}

async function groupedListSetItem(
    nodeName: string,
    id: string,
    itemId: string,
    data: Json
) {
    const request = new RequestBuilder()
        .withParams({
            argsApiVerb: 'add',
            argsMethod: 'POST',
            argsNodeName: `${nodeName}Items`,
            argsNodeType: 'COLLECTION_NODE' as any,
            argsPath: `/${nodeName}Items`,
            argsParams: {
                id: itemId,
                ...withDates(data, true, true),
                [`${nodeName}Id`]: id,
            },
        })
        .build();

    await restAdapter.fireRequest(request);
}

async function groupedListPatch(nodeName: string, dataAll: Json) {
    for (let data of Object.values(dataAll)) {
        const { items } = data;
        delete data['items'];

        await collectionAddOne(nodeName, data);

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

export const seed = async (
    data: Json,
    nodeTypes: ISeedStructure,
    options: ISeedOptions
) => {
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
