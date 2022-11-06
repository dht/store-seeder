import axios, { AxiosInstance } from 'axios';
import { ApiRequest, RestAdapter } from 'redux-connected';

export const axiosInstance = axios.create({
    baseURL: 'http://localhost:3009',
});

export const restAdapter = new RestAdapter({
    axios: axiosInstance as any,
});

let index = 0;
export class RequestBuilder {
    private request: ApiRequest = {
        id: String(index++),
        sequence: index,
        shortId: String(index++),
        argsApiVerb: 'add',
        argsMethod: 'GET',
        argsNodeName: '',
        argsNodeType: 'SINGLE_NODE' as any,
        argsPath: '/',
        createdTS: ts(),
        items: [],
        requestStatus: 'CREATED' as any,
        resourceId: '',
        resourceItemId: '',
    };

    constructor() {}

    withParams(params: Partial<ApiRequest>) {
        this.request = {
            ...this.request,
            ...params,
        };
        return this;
    }

    build() {
        return this.request;
    }
}

const ts = () => new Date().getTime();
