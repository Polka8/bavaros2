import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../shared/services/auth.service';
import { MenuService } from '../shared/services/menu.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatToolbarModule,
    MatSnackBarModule
  ],
  template: `
    <main>
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <h1>{{ isAdmin ? 'Benvenuto capo' : 'Benvenuti in Bavaros' }}</h1>
        </div>
      </section>

      <!-- Sezione Menù -->
      <section class="menu-section">
        <h2>I nostri menù</h2>
        <div class="menu-carousel">
          <button mat-icon-button class="nav-arrow prev" (click)="prevMenu()" [disabled]="currentMenuIndex === 0">
            <mat-icon>chevron_left</mat-icon>
          </button>
          
          <div class="menu-cards">
            <div class="menu-card-wrapper" *ngFor="let menu of visibleMenus; let i = index">
              <mat-card class="menu-card" [class.active]="i === currentMenuIndex">
                <mat-card-header>
                  <mat-card-title>{{ menu.titolo }}</mat-card-title>
                </mat-card-header>
                <mat-card-content class="menu-card-content">
                  <div *ngFor="let sezione of menu.sezioni" class="menu-section-card">
                    <h3>{{ sezione.nome_sezione }}</h3>
                    <ul>
                      <li *ngFor="let piatto of sezione.piatti">
                        {{ piatto.nome }} - {{ piatto.prezzo | currency }}
                      </li>
                      <li *ngIf="sezione.piatti.length === 0" class="empty-section">
                        Sezione in aggiornamento
                      </li>
                    </ul>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <button mat-icon-button class="nav-arrow next" (click)="nextMenu()" [disabled]="currentMenuIndex >= menus.length - visibleMenusCount">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </section>

      <!-- Sezione Recensioni -->
      <section class="features-grid">
        <div class="feature-card" *ngFor="let feature of features">
          <img [src]="feature.image" class="review-logo" alt="{{ feature.title }}">
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </section>


      <!-- Call to Action -->
      <section class="cta-section">
        <h2>Pronto a iniziare?</h2>
        <button mat-stroked-button color="accent" (click)="navigateToRegistration()">
          effettua la tua prenotazione
        </button>
      </section>
    </main>
  `,
  styles: [`
    /* Hero Section */
    .review-logo {
        width: 100px; /* Imposta la larghezza desiderata */
        height: 100px; /* Imposta l'altezza desiderata */
        object-fit: contain; /* Mantiene le proporzioni dell'immagine */
        margin-bottom: 1rem; /* Aggiunge spazio tra l'icona e il testo */
        display: block; /* Assicura che l'immagine sia trattata come un blocco */
        margin: 0 auto 1rem; /* Centra l'icona orizzontalmente */
      }
    .hero-section {
  min-height: 60vh;
  padding: 2rem 1rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.hero-content h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
}

    /* Menu Section */
    .menu-section {
      padding: 4rem 5%;
      background: white;
    }

    .menu-carousel {
      position: relative;
      padding: 0 2rem;
    }
      .features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 4rem 5%;
}

.feature-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}


    .menu-cards {
      display: flex;
      gap: 2rem;
      overflow-x: auto;
      scroll-behavior: smooth;
      scroll-snap-type: x mandatory;
      padding: 1rem 0;
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }

    .menu-cards::-webkit-scrollbar {
      display: none; /* Hide scrollbar for Chrome, Safari and Opera */
    }

    .menu-card-wrapper {
      scroll-snap-align: start;
      flex: 0 0 calc(33% - 1rem);
      min-width: 400px;
    }

.cta-section {
  padding: 4rem 5%;
  text-align: center;
  background-color: #f5f5f5;
}
.cta-section h2 {
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  margin-bottom: 2rem;
}



    .menu-card {
      height: 500px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      overflow: hidden;
    }

    .menu-card-content {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .menu-section-card {
      background: #f8f8f8;
      border-radius: 8px;
      padding: 1rem;
      min-height: 120px;
    }

    .empty-section {
      color: #666;
      font-style: italic;
      padding: 0.5rem 0;
    }

    /* Navigation Arrows */
    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      width: 40px;
      height: 40px;
      background: rgba(158, 28, 28, 0.9);
      color: white;
      border-radius: 50%;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-arrow.prev {
      left: -20px;
    }

    .nav-arrow.next {
      right: -20px;
    }
      @media (max-width: 480px) {
  .hero-content h1,
  .cta-section h2 {
    font-size: 1.5rem;
  }

  .menu-card-wrapper {
    min-width: 280px;
  }

  .menu-card {
    height: 350px;
  }
}


    .nav-arrow:hover:not([disabled]) {
      transform: translateY(-50%) scale(1.1);
      background: rgba(158, 28, 28, 1);
    }

    .nav-arrow[disabled] {
      opacity: 0.3;
      cursor: not-allowed;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .menu-card-wrapper {
        flex: 0 0 calc(100% - 1rem);
        min-width: 300px;
      }

      .menu-card {
        height: 400px;
      }

      .nav-arrow {
        width: 30px;
        height: 30px;
      }

      .nav-arrow.prev {
        left: -10px;
      }

      .nav-arrow.next {
        right: -10px;
      }
      
    }
  `]
})
export class HomeComponent {
  userName: string | null = null;
  isAdmin: boolean = false;
  menus: any[] = [];
  currentMenuIndex = 0;
  visibleMenusCount = 2;
  features = [
    { icon: 'google', title: 'Google Reviews', image: 'assets/google.png', description: '★★★★★ "Il miglior servizio che abbia mai provato!"' },
    { icon: 'tripadvisor', title: 'TripAdvisor', image: 'assets/tripadvisor.png', description: '★★★★★ "Esperienza incredibile, assolutamente da provare!"' },
    { icon: 'yelp', title: 'Yelp', image: 'assets/yelp.png', description: '★★★★★ "Servizio eccellente e qualità superiore!"' }
  ];

