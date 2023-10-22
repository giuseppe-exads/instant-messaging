import { AfterViewInit, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TypeMessage, WebsocketService, Message as WSMessage } from '../services/websocket.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './dialog/dialog.component';
import { MatSelectionList } from '@angular/material/list';
import { AlertComponent } from './alert/alert.component';


export interface Message {
  author: string;
  content: string | null;
  date: Date;
  myMsg: boolean;
  toAll: boolean;
  recipients?: string;
}

export interface Client {
  id: string;
  name: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements AfterViewInit {
  @ViewChild('usersSelect')
  usersSelect!: MatSelectionList;

  @Output() onGeneratedName = new EventEmitter<string>();

  chatForm;
  name = '';
  id = '';
  usersList: Array<Client> = [];
  messages: Message[] = [
  ];
  connected = false;

  constructor(
    private websocketService: WebsocketService,
    private matDialog: MatDialog) {
    this.chatForm = new FormGroup({
      message: new FormControl('')
    });

    this.setConnectionAsEnabled(false);

    this.websocketService.onOpen
      .subscribe(item => {
        this.setConnectionAsEnabled(true);
      });

    this.websocketService.onError
      .subscribe(() => {
        setTimeout(() => {
          this.openConnection();
        }, 2000);
      })

  }

  ngAfterViewInit(): void {
    this.openDialog();
  }

  setConnectionAsEnabled(isActive: boolean) {
    this.connected = isActive;
    if (!isActive) {
      this.chatForm.get('message')?.disable();
    } else {
      this.chatForm.get('message')?.enable();
    }
  }

  openConnection() {
    this.websocketService.openConnection(this.name).subscribe({
      next: (msg) => {
        if (msg.type === TypeMessage.Message) {
          if (msg && msg.content) {
            this.messages.unshift({
              author: msg.source.id !== this.id ? msg.source.name : 'Me',
              content: msg.content,
              date: new Date(),
              toAll: msg.toAll,
              // message made by current user
              recipients: msg.source.id === this.id ?
                msg.recipients.map(item => this.usersList.find(user => user.id === item)?.name).join(', ') : '',
              myMsg: msg.source.id === this.id
            });
          }
        } else if (msg.type === TypeMessage.ListUsers) {
          this.usersList = msg.content ? Array.from(msg.content) : [];
          this.usersList = this.usersList.filter(user => user.id !== this.id)
        } else if (msg.type === TypeMessage.UserId && msg.content) {
          this.id = msg.content;
        }
      },
      error: (e) => this.setConnectionAsEnabled(false),
      complete: () => this.setConnectionAsEnabled(false)
    })
  }

  resetUI() {
    this.usersList.splice(0);
    this.id = '';
    this.messages.splice(0);
    this.name = '';
    this.openDialog();
  }

  openAlert() {
    this.matDialog.open(AlertComponent);
  }

  openDialog(): void {
    const dialogRef = this.matDialog.open(DialogComponent, {
      disableClose: true,
      data: { name: this.name },
    });

    dialogRef.afterClosed().subscribe(result => {
      this.name = result;
      this.onGeneratedName.emit(result);
      this.openConnection();
    });
  }

  sendMessage() {
    let recipientIds = [];
    let recipientNames = 'all';

    const toAll = this.usersSelect.selectedOptions.selected.length == 0;

    if (!toAll) {
      recipientIds = this.usersSelect.selectedOptions.selected.map(item => item.value.id);
      recipientNames = this.usersSelect.selectedOptions.selected.map(item => item.value.name).join(', ');
    }

    let message = {
      type: TypeMessage.Message,
      source: {},
      content: '',
      toAll: this.usersSelect.selectedOptions.selected.length == 0,
      recipients: recipientIds
    } as WSMessage;

    message.source = { id: this.id, name: this.name };
    message.content = this.chatForm.get('message')?.value;

    if (this.websocketService.messages) {
      this.websocketService.messages.next(message);
    }
    this.chatForm.get('message')?.setValue('');
  }

  sendRequestUserList() {
    let message = {
      type: TypeMessage.ListUsers,
      source: {},
      content: ''
    } as WSMessage;

    message.source = { id: this.id, name: this.name };

    if (this.websocketService.messages) {
      this.websocketService.messages.next(message);
    }
  }

}

