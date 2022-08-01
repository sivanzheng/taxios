import { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface Config<T = any> extends AxiosRequestConfig<T> {
    capacity?: number
    cacheable?: boolean
    cancelable?: boolean
}

export interface Interceptors {
    request?: ((config: Config) => Promise<Config>)[]
    response?: ((response: AxiosResponse) => Promise<AxiosResponse>)[]
}