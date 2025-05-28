import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // Se usi ngModel
// Importa i componenti figli
import { PrenotaSoloComponent } from './prenota-solo/prenota-solo.component';
import { PrenotaConMenuComponent } from './prenota-con-menu/prenota-con-menu.component';

@Component({
  selector: 'app-prenota',
  standalone: true,
  imports: [CommonModule, FormsModule, PrenotaSoloComponent, PrenotaConMenuComponent],
  template: `
    <div class="prenotazioni-container">
      <h2>Effettua una Prenotazione</h2>
      <div class="modalita-buttons">
        <button (click)="setModalita('solo')">Solo Posti</button>
        <button (click)="setModalita('menu')">Con Menu</button>
      </div>

      <div *ngIf="modalita === 'solo'">
        <app-prenota-solo></app-prenota-solo>
      </div>
      <div *ngIf="modalita === 'menu'">
        <app-prenota-con-menu></app-prenota-con-menu>
      </div>
    </div>
  `,
  styles: [`
    .modalita-buttons {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
    button {
      margin: 0 10px;
      padding: 10px 20px;
    }
  `]
})
export class PrenotaComponent {
  modalita: 'solo' | 'menu' | null = null;

  setModalita(mod: 'solo' | 'menu') {
    this.modalita = mod;
  }
}
