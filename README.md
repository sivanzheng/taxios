# taxios
Taxios(throttle-axios), using LRU algorithm to achieve caching, can automatically cancel repeated requests.

## Usage

You need to implement the abstract class like this:
```ts
// Set config defaults
Taxios.config = {
    baseURL: 'https://api.example.com'
}

class AbstractTaxios extends Taxios {
    // All errors with http status !== 200 will appear here
    async onFailed(err: AxiosError) {
        console.error(err, errCode)
    }
}

const taxios = new AbstractTaxios()

// Set your interceptors
taxios.interceptors.request = (config) => {
    // Do what you want before the request
    console.log('request interceptor')
    return Promise.resolve(config)
}

taxios.interceptors.response = (res) => {
    // Do what you want after getting the response
    console.log('response interceptor: 1', res)
    return Promise.resolve(res)
}

taxios.interceptors.response = (res) => {
    console.log('response interceptor: 2', res)
    return Promise.resolve(res)
}

export default taxios
```

> The order of execution of the interceptors:

> for request: 
> 1. request interceptor
> 1. and so on...
> 1. the default request interceptor in taxios

> for response: 
> 1. the default response interceptor in taxios
> 1. response interceptor 1
> 1. response interceptor 2 
> 1. and so on...

## Configurations
taxios extends axios's configurations

- capacity: number `For Global`
> Maximum number of caches

- cacheable: boolean `For Single Request`
> Enable caching

- cancelable: boolean  `For Single Request`
> Enable canceling the request consistent with the status of pengding

## Same Request
Use `md5` to generate a unique hash for each request, if the `url`, `method`, `params` or `body` of this request are consistent with the others, then the request is considered the same request.

## Cache

Use the [LRU](./https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)) algorithm to manage the cache.

## [Cancellation](https://axios-http.com/docs/cancellation)

If there is a request consistent with the status of pending, it will be cancelled.

## [Axios Auth Refresh]((https://github.com/Flyrell/axios-auth-refresh#usage))

Refresh the token by implementing the **onTokenExpired**.