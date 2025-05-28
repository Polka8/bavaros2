import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common'; // Import CurrencyPipe
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../shared/services/admin.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip'; // Import MatTooltipModule
import { MatDividerModule } from '@angular/material/divider'; // NEW: Import MatDividerModule
import { MatIconModule } from '@angular/material/icon'; // NEW: Import MatIconModule

@Component({
  selector: 'app-crea-piatto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatTooltipModule, // Add MatTooltipModule to imports
    CurrencyPipe, // Add CurrencyPipe to imports for formatting price
    MatDividerModule, // NEW: Add MatDividerModule
    MatIconModule // NEW: Add MatIconModule
  ],
  template: `
    <div class="crea-piatto-container">
      <h2>Crea Nuovo Piatto</h2>
      <form (ngSubmit)="onSubmit()">
        <mat-form-field appearance="fill">
          <mat-label>Nome Piatto</mat-label>
          <input matInput [(ngModel)]="piatto.nome" name="nome" required maxlength="100">
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Prezzo</mat-label>
          <input matInput type="number" [(ngModel)]="piatto.prezzo" name="prezzo" required min="0.01" step="0.01">
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Descrizione</mat-label>
          <textarea matInput [(ngModel)]="piatto.descrizione" name="descrizione" maxlength="500"></textarea>
        </mat-form-field>

        <button mat-raised-button color="primary" type="submit">Crea Piatto</button>
      </form>

      <mat-divider></mat-divider>

      <h2>Piatti Esistenti</h2>
      <div class="dish-list-container">
        <div *ngIf="allDishes.length === 0" class="no-dishes-message">
          Nessun piatto trovato.
        </div>
        <div *ngFor="let dish of allDishes" class="dish-item"
             [matTooltip]="dish.descrizione ? dish.descrizione : 'Nessuna descrizione disponibile'"
             matTooltipPosition="above">
          <div class="dish-info">
            <span class="dish-name">{{ dish.nome }}</span>
            <span class="dish-price">{{ dish.prezzo | currency:'EUR':'symbol':'1.2-2' }}</span>
          </div>
          <button mat-mini-fab color="warn" (click)="deleteDish(dish.id_piatto)">
            <mat-icon>delete</mat-icon> </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .crea-piatto-container {
      padding: 20px;
      max-width: 600px; /* Increased max-width for better layout */
      margin: 20px auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      background-color: #fff;
    }

    h2 {
      text-align: center;
      color: #3f51b5; /* Angular Material primary color */
      margin-bottom: 25px;
      margin-top: 30px; /* Added margin for separation */
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    mat-form-field {
      width: 100%;
    }

    button[type="submit"] {
      margin-top: 20px;
      width: 100%;
    }

    mat-divider {
      margin: 30px 0;
    }

    .dish-list-container {
      margin-top: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      background-color: #f9f9f9;
      max-height: 400px; /* Limit height and enable scrolling */
      overflow-y: auto;
    }

    .no-dishes-message {
      text-align: center;
      color: #757575;
      padding: 20px;
      font-style: italic;
    }

    .dish-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      margin-bottom: 8px;
      background-color: #ffffff;
      border: 1px solid #ddd;
      border-radius: 5px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease-in-out;
    }

    .dish-item:hover {
      background-color: #e8eaf6; /* Light blue on hover */
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .dish-info {
      flex-grow: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-right: 15px; /* Space before the delete button */
    }

    .dish-name {
      font-weight: 500;
      color: #424242;
      flex-basis: 70%; /* Give more space to name */
    }

    .dish-price {
      font-weight: 600;
      color: #3f51b5; /* Primary color for price */
      text-align: right;
      flex-basis: 30%; /* Space for price */
    }

    button.mat-mini-fab {
      min-width: 30px; /* Smaller button */
      width: 30px;
      height: 30px;
      line-height: 30px;
    }

    mat-icon {
      font-size: 18px; /* Smaller icon */
      width: 18px;
      height: 18px;
      line-height: 18px;
    }
  `]
})
export class CreaPiattoComponent implements OnInit {
  piatto = {
    nome: '',
    prezzo: 0,
    descrizione: ''
  };

  allDishes: any[] = []; // New property to hold all dishes

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllDishes(); // Load dishes when the component initializes
  }

  // --- NEW: Method to load all dishes ---
  loadAllDishes(): void {
    this.adminService.getPiatti().subscribe({
      next: (data) => {
        this.allDishes = data;
      },
      error: (err) => {
        console.error('Errore durante il caricamento dei piatti:', err);
        this.snackBar.open('Impossibile caricare i piatti esistenti.', 'Chiudi', { duration: 3000 });
      }
    });
  }

  // --- NEW: Method to delete a dish ---
  deleteDish(piattoId: number): void {
    if (confirm('Sei sicuro di voler eliminare questo piatto?')) { // Using confirm for simplicity, consider a custom modal in production
      this.adminService.deletePiatto(piattoId).subscribe({
        next: () => {
          this.snackBar.open('Piatto eliminato con successo!', 'Chiudi', { duration: 3000 });
          this.loadAllDishes(); // Reload the list after deletion
        },
        error: (err) => {
          console.error('Errore durante l\'eliminazione del piatto:', err);
          this.snackBar.open('Si è verificato un errore durante l\'eliminazione del piatto.', 'Chiudi', { duration: 3000 });
        }
      });
    }
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.adminService.creaPiatto(this.piatto).subscribe({
        next: () => {
          this.snackBar.open('Piatto creato con successo!', 'Chiudi', { duration: 3000 });
          this.piatto = { nome: '', prezzo: 0, descrizione: '' }; // Clear form
          this.loadAllDishes(); // Reload dishes after creating a new one
        },
        error: (err) => {
          console.error('Errore durante la creazione del piatto:', err);
          this.snackBar.open('Si è verificato un errore durante la creazione del piatto', 'Chiudi', { duration: 3000 });
        }
      });
    }
  }

  private isFormValid(): boolean {
    if (!this.piatto.nome || this.piatto.nome.trim().length === 0 || this.piatto.nome.length > 100) {
      this.snackBar.open('Il nome è obbligatorio (max 100 caratteri) e non può essere vuoto.', 'Chiudi', { duration: 3000 });
      return false;
    }

    if (this.piatto.prezzo === null || this.piatto.prezzo === undefined || this.piatto.prezzo <= 0) {
      this.snackBar.open('Il prezzo è obbligatorio e deve essere un numero positivo.', 'Chiudi', { duration: 3000 });
      return false;
    }

    if (this.piatto.descrizione && this.piatto.descrizione.length > 500) {
      this.snackBar.open('La descrizione non può superare i 500 caratteri', 'Chiudi', { duration: 3000 });
      return false;
    }

    return true;
  }
}
