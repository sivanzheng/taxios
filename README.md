# taxios
Taxios(throttle-axios), using LRU algorithm to achieve caching, can automatically cancel repeated requests.

## Usage

You need to implement the abstract class like this:
```ts

class ConcreteTaxios extends Taxios {
    onFaild(err: string, errCode: number) {
        // You need to handle the error when the request fails
        console.error(err, errCode)
    }
}

// Set config defaults
Taxios.config = {
    baseURL: 'https://api.example.com'
}

const taxios = new ConcreteTaxios()

export default taxios
```

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