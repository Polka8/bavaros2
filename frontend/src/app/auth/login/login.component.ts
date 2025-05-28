import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    RouterLink
  ],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form-container">
      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email">
        <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
          Campo obbligatorio
        </mat-error>
        <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
          Formato email non valido
</mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Password</mat-label>
        <input matInput formControlName="password" type="password">
        <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
          Campo obbligatorio
        </mat-error>
      </mat-form-field>

      <button 
        mat-raised-button 
        color="primary" 
        type="submit"
        [disabled]="loading">
        {{ loading ? 'Accesso in corso...' : 'Accedi' }}
      </button>

      <div class="message-container">
        @if (errorMessage()) {
          <div class="error-message">{{ errorMessage() }}</div>
        }
      </div>

      <a routerLink="/register" class="register-link">Non hai un account? Registrati</a>
    </form>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  loading = false;
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      const formValues = this.loginForm.getRawValue();
  
      this.authService.login({
        email: formValues.email!,
        password: formValues.password!
      }).subscribe({
        next: () => {
          this.errorMessage.set('');
          const redirectUrl = this.authService.getRedirectUrl() || '/';
          this.router.navigate([redirectUrl]);
        },
        error: (err) => {
          const msg = err.error && err.error.message ? err.error.message : 'Credenziali non valide';
          this.errorMessage.set(msg);
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
