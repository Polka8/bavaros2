// block-confirmation.dialog.ts
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'block-confirmation',
  template: `
    <div class="dialog-content">
      <h3>Confermare il blocco?</h3>
      <div class="actions">
        <button mat-button (click)="confirm()">Si</button>
        <button mat-button (click)="cancel()">No</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-content { padding: 20px; }
    .actions { margin-top: 20px; text-align: right; }
  `]
})
export class BlockConfirmationDialog {
  constructor(public dialogRef: MatDialogRef<BlockConfirmationDialog>) {}

  confirm() { this.dialogRef.close(true); }
  cancel() { this.dialogRef.close(false); }
}