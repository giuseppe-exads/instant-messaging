import { Injectable } from "@angular/core";
import { Observable, Observer } from 'rxjs';
import { AnonymousSubject } from 'rxjs/internal/Subject';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Queue } from "../common/queue";

const CHAT_URL = "ws://localhost:5000";

export enum TypeMessage {
    Message,
    ListUsers,
    UserId
}

export interface Message {
    type: TypeMessage,
    source: { id: string, name: string };
    content: any;
    toAll: boolean,
    recipients: Array<string>
}

@Injectable()
export class WebsocketService {
    private subject: AnonymousSubject<MessageEvent> | null = null;
    public messages: Subject<Message> | undefined;
    private queue: Queue<Object>; 
    public onOpen: Subject<void> = new Subject();
    public onError: Subject<void> = new Subject();

    constructor() {
        this.queue = new Queue<string>();
    }

    public openConnection(clientName: string) {
        return this.messages = <Subject<Message>>this.connect(CHAT_URL + '?clientName=' + clientName ).pipe(
            map(
                (response: MessageEvent): Message => {
                    let data = JSON.parse(response.data)
                    return data;
                }
            )
        );
    }

    private connect(url: string): AnonymousSubject<MessageEvent> {
        if (!this.subject) {
            this.subject = this.create(url);
            console.log("Successfully connected: " + url);
        }
        return this.subject;
    }

    private create(url: string): AnonymousSubject<MessageEvent> {
        let ws = new WebSocket(url);

        ws.addEventListener('error', () => {
            this.subject = null;
            this.onError.next();
        });

        ws.addEventListener('close', () => {
            this.subject = null;
            this.onError.next();
        });

        let observable = new Observable((obs: Observer<MessageEvent>) => {
            ws.onmessage = obs.next.bind(obs);
            ws.onerror = obs.error.bind(obs);
            ws.onclose = obs.complete.bind(obs);
            ws.onopen = () => this.onOpen.next()
            return ws.close.bind(ws);
        });
        let observer = {
            error: null,
            complete: null,
            next: (data: Object) => {
                this.queue.enqueue(data);
            }
        } as any;

        setInterval(() => {
            if (ws.bufferedAmount == 0) {
                let data = this.getMoreData();
                if (data) {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(data));
                    }
                }
            }
        }, 100);

        return new AnonymousSubject<MessageEvent>(observer, observable);
    }

    getMoreData(): Object | undefined {
        if (this.queue.size() > 0) {
            return this.queue.dequeue();
        }

        return undefined;
    }
}