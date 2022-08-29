import axios, {
    AxiosError,
    AxiosResponse,
    AxiosInstance,
    AxiosRequestConfig,
    Canceler,
} from 'axios'
import LRUCache from './LRUCache'
import { Config, RequestInterceptor } from './models'
import { generateHash, CANCEL_MESSAGE, NEED_CONFIG, pipe } from './utils'

export default abstract class Taxios {
    readonly cache: LRUCache
    readonly cancelers: Map<string, Canceler>

    private responseInterceptors: ((res: any) => any)[] = []

    constructor() {
        this.cache = new LRUCache(Taxios.config.capacity || 100)

        this.cancelers = new Map()

        this.instance.interceptors.request.use(
            this.requestCancelerInterceptor,
            (error) => Promise.reject(error),
        )

        this.instance.interceptors.response.use(
            this.responseCacheInterceptor,
            this.responseErrorInterceptor,
        )
    }

    abstract onFaild(err: AxiosError): void


    interceptors = new Proxy<{
        request?: RequestInterceptor | null,
        response?<T, D>(res: T): Promise<D>
        response?(res: AxiosResponse): Promise<AxiosResponse>
        response?<T>(res: AxiosResponse<T>): Promise<AxiosResponse<T>>
        response?<T, D>(res: T | AxiosResponse<T>): Promise<D> | Promise<AxiosResponse<T>>
    }>(
        {},
        {
            get: (target, key, receiver) => Reflect.get(target, key, receiver),
            set: (target, key, value, receiver) => {
                if (key === 'request') {
                    this.instance.interceptors.request.use(
                        value,
                        (error) => Promise.reject(error),
                    )
                }
                if (key === 'response') {
                    this.responseInterceptors.push(value)
                    this.instance.interceptors.response.use(
                        value,
                        (error) => Promise.reject(error),
                    )
                }
                return Reflect.set(target, key, value, receiver);
            }
        }
    )

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
        this.onFaild(err)
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
            if (result) {
                return await pipe(...this.responseInterceptors)(result)
            } 
        }
        const data = config?.data
        return this.instance.post<T, AxiosResponse<T, D>, D>(url, data, Object.assign(Object.create({}), Taxios.config, config))
    }
}
