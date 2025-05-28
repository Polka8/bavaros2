import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterModule // Aggiungi questa importazione
  ],
  template: `
    <mat-toolbar color="primary">
      <!-- Modifica tutti i link con routerLink -->
      <a mat-button routerLink="/home">
        <mat-icon>home</mat-icon>
        Home
      </a>

      <span class="spacer"></span>

      <ng-container *ngIf="authService.isLoggedIn(); else notLoggedIn">
        <button mat-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
          {{ userName }}
        </button>
        <mat-menu #userMenu="matMenu">
          <a mat-menu-item routerLink="/profilo">
            <mat-icon>person</mat-icon>
            Profilo
          </a>
          <a mat-menu-item routerLink="/prenota">
            <mat-icon>restaurant</mat-icon>
            Prenota
          </a>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </mat-menu>

        <ng-container *ngIf="authService.isAdmin()">
          <button mat-button [matMenuTriggerFor]="adminMenu">
            <mat-icon>admin_panel_settings</mat-icon>
            Admin
          </button>
          <mat-menu #adminMenu="matMenu">
            <a mat-menu-item routerLink="/admin/calendario">
              <mat-icon>calendar_today</mat-icon>
              Calendario
            </a>
            <a mat-menu-item routerLink="/admin/crea-piatto">
              <mat-icon>fastfood</mat-icon>
              crea Piatto
            </a>
            <a mat-menu-item routerLink="/admin/gestione-menu">
              <mat-icon>restaurant_menu</mat-icon>
              Gestione Menu
            </a>
            <a mat-menu-item routerLink="/admin/newsletter">
              <mat-icon>campaign</mat-icon>
              Newsletter
            </a>
          </mat-menu>
        </ng-container>
      </ng-container>

      <ng-template #notLoggedIn>
        <a mat-button routerLink="/login">
          <mat-icon>login</mat-icon>
          Login
        </a>
        <a mat-button routerLink="/register">
          <mat-icon>person_add</mat-icon>
          Registrati
        </a>
      </ng-template>
    </mat-toolbar>
  `,
  styles: [`
    .spacer { flex: 1 1 auto; }
    mat-toolbar {
      position: fixed;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    button { margin: 0 5px; }
  `]
})
export class NavbarComponent {
  userName: string = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.authService.getCurrentUser().subscribe(user => {
      this.userName = user ? `${user.nome} ${user.cognome}` : '';
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}