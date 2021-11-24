import md5 from 'md5'
import { Config } from './models'

export const objectKeySort = (obj: any) => {
    if (!obj) return null
    const keys = Object.keys(obj).sort()
    const newObj = Object.create({})
    const len = keys.length
    for (let i = 0; i < len; i++) {
        newObj[keys[i]] = obj[keys[i]]
    }
    return newObj
}

export const generateHash = (config: Config) => {
    const {
        url, method, data, params,
    } = config
    const m = method?.toUpperCase()
    let payload = m === 'GET' ? params : data
    if (payload && Object.prototype.toString.call(payload) === '[object Object]') {
        payload = objectKeySort(payload)
    }
    return md5(JSON.stringify({ url, payload, method: m }))
}

export const CANCEL_MESSAGE = 'There is the same request in pengding state, the request has been cancelled.'

export const NEED_CONFIG = 'You should configure Taxios first.'