  constructor(
    private menuService: MenuService,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

 ngOnInit() {
  this.loadMenus();
  this.updateUserName();
  this.updateVisibleMenus();
  window.addEventListener('resize', this.updateVisibleMenus.bind(this));
}
ngOnDestroy() {
  window.removeEventListener('resize', this.updateVisibleMenus.bind(this));
}


  loadMenus(): void {
    this.menuService.getPublicMenus().subscribe({
      next: (menus) => {
        this.menus = menus;
        this.updateVisibleMenus();
      },
      error: (err) => console.error('Errore nel caricamento dei menù', err)
    });
  }
  

  updateUserName() {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getUserInfo();
      if (user) {
        this.userName = `${user.nome} ${user.cognome}`;
        this.isAdmin = (user.ruolo === 'admin');  
      }
    }
  }

  logout() {
    this.authService.logout();
    this.userName = null;
    this.isAdmin = false;
    this.router.navigateByUrl('/login');
  }

  navigateToPrenota() {
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Devi effettuare il login per prenotare!', 'Chiudi', {
        duration: 3000
      });
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/prenota']);
    }
  }

  navigateToRegistration() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/register']);
    } else {
      this.router.navigate(['/prenota']);
    }
  }
  get visibleMenus(): any[] {
    return this.menus.slice(this.currentMenuIndex, this.currentMenuIndex + this.visibleMenusCount);
  }

  nextMenu(): void {
    if (this.currentMenuIndex < this.menus.length - this.visibleMenusCount) {
      this.currentMenuIndex++;
    }
  }

  prevMenu(): void {
    if (this.currentMenuIndex > 0) {
      this.currentMenuIndex--;
    }
  }

  private updateVisibleMenus(): void {
    const screenWidth = window.innerWidth;
    this.visibleMenusCount = screenWidth < 768 ? 1 : 2;
  }
}

