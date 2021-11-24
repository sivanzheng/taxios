import { AxiosRequestConfig } from 'axios'

export interface Config<T = any> extends AxiosRequestConfig<T> {
    capacity?: number
    cacheable?: boolean
    cancelable?: boolean
}
