// prenota-con-menu.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrenotazioniService } from '../../../shared/services/prenotazioni.service';
import { MenuService } from '../../../shared/services/menu.service';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-prenota-con-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h3>Seleziona un Menu Admin</h3>
    <select [(ngModel)]="selectedMenuId" (change)="loadSelectedMenu()" name="selectedMenuId">
      <option value="" disabled selected>-- Seleziona un menù --</option>
      <option *ngFor="let menu of savedMenus" [value]="menu.id_menu">{{ menu.titolo }}</option>
    </select>

    <div *ngIf="selectedMenu">
      <h4>Menu Selezionato: {{ selectedMenu.titolo }}</h4>
      <div *ngFor="let sezione of selectedMenu.sezioni">
        <strong>{{ sezione.nome_sezione }}</strong>
        <div *ngFor="let piatto of sezione.piatti">
          {{ piatto.nome }} - {{ piatto.prezzo | currency }}
          <label>Quantità:</label>
          <input type="number" [(ngModel)]="piatto.quantita" min="1" required />
        </div>
      </div>
    </div>

    <hr />

    <form (ngSubmit)="effettuaPrenotazione()">
      <!-- Aggiunti avvisi posti e logica di aggiornamento -->
      <label>Data Prenotata:</label>
      <input type="datetime-local" 
             [(ngModel)]="dataPrenotata" 
             name="dataPrenotata" 
             required 
             (change)="aggiornaPostiRimanenti()"/>

      <label>Numero Posti:</label>
      <input type="number" 
             [(ngModel)]="numeroPosti" 
             name="numeroPosti" 
             required 
             min="1" 
             (input)="aggiornaPostiRimanenti()"/>

      <div *ngIf="postiRimanenti !== null">
        <div *ngIf="postiRimanenti <= 0" class="error">
          Posti esauriti per questa data!
        </div>
        <div *ngIf="postiRimanenti > 0 && postiRimanenti <= 10" class="warning">
          Attenzione: solo {{ postiRimanenti }} posti disponibili!
        </div>
      </div>
      
      <label>Note aggiuntive:</label>
      <textarea [(ngModel)]="note" name="note"></textarea>
      
      <button 
        type="submit"
        [disabled]="isSubmitting || postiRimanenti <= 0 || (postiRimanenti - (numeroPosti || 0)) < 0"
        [class.disabled]="isSubmitting"
      >
        {{ isSubmitting ? 'Prenotazione in corso...' : 'Prenota' }}
      </button>
      <div *ngIf="successMessage" class="success">{{ successMessage }}</div>
      <div *ngIf="errorMessage" class="error">{{ errorMessage }}</div>
    </form>
  `,
  styles: [`
    .error { color: red; margin-top: 10px; }
    .warning {
      color: orange;
      margin-top: 10px;
    }
    select { margin-bottom: 20px; padding: 5px; }
    input, textarea { margin-bottom: 10px; }
    .disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  `]
})
export class PrenotaConMenuComponent implements OnInit {
  successMessage: string = '';
  savedMenus: any[] = [];
  selectedMenuId: number | null = null;
  selectedMenu: any = null;
  postiRimanenti: number=100;
  dataPrenotata: string = '';
  numeroPosti: number = 1;
  note: string = '';
  errorMessage: string = '';
  isSubmitting: boolean = false;
  constructor(
    private menuService: MenuService,
    private prenotazioniService: PrenotazioniService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSavedMenus();
  }

  aggiornaPostiRimanenti() {
    if (this.dataPrenotata) {
      this.prenotazioniService.getPostiRimanenti(this.dataPrenotata)
        .subscribe({
          next: (posti) => {
            this.postiRimanenti = posti >= 0 ? posti : 0; // Valore di fallback
          },
          error: () => {
            this.postiRimanenti = 0; // Gestione errori
          }
        });
    }
  }
    
  // Carica i menù creati dall'admin
  loadSavedMenus(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.menuService.getSavedMenus().subscribe({
      next: data => this.savedMenus = data,
      error: err => {
        console.error('Errore nel caricamento dei menù salvati', err);
        this.errorMessage = 'Errore nel caricamento dei menù';
      }
    });
  }

  // Quando l'utente seleziona un menù, lo carica per la prenotazione
  loadSelectedMenu(): void {
    if (!this.selectedMenuId) {
      this.selectedMenu = null;
      return;
    }
    // Trova il menù dalla lista già caricata
    this.selectedMenu = this.savedMenus.find(menu => menu.id_menu === Number(this.selectedMenuId));
    // Inizializza le quantità (minimo 1)
    if (this.selectedMenu && this.selectedMenu.sezioni) {
      this.selectedMenu.sezioni.forEach((sezione: any) => {
        sezione.piatti.forEach((piatto: any) => {
          // Se non esiste già, imposta la quantità a 1
          if (!piatto.quantita) {
            piatto.quantita = 1;
          }
        });
      });
    }
  }

  effettuaPrenotazione(): void {
    // Validazione data: non può essere antecedente a oggi
    const prenotazioneDate = new Date(this.dataPrenotata);
    const today = new Date();
    if (this.postiRimanenti !== null && 
      (this.postiRimanenti - this.numeroPosti) < 0) {
    this.errorMessage = 'Non ci sono abbastanza posti disponibili!';
    return;
  }
    if (prenotazioneDate < today) {
      this.errorMessage = 'La data e ora prenotata non possono essere antecedente ad oggi';
      return;
    }
    // Validazione posti
    if (this.numeroPosti < 1) {
      this.errorMessage = 'Il numero di posti deve essere almeno 1';
      return;
    }
    // Costruisci l'oggetto prenotazione con i piatti del menù selezionato
    if (!this.selectedMenu || !this.selectedMenu.sezioni) {
      this.errorMessage = 'Nessun menù selezionato';
      return;
    }
    const piattiPrenotati: { fk_piatto: number; quantita: number }[] = [];
    this.selectedMenu.sezioni.forEach((sezione: any) => {
      sezione.piatti.forEach((piatto: any) => {
        if (Number(piatto.quantita) >= 1) {
          piattiPrenotati.push({ fk_piatto: piatto.id_piatto, quantita: Number(piatto.quantita) });
        }
      });
    });
    if (piattiPrenotati.length === 0) {
      this.errorMessage = 'Seleziona almeno un piatto con quantità valida';
      return;
    }
  
    const prenotazione = {
      data_prenotata: this.dataPrenotata,
      numero_posti: this.numeroPosti,
      note_aggiuntive: this.note,
      piatti: piattiPrenotati
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    if (this.isSubmitting) return; // Blocca click multipli
  
    this.isSubmitting = true;
    this.prenotazioniService.effettuaPrenotazioneConMenu(prenotazione).subscribe({
      next: response => {
        console.log('Prenotazione con menu effettuata', response);
        this.errorMessage = '';
        this.successMessage = 'Prenotazione effettuata con successo'; // Aggiungi
        setTimeout(() => {
          this.router.navigateByUrl('/profilo');
          this.isSubmitting = false; 
        }, 2000);
      },
      error: err => {
        console.error('Errore nella prenotazione con menu', err);
        this.errorMessage = err.error.message || 'Errore durante la prenotazione con menu';
        this.isSubmitting = false;
      }
    });
  }
}
