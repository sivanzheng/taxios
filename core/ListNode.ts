export default class ListNode {
    public key: string | Symbol
    public value: any
    public prev: ListNode | null
    public next: ListNode | null

    constructor(key: string | Symbol, value: any) {
        this.key = key
        this.value = value
        this.prev = null
        this.next = null
    }
}
