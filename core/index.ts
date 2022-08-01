import axios, {
    AxiosError,
    AxiosResponse,
    AxiosInstance,
    AxiosRequestConfig,
    Canceler,
} from 'axios'
import LRUCache from './LRUCache'
import { Config, Interceptors } from './models'
import { generateHash, CANCEL_MESSAGE, NEED_CONFIG } from './utils'

export default abstract class Taxios {
    readonly cache: LRUCache
    readonly cancelers: Map<string, Canceler>

    constructor(
    ) {
        this.cache = new LRUCache(Taxios.config.capacity || 100)

        this.cancelers = new Map()

        this.instance.interceptors.request.use(
            this.requestCancelerInterceptor,
            (error) => Promise.reject(error),
        )

        if (Taxios.interceptors && Taxios.interceptors.request) {
            for (const interceptor of Taxios.interceptors.request.reverse()) {
                this.instance.interceptors.request.use(
                    interceptor,
                    (error) => Promise.reject(error),
                )
            }
        }

        if (Taxios.interceptors && Taxios.interceptors.response) {
            for (const interceptor of Taxios.interceptors.response) {
                this.instance.interceptors.response.use(
                    interceptor,
                    (error) => Promise.reject(error),
                )
            }
        }

        this.instance.interceptors.response.use(
            this.responseCacheInterceptor,
            this.responseErrorInterceptor,
        )
    }

    abstract onFaild(err: string, errCode: number): void

    private static taxiosInterceptors: Interceptors

    static get interceptors(): Interceptors {
        if (!Taxios.taxiosInterceptors) return { request: [], response: [] }
        return Taxios.taxiosInterceptors
    }

    static set interceptors(interceptors: Interceptors) {
        Taxios.taxiosInterceptors = interceptors
    }

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

    private requestCancelerInterceptor = (config: Config) => {
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
            this.cache.set(hash, response)
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

    async get<T = any, D = any>(
        url: string,
        config?: Config<D>,
    ): Promise<AxiosResponse<T>> {
        if (config && config.cacheable) {
            const result = this.checkCache({ ...config, url, method: 'GET' })
            if (result) return result
        }
        return this.instance.get<T, AxiosResponse<T, D>, D>(url, Object.assign(Object.create({}), Taxios.config, config))
    }

    async post<T = any, D = any>(
        url: string,
        config?: Config<D>,
    ): Promise<AxiosResponse<T>> {
        if (config && config.cacheable) {
            const result = this.checkCache({ ...config, url, method: 'POST' })
            if (result) return result
        }
        const data = config?.data
        return this.instance.post<T, AxiosResponse<T, D>, D>(url, data, Object.assign(Object.create({}), Taxios.config, config))
    }
}
