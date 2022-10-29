import { AxiosRequestConfig, AxiosResponse, AxiosError as Err } from 'axios'

export type AxiosError<T = unknown, D = any> = Err<T, D>

export type Response<T> = AxiosResponse<T>

export interface Config<T = any> extends AxiosRequestConfig<T> {
    capacity?: number
    cacheable?: boolean
    cancelable?: boolean
}

export type RequestInterceptor = (config: Config) => Promise<Config>

export type ResponseInterceptor = <T, D>(response: T | AxiosResponse<T>) => Promise<AxiosResponse | D>;

export interface Interceptors {
    request: RequestInterceptor[]
    response: ResponseInterceptor[]
}