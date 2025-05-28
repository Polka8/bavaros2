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
        @if (registerForm.get('nome')?.hasError('required')) {
          <mat-error>Campo obbligatorio</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Cognome</mat-label>
        <input matInput formControlName="cognome">
        @if (registerForm.get('cognome')?.hasError('required')) {
          <mat-error>Campo obbligatorio</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Email</mat-label>
        <input 
          matInput 
          formControlName="email"
          (blur)="updateEmailError()"
          type="email">
        @if (errorMessage()) {
          <mat-error>{{ errorMessage() }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Password</mat-label>
        <input 
          matInput 
          formControlName="password" 
          type="password">
        @if (registerForm.get('password')?.errors) {
          <mat-error>
            Minimo 8 caratteri con lettere e numeri
          </mat-error>
        }
      </mat-form-field>

      <button 
        mat-raised-button 
        color="primary" 
        type="submit"
        [disabled]="loading">
        {{ loading ? 'Registrazione in corso...' : 'Registrati' }}
      </button>

      <div class="message-container">
        @if (successMessage) {
          <div class="success-message">{{ successMessage }}</div>
        }
        @if (errorMessage()) {
          <div class="error-message">{{ errorMessage() }}</div>
        }
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
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
    ])
  });

  loading = false;
  successMessage = '';
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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
          // Se il backend restituisce error.error.message, lo visualizziamo
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
