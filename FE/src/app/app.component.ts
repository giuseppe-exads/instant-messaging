//src\app\app.component.ts
import { Component } from '@angular/core';
import { Message, WebsocketService } from "./services/websocket.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  providers: [WebsocketService]
})

export class AppComponent {
  title = 'socketrv';
  content = '';
  received: Array<Message> = [];
  sent: Array<Message> = [];
  name = '';
  numberOfUsers = 0;


  onGeneratedName(name: string) {
    setTimeout(() => {
      this.name = name;
    });
  }
}