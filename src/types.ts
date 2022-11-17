export type NodeType = 'single' | 'collection' | 'groupedList';

export type ISeedStructure = Record<string, NodeType>;

export type ISeedOptions = {
    clearNodes?: boolean;
};
