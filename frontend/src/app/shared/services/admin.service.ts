import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment.component'; // Importa l'environment

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl; // Definisci l'URL dell'API

  constructor(private http: HttpClient) {}

  getNotifiche(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/notifiche`, { headers });
  }

  markNotificaAsRead(notificaId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/notifiche/${notificaId}/letto`, {}, { headers });
  }
  markAllAsRead(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/notifiche/mark-all-read`, {}, { headers });
  }

  getNotificheWithFilters(filters: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/notifiche`, { headers, params: filters });
  }
  creaPiatto(piatto: any) {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/piatti`, piatto,{ headers, params: piatto });
  }
  getPiatti(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/piatti`, { headers });
  }

  
  deletePiatto(piattoId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/piatti/${piattoId}`, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}