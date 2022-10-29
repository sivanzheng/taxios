import ListNode from './ListNode'

export const EMPTY_KEY = Symbol('LRUCACHE_EMPTY_KEY')
export const EMPTY_VALUE = Symbol('LRUCACHE_EMPTY_VALUE')

export default class LRUCache {
    private capacity: number
    private map: Map<string, ListNode>
    private head: ListNode
    private tail: ListNode

    constructor(
        capacity: number,
    ) {
        this.map = new Map()
        this.capacity = capacity
        this.head = new ListNode(EMPTY_KEY, EMPTY_VALUE)
        this.tail = new ListNode(EMPTY_KEY, EMPTY_VALUE)
        this.head.next = this.tail
        this.tail.prev = this.head
    }

    static removeNode(node: ListNode) {
        if (node.prev) node.prev.next = node.next
        if (node.next) node.next.prev = node.prev
    }

    public travel() {
        const result = []
        let node = this.head
        while (node) {
            result.push(node.value)
            if (!node.next) break
            node = node.next
        }
        return result
    }

    private moveToHead(node: ListNode) {
        node.prev = this.head
        node.next = this.head.next
        this.head.next!.prev = node
        this.head.next = node
    }

    public has = (key: string) => this.map.has(key)

    public get(key: string) {
        const node = this.map.get(key)
        if (!node) return null
        LRUCache.removeNode(node)
        this.moveToHead(node)
        return node.value
    }

    public set(key: string, value: any) {
        if (value === null || value === undefined) return
        if (this.get(key) !== null) {
            const node = this.map.get(key)
            node!.value = value
            return
        }
        const node = new ListNode(key, value)
        this.map.set(key, node)
        this.moveToHead(node)

        if (this.map.size > this.capacity) {
            const secondLastNode = this.tail.prev
            if (secondLastNode) {
                LRUCache.removeNode(secondLastNode)
                this.map.delete(secondLastNode.key as string)
            }
        }
    }
}
