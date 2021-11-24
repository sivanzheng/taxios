import LRUCache from '../core/LRUCache'

test('it should strict equal [null, null, 2, 6]', () => {
    const cache = new LRUCache(2)
    const t1 = cache.get('2')
    cache.set('2', 6)
    const t2 = cache.get('1')
    cache.set('1', 5)
    cache.set('1', 2)
    const t3 = cache.get('1')
    const t4 = cache.get('2')
    expect([t1, t2, t3, t4]).toStrictEqual([null, null, 2, 6])
})

test('it should strict equal [null, 3]', () => {
    const cache = new LRUCache(2)
    cache.set('2', 1)
    cache.set('1', 1)
    cache.set('2', 3)
    cache.set('4', 1)
    const t1 = cache.get('1')
    const t2 = cache.get('2')
    expect([t1, t2]).toStrictEqual([null, 3])
})

test('it should strict equal null', () => {
    const cache = new LRUCache(1)
    expect(cache.get('0')).toStrictEqual(null)
})