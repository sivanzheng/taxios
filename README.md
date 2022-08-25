# taxios
Taxios(throttle-axios), using LRU algorithm to achieve caching, can automatically cancel repeated requests.

## Usage

You need to implement the abstract class like this:
```ts
class AbstractTaxios extends Taxios {
    onFaild(err: string, errCode: number) {
        // You need to handle the error when the request fails
        console.error(err, errCode)
    }
}

// Set config defaults
Taxios.config = {
    baseURL: 'https://api.example.com'
}

// Set your interceptors
Taxios.interceptors = {
    request: [
        (config) => {
            // Do what you want before the request
            console.log('request interceptor 1')
            return Promise.resolve(config)
        },
        (config) => {
            console.log('request interceptor 2')
            return Promise.resolve(config)
        },
    ],
    response: [
        (res) => {
            // Do what you want after getting the response
            console.log('response interceptor: 1', res)
            return Promise.resolve(res)
        },
        (res) => {
            console.log('response interceptor: 2', res)
            return Promise.resolve(res)
        },
    ],
}

const taxios = new AbstractTaxios()

export default taxios
```

> The order of execution of the interceptors is

> for request: 
> 1. request interceptor 1
> 2. request interceptor 2
> 3. and so on...
> 4. the default request interceptor in taxios

> for response: 
> 1. response interceptor 1
> 2. response interceptor 2
> 3. and so on...
> 4. the default response interceptor in taxios

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

If there is a request consistent with the status of pengding, it will be cancelled.
