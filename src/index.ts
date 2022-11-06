import { ISeedStructure } from './types';
import { seed as seedFirebase } from './methods.firebase.nodes';
import { seed as seedRest } from './methods.rest.nodes';

export { initFirebase } from './methods.firebase.nodes';

export const seed = (
    data: Json,
    nodeTypes: ISeedStructure,
    destination: string
) => {
    console.log('destination ->', destination);

    switch (destination) {
        case 'FIREBASE':
            seedFirebase(data, nodeTypes);
            break;
        case 'REST':
            seedRest(data, nodeTypes);
            break;
    }
};
