import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
    MatIconModule
  ],
  template: `
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="form-container">
      <mat-form-field>
        <mat-label>Nome</mat-label>
        <input matInput formControlName="nome">
        <mat-error *ngIf="registerForm.get('nome')?.hasError('required')">
          Campo obbligatorio
        </mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Cognome</mat-label>
        <input matInput formControlName="cognome">
        <mat-error *ngIf="registerForm.get('cognome')?.hasError('required')">
          Campo obbligatorio
        </mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Email</mat-label>
        <input 
          matInput 
          formControlName="email"
          (blur)="updateEmailError()"
          type="email">
        <mat-error *ngIf="errorMessage()">
          {{ errorMessage() }}
        </mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Password</mat-label>
        <input 
          matInput 
          [type]="hidePassword ? 'password' : 'text'" 
          formControlName="password">
        <button mat-icon-button matSuffix (click)="togglePasswordVisibility()">
          <mat-icon>{{ hidePassword ? 'visibility' : 'visibility_off' }}</mat-icon>
        </button>
        <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
          Campo obbligatorio
        </mat-error>
        <mat-error *ngIf="registerForm.get('password')?.hasError('pattern')">
          La password deve contenere almeno una maiuscola, una minuscola e un carattere speciale().
        </mat-error>
      </mat-form-field>

      <button 
        mat-raised-button 
        color="primary" 
        type="submit"
        [disabled]="loading">
        {{ loading ? 'Registrazione in corso...' : 'Registrati' }}
      </button>

      <div class="message-container">
        <div *ngIf="successMessage">{{ successMessage }}</div>
        <div *ngIf="errorMessage()">{{ errorMessage() }}</div>
      </div>

      <a routerLink="/login" class="login-link">Hai già un account? Accedi</a>
    </form>
  `,
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm = new FormGroup({
    nome: new FormControl('', [Validators.required]),
    cognome: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>?]).{8,}$/)

    ])
  });

  loading = false;
  successMessage = '';
  errorMessage = signal('');
  hidePassword = true; // Aggiungi questa proprietà

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword; // Cambia la visibilità della password
  }

  updateEmailError() {
    const emailControl = this.registerForm.get('email');
    
    if (emailControl?.hasError('required')) {
      this.errorMessage.set('Campo obbligatorio');
    } else if (emailControl?.hasError('email')) {
      this.errorMessage.set('Formato email non valido');
    } else {
      this.errorMessage.set('');
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      const formValues = this.registerForm.getRawValue();
  
      this.authService.register({
        nome: formValues.nome,
        cognome: formValues.cognome,
        email: formValues.email,
        password: formValues.password
      }).subscribe({
        next: () => {
          this.successMessage = 'Registrazione completata!';
          this.errorMessage.set('');
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          const msg = err.error && err.error.message ? err.error.message : 'Errore durante la registrazione';
          this.errorMessage.set(msg);
          this.successMessage = '';
          setTimeout(() => {
            this.loading = false;
          }, 1500);
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
}
