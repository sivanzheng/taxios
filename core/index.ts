/* eslint-disable no-unused-vars */
import axios, {
    AxiosError,
    AxiosResponse,
    AxiosInstance,
    AxiosRequestConfig,
    Canceler,
} from 'axios'
import { Config } from './models'
import LRUCache from './LRUCache'
import { generateHash, CANCEL_MESSAGE, NEED_CONFIG } from './utils'

export default abstract class Taxios {
    readonly cache: LRUCache
    readonly cancelers: Map<string, Canceler>

    constructor() {
        this.cache = new LRUCache(Taxios.config.capacity || 100)

        this.cancelers = new Map()

        this.instance.interceptors.request.use(
            this.requestCancelerInterceptors,
            (error) => Promise.reject(error),
        )

        this.instance.interceptors.response.use(
            this.responseCacheInterceptor,
            this.responseErrorInterceptor,
        )
    }

    abstract onFaild(err: string, errCode: number): void

    private static taxiosConfig: AxiosRequestConfig

    static get config() {
        if (!Taxios.taxiosConfig) throw new Error(NEED_CONFIG)
        return Taxios.taxiosConfig
    }

    static set config(config: Config) {
        Taxios.taxiosConfig = config
    }

    private axiosInstance: AxiosInstance | undefined

    get instance() {
        if (!this.axiosInstance) {
            this.axiosInstance = axios.create({
                ...Taxios.config,
            })
        }
        return this.axiosInstance
    }

    private requestCancelerInterceptors = (config: Config) => {
        const { cancelable } = config
        if (cancelable) {
            this.consumeCanceler(config)
            config.cancelToken = this.generateCanceler(config)
        }
        return Promise.resolve(config)
    }

    private responseCacheInterceptor = (response: AxiosResponse<any, any>) => {
        const config = response.config as Config
        const { url, method, cacheable } = config
        if (url && method && cacheable) {
            const hash = generateHash(config)
            this.cache.set(hash, response.data)
        }
        return Promise.resolve(response)
    }

    private responseErrorInterceptor = (err: AxiosError) => {
        const { response } = err
        let { message } = err
        if (response) message = response.statusText
        this.onFaild(message, response?.status || 500)
        return Promise.reject(err)
    }

    private checkCache(config: Config) {
        const hash = generateHash(config)
        const value = this.cache.get(hash)
        if (value) return value
        return null
    }

    private generateCanceler(config: Config) {
        if (config.cancelToken) return config.cancelToken
        const hash = generateHash(config)
        return new axios.CancelToken((cancel) => {
            if (!this.cancelers.has(hash)) this.cancelers.set(hash, cancel)
        })
    }

    private consumeCanceler(config: Config) {
        const hash = generateHash(config)
        if (this.cancelers.has(hash)) {
            const canceler = this.cancelers.get(hash)
            canceler!(CANCEL_MESSAGE)
            this.cancelers.delete(hash)
        }
    }

    async get<T = any, R = AxiosResponse<T>, D = any>(
        url: string,
        config?: Config<D>,
    ): Promise<R> {
        if (config?.cacheable) {
            const result = this.checkCache({ ...config, url, method: 'GET' })
            if (result) return result
        }
        return this.instance.get(url, Object.assign(Object.create({}), Taxios.config, config))
    }

    async post<T = any, R = AxiosResponse<T>, D = any>(
        url: string,
        config?: Config<D>,
    ): Promise<R> {
        if (config?.cacheable) {
            const result = this.checkCache({ ...config, url, method: 'POST' })
            if (result) return result
        }
        const data = config?.data
        return this.instance.post(url, data, Object.assign(Object.create({}), Taxios.config, config))
    }
}
