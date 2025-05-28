import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../shared/services/admin.service';

@Component({
  selector: 'app-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="newsletter-container">
 <!-- Barra di navigazione -->
 <div class="tabs">
   <button (click)="setSection('unread')">Da leggere</button>
   <button (click)="setSection('read')">Lette</button>
 </div>

 <!-- Sezione corrente per le notifiche non lette -->
 <div *ngIf="activeSection === 'unread'" class="notifications-section">
   <h3>Notifiche da leggere</h3>
   <button class="mark-all" (click)="markAllAsRead()">Segna tutto come letto</button>
   
   <div *ngFor="let notifica of unreadNotifications" class="notifica-item">
     <strong>{{ notifica.tipo }}</strong> - {{ notifica.messaggio }}<br>
     <small>{{ notifica.data | date:'medium' }}</small>
     <button (click)="markAsRead(notifica.id_notifica)">Segna come letto</button>
   </div>
 </div>

 <!-- Sezione corrente per le notifiche lette -->
 <div *ngIf="activeSection === 'read'" class="notifications-section">
   <h3>Notifiche lette</h3>
   <div class="filters">
     <div class="date-filter">
       <input type="date" [(ngModel)]="filterDate" (change)="applyDateFilter()">
       <button class="clear" (click)="clearDateFilter()">×</button>
     </div>
     <select [(ngModel)]="sortOrder" (change)="applySort()">
       <option value="recent">Più recenti</option>
       <option value="oldest">Più vecchie</option>
     </select>
   </div>
   
   <!-- Elenco delle notifiche lette -->
   <div *ngFor="let notifica of readNotifications" class="notifica-item">
     <strong>{{ notifica.tipo }}</strong> - {{ notifica.messaggio }}<br>
     <small>{{ notifica.data | date:'medium' }}</small>
   </div>
 </div>
</div>

 `,
 styles: [`
    .newsletter-container {
  padding: 20px;
  max-width: 800px;
  margin: auto;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.tabs {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 15px;
  cursor: pointer;
  background: rgb(28, 21, 18);
  color: white;
  border: none;
  border-radius: 5px;
  transition: background 0.3s;
}

.tabs button:hover {
  background: rgb(28, 21, 18);
}

.notifications-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

h3 {
  margin-bottom: 15px;
  font-size: 1.5em;
  color: #333;
}
.clear {
width: 20px;
height: 20px;
padding: 5px;
 }

.notifica-item {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  transition: background 0.3s;
}

.notifica-item:hover {
  background: #f1f1f1;
}

.mark-all {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.mark-all:hover {
  background: #218838;
}

.filters {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
}

.date-filter {
  position: relative;
  display: flex;
  align-items: center;
}

.date-filter button {
  margin-left: 5px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 5px;
  transition: background 0.3s;
}

.date-filter button:hover {
  background: #c82333;
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
 `]
})
export class NewsletterComponent implements OnInit {
  activeSection: 'unread' | 'read' = 'unread';
  allNotifications: any[] = [];
  unreadNotifications: any[] = [];
  readNotifications: any[] = [];
  filterDate: string = '';
  sortOrder: 'recent' | 'oldest' = 'recent';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadNotifiche();
  }

  loadNotifiche(): void {
    this.adminService.getNotifiche().subscribe({
      next: (data: any[]) => {
        this.allNotifications = data;
        this.filterNotifications();
      },
      error: (err) => console.error('Errore caricamento notifiche:', err)
    });
  }

  setSection(section: 'unread' | 'read'): void {
    this.activeSection = section;
    this.filterNotifications();
  }

  filterNotifications(): void {
    this.unreadNotifications = this.allNotifications
      .filter(n => !n.letto)
      .sort(this.getSortFunction());

    this.readNotifications = this.allNotifications
      .filter(n => n.letto)
      .sort(this.getSortFunction());
  }

  getSortFunction(): (a: any, b: any) => number {
    return this.sortOrder === 'recent' 
      ? (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      : (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime();
  }

  markAsRead(notificaId: number): void {
    this.adminService.markNotificaAsRead(notificaId).subscribe({
      next: () => {
        const index = this.allNotifications.findIndex(n => n.id_notifica === notificaId);
        if (index !== -1) {
          this.allNotifications[index].letto = true;
          this.filterNotifications();
        }
      },
      error: (err) => console.error('Errore:', err)
    });
  }

  markAllAsRead(): void {
    this.adminService.markAllAsRead().subscribe({
      next: () => {
        this.allNotifications.forEach(n => n.letto = true);
        this.filterNotifications();
      },
      error: (err) => console.error('Errore:', err)
    });
  }

  applyDateFilter() {
    this.applyFilters();
}

private applyFilters() {
    let filtered = [...this.readNotifications];
    if (this.filterDate) {
        const filterDateObj = new Date(this.filterDate);
        filtered = filtered.filter(n => {
            const notifDate = new Date(n.data);
            return notifDate.toDateString() === filterDateObj.toDateString();
        });
    }
    // Ordinamento...
    this.readNotifications = filtered;
}


  clearDateFilter(): void {
    this.filterDate = '';
    this.filterNotifications();
  }
  applySort(): void {
    this.filterNotifications();
  }
}