// prenotazioni.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError, take, map } from 'rxjs';
import { environment } from '../../environment/environment.component';
import { formatISO, isSameDay,parseISO } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {
  private apiUrl = environment.apiUrl;  // ad esempio: http://localhost:3000/api
  
  constructor(private http: HttpClient) {}
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Si è verificato un errore!';
    
    if (error.error instanceof ErrorEvent) {
      // Errore lato client
      errorMessage = `Errore: ${error.error.message}`;
    } else {
      // Errore lato server
      errorMessage = `Codice errore: ${error.status}\nMessaggio: ${error.message}`;
      
      // Gestione specifica per diversi status code
      switch (error.status) {
        case 0:
          errorMessage = 'Connessione al server non riuscita';
          break;
        case 401:
          errorMessage = 'Non autorizzato - Effettua il login';
          break;
        case 403:
          errorMessage = 'Accesso negato - Permessi insufficienti';
          break;
        case 404:
          errorMessage = 'Risorsa non trovata';
          break;
        case 500:
          errorMessage = 'Errore interno del server';
          break;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
  
  // Funzione per creare gli headers con il token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Prenotazione "solo posti"
  effettuaPrenotazione(prenotazione: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/prenotazioni`, prenotazione, { headers });
  }

  // Prenotazione con menu
  effettuaPrenotazioneConMenu(prenotazione: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/prenotazioni/menu`, prenotazione, { headers });
  }

  // Recupera lo storico delle prenotazioni dell'utente
  getPrenotazioniStorico(userId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/prenotazioni/storico/${userId}`, { headers });
  }

  // (Opzionale) Cancella una prenotazione attiva (devi aver implementato l'endpoint nel backend)
  cancelPrenotazione(prenotazioneId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/prenotazioni/${prenotazioneId}`, { headers });
  }
  
  getPrenotazioniCalendario(params: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
  
    return this.http.get(`${this.apiUrl}/calendario`, {
      params,
      headers
    }).pipe(
      catchError(this.handleError)
    );
  }
  getPostiRimanenti(dataPrenotata: string): Observable<number> {
    const headers = this.getAuthHeaders();
    return this.http.get<number>(`${this.apiUrl}/posti-rimanenti`, {
      headers,
      params: { data: dataPrenotata }
    }).pipe(
      catchError(() => {
        // Check if date is blocked
        const date = new Date(dataPrenotata);
        return this.getBlockedDays().pipe(
          take(1),
          map((days: Date[]) => days.some((d: Date) => isSameDay(d, date)) ? 0 : 0)
        );
      })
    );
  }

  getPrenotazioniAttive(params?: { 
    anno?: number, 
    mese?: number,
    start_date?: string,
    end_date?: string,
    giorno?: string
  }): Observable<any> {
    const headers = this.getAuthHeaders();
    let httpParams = new HttpParams();
  
    if (params?.anno && params?.mese) {
      httpParams = httpParams.append('anno', params.anno.toString());
      httpParams = httpParams.append('mese', params.mese.toString());
    }
    
    if (params?.start_date && params?.end_date) {
      httpParams = httpParams.append('start_date', params.start_date);
      httpParams = httpParams.append('end_date', params.end_date);
    }
    
    if (params?.giorno) {
      httpParams = httpParams.append('giorno', params.giorno);
    }
  
    return this.http.get(`${this.apiUrl}/prenotazioni/calendario`, {
      headers,
      params: httpParams
    }).pipe(
      catchError(this.handleError)
    );
  }
  // prenotazioni.service.ts
  blockDay(date: Date): Observable<any> {
    const formattedDate = formatISO(date, { representation: 'date' });
    return this.http.post(`${this.apiUrl}/block-day`, { date: formattedDate }, 
      { headers: this.getAuthHeaders() });
  }
  
  // Modifica il metodo getBlockedDays()
getBlockedDays(): Observable<Date[]> {
  // Aggiungi gli headers di autenticazione
  return this.http.get<string[]>(`${this.apiUrl}/blocked-days`, {
    headers: this.getAuthHeaders() // ✅ Aggiunto
  }).pipe(
    map(dates => dates.map(dateString => parseISO(dateString)))
  );
}
  // Aggiungi metodo per sbloccare
// prenotazioni.service.ts
// prenotazioni.service.ts
unblockDay(date: Date): Observable<any> {
  const formattedDate = formatISO(date, { representation: 'date' });
  return this.http.delete(`${this.apiUrl}/blocked-days/${formattedDate}`, 
    { headers: this.getAuthHeaders() });
}
}