interface INode<T> {
    value: T;
    next: INode<T> | null;
}

interface IQueue<T> {
    enqueue(item: T): void;
    dequeue(): T | undefined;
    size(): number;
}

class Node<T> implements INode<T> {
    value: T;
    next: INode<T> | null = null;

    constructor(value: T) {
        this.value = value;
    }
}

export class Queue<T> implements IQueue<T> {
    private head: INode<T> | null = null;
    private tail: INode<T> | null = null;
    private numberOfNodes = 0;

    enqueue(item: T): void {
        if (this.head == null) {
            this.head = new Node(item);
            this.tail = this.head;
            this.numberOfNodes++;
        } else {
            if (this.tail) {
                let newNode = new Node(item);
                this.tail.next = newNode;
                this.tail = newNode;
                this.numberOfNodes++;
            }
        }
    }
    dequeue(): T | undefined {
        if (this.head !== null) {
            const nodeToReturn = this.head;
            this.head = this.head.next;
            this.numberOfNodes--;
            return nodeToReturn.value;
        }

        return undefined;
    }
    size(): number {
        return this.numberOfNodes;
    }
}