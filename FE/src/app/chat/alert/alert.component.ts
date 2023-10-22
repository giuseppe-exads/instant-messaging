import {Component} from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'alert-view',
  templateUrl: 'alert.component.html',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
})
export class AlertComponent {}