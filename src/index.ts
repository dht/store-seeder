import { ISeedOptions, ISeedStructure } from './types';
import { seed as seedFirebase } from './methods.firebase.nodes';
import { seed as seedRest } from './methods.rest.nodes';

export { initFirebase } from './methods.firebase.nodes';

export const seed = (
    data: Json,
    nodeTypes: ISeedStructure,
    destination: string,
    options: ISeedOptions = {}
) => {
    switch (destination) {
        case 'FIREBASE':
            seedFirebase(data, nodeTypes, options);
            break;
        case 'REST':
            seedRest(data, nodeTypes, options);
            break;
    }
};
