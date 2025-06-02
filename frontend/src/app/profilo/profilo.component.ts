import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
import { PrenotazioniService } from '../shared/services/prenotazioni.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container" *ngIf="user; else loadingTemplate">
      <h2>Profilo Utente</h2>
      <p><strong>Nome:</strong> {{ user.nome }}</p>
      <p><strong>Cognome:</strong> {{ user.cognome }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Data di registrazione:</strong> {{ user.creato_il | date:'medium' }}</p>
      <div class="sections-row">
        <div class="section-box" (click)="setSection('active')">
          <h3>Prenotazioni Attive</h3>
        </div>
        <div class="section-box" (click)="setSection('all')">
          <h3>Tutte le Prenotazioni</h3>
        </div>
      </div>
      <div class="reservations-container" *ngIf="activeSection === 'active'">
        <h4>Prenotazioni Attive</h4>
        <div *ngFor="let prenotazione of prenotazioniAttive">
          <p>
            <strong>ID:</strong> {{ prenotazione.id_prenotazione }} -
            <strong>Data:</strong> {{ prenotazione.data_prenotata | date:'short' }} -
            <strong>Stato:</strong> {{ prenotazione.stato }} -
            <strong>Numero Posti:</strong> {{ prenotazione.numero_posti }} -
            <strong>Piatti Ordinati:</strong> {{ getPiattiOrdinati(prenotazione) }}
          </p>
          <button (click)="cancelReservation(prenotazione.id_prenotazione)">Annulla</button>
        </div>
      </div>
      <div class="reservations-container" *ngIf="activeSection === 'all'">
        <h4>Tutte le Prenotazioni</h4>
        <div class="filters">
          <input type="date" [(ngModel)]="filterDate" (change)="applyFilter()" />
          <div>
            <label><input type="checkbox" [(ngModel)]="filterStatus.attiva" (change)="applyFilter()" /> Attiva</label>
            <label><input type="checkbox" [(ngModel)]="filterStatus.annullata" (change)="applyFilter()" /> Annullata</label>
          </div>
          <select [(ngModel)]="sortOrder" (change)="applyFilter()">
            <option value="recent">Più recenti</option>
            <option value="oldest">Più vecchie</option>
          </select>
        </div>
        <div *ngFor="let prenotazione of filteredReservations">
          <p>
            <strong>ID:</strong> {{ prenotazione.id_prenotazione }} -
            <strong>Data:</strong> {{ prenotazione.data_prenotata | date:'short' }} -
            <strong>Stato:</strong> {{ prenotazione.stato }} -
            <strong>Numero Posti:</strong> {{ prenotazione.numero_posti }} -
            <strong>Piatti Ordinati:</strong> {{ getPiattiOrdinati(prenotazione) }}
          </p>
        </div>
      </div>
    </div>
    <ng-template #loadingTemplate>
      <p>Caricamento dati in corso...</p>
    </ng-template>
  `,
  styles: [`
    .profile-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 20px;
    }
    p {
      font-size: 1.1em;
      color: #555;
    }
    .sections-row {
      display: flex;
      justify-content: center;
      margin: 20px 0;
      gap: 20px;
    }
    .section-box {
      flex: 1;
      min-width: 200px;
      height: 100px;
      background-color: rgb(28, 21, 18);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.3s, transform 0.3s;
    }
    .section-box:hover {
      background-color: rgb(28, 21, 18);
      transform: translateY(-2px);
    }
    .reservations-container {
      margin-top: 20px;
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #f9f9f9;
    }
    h4 {
      margin-bottom: 15px;
      color: #333;
    }
    .filters {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-bottom: 15px;
    }
    input[type="date"] {
      padding: 8px;
      border-radius: 5px;
      border: 1px solid #ced4da;
      transition: border-color 0.3s;
    }
    input[type="date"]:focus {
      border-color: #80bdff;
      outline: none;
    }
    select {
      padding: 8px;
      border-radius: 5px;
      border: 1px solid #ced4da;
      transition: border-color 0.3s;
    }
    select:focus {
      border-color: #80bdff;
      outline: none;
    }
    button {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.3s;
    }
    button:hover {
      background-color: #c82333;
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: any;
  activeSection: 'active' | 'all' = 'active';
  prenotazioniAttive: any[] = [];
  prenotazioniAll: any[] = [];
  filteredReservations: any[] = [];
  filterDate: string = '';
  filterStatus = { attiva: true, annullata: true };
  sortOrder: 'recent' | 'oldest' = 'recent';

  constructor(private authService: AuthService, private prenotazioniService: PrenotazioniService) {}

  ngOnInit(): void {
    this.user = this.authService.getUserInfo();
    if (this.user) {
      this.loadPrenotazioni();
    }
  }

  loadPrenotazioni(): void {
    const userId = Number(this.user.id);
    this.prenotazioniService.getPrenotazioniStorico(userId).subscribe({
      next: data => {
        this.prenotazioniAll = data;
        this.prenotazioniAttive = this.prenotazioniAll.filter(p => p.stato.toLowerCase() === 'attiva');
        this.filteredReservations = [...this.prenotazioniAll];
      },
      error: err => console.error('Errore nel recupero delle prenotazioni', err)
    });
  }

  setSection(section: 'active' | 'all'): void {
    this.activeSection = section;
    if (section === 'all') {
      this.filteredReservations = [...this.prenotazioniAll];
    }
  }

  applyFilter(): void {
    let filtered = [...this.prenotazioniAll];

    if (this.filterDate) {
      const filterDateObj = new Date(this.filterDate);
      filtered = filtered.filter(p => {
        const prenotazioneDate = new Date(p.data_prenotata);
        return prenotazioneDate.toDateString() === filterDateObj.toDateString();
      });
    }

    if (!this.filterStatus.attiva) {
      filtered = filtered.filter(p => p.stato.toLowerCase() !== 'attiva');
    }

    if (!this.filterStatus.annullata) {
      filtered = filtered.filter(p => p.stato.toLowerCase() !== 'annullata');
    }

    filtered.sort(this.getSortFunction());
    this.filteredReservations = filtered;
  }

  getSortFunction(): (a: any, b: any) => number {
    return this.sortOrder === 'recent'
      ? (a, b) => new Date(b.data_prenotata).getTime() - new Date(a.data_prenotata).getTime()
      : (a, b) => new Date(a.data_prenotata).getTime() - new Date(b.data_prenotata).getTime();
  }

  cancelReservation(prenotazioneId: number): void {
    const conferma = window.confirm('Sei sicuro di voler annullare questa prenotazione?');
    if (!conferma) return;

    this.prenotazioniService.cancelPrenotazione(prenotazioneId).subscribe({
      next: response => {
        console.log('Prenotazione annullata', response);
        this.loadPrenotazioni();
      },
      error: err => console.error('Errore nell\'annullamento della prenotazione', err)
    });
  }


  getPiattiOrdinati(prenotazione: any): string {
    if (prenotazione.piatti && prenotazione.piatti.length > 0) {
      return prenotazione.piatti.map((piatto: any) => `${piatto.nome} (Quantità: ${piatto.quantita})`).join(', ');
    }
    return 'Nessun piatto ordinato';
  }
}
