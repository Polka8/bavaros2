from flask import jsonify, request # type: ignore
from .models import (
    BlockedDay, Notifica, db, User, RuoloEnum, Prenotazione,
    DettagliPrenotazione, Piatto, Menu, MenuSezione, MenuSezioneRel, MenuItem
)
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity # type: ignore
from datetime import timedelta, datetime
import os
import re
import json
from flask_cors import CORS  # type: ignore # gestione centralizzata del CORS
from app import mail
from flask_mail import Message

def init_routes(app):
    # Abilita CORS per tutti gli endpoint /api/*, specificando l'origine consentita
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:4200"}})

    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"message": "Dati mancanti"}), 400

        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, data['email']):
            return jsonify({"message": "Formato email non valido"}), 400

        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({"message": "Attenzione, utente già registrato"}), 409

        try:
            new_user = User(
                email=data['email'],
                nome=data.get('nome', ''),
                cognome=data.get('cognome', ''),
                ruolo=RuoloEnum.cliente
            )
            new_user.set_password(data['password'])
            db.session.add(new_user)
            db.session.commit()

            access_token = create_access_token(identity=str(new_user.id), expires_delta=timedelta(days=1))
            return jsonify({
                "message": "Registrazione completata",
                "token": access_token,
                "user": {
                    "id": new_user.id,
                    "nome": new_user.nome,
                    "cognome": new_user.cognome,
                    "email": new_user.email,
                    "ruolo": new_user.ruolo.value,
                    "creato_il": new_user.creato_il.isoformat()
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Errore server: {str(e)}"}), 500
    @app.route('/api/login', methods=['POST'])
    def login():
            data = request.get_json()
            if not data or 'email' not in data or 'password' not in data:
                return jsonify({"message": "Dati mancanti"}), 400
            user = User.query.filter_by(email=data['email']).first()
            if not user:
                return jsonify({"message": "Utente non trovato"}), 404
            if not user.check_password(data['password']):
                return jsonify({"message": "Password errata"}), 401
            # Imposta il ruolo dell'utente in base a quello presente nel database
            if user.ruolo == RuoloEnum.admin:
                print("Ruolo impostato a admin")
            else:
                print("Ruolo impostato a cliente")
                access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=1))
            try:
                    db.session.commit()
            except Exception as e:
                    db.session.rollback()
                    return jsonify({"message": f"Errore di aggiornamento ruolo: {str(e)}"}), 500

            access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=1))
            return jsonify({
                    "message": "Login riuscito",
                    "token": access_token,
                    "user": {
                        "id": user.id,
                        "nome": user.nome,
                        "cognome": user.cognome,
                        "ruolo": user.ruolo.value,
                        "email": user.email,
                        "creato_il": user.creato_il.isoformat()
                    }
                }), 200

    @app.route('/api/profilo', methods=['GET'])
    @jwt_required()
    def get_profile():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "Utente non trovato"}), 404

        return jsonify({
            "id": user.id,
            "email": user.email,
            "nome": user.nome,
            "cognome": user.cognome,
            "ruolo": user.ruolo.value,
            "creato_il": user.creato_il.isoformat()
        }), 200

    @app.route('/api/prenotazioni', methods=['POST', 'OPTIONS'])
    @jwt_required()
    def crea_prenotazione():
        if request.method == 'OPTIONS':
            response = jsonify({})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
            response.headers.add('Access-Control-Allow-Methods', 'DELETE, GET, POST, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            return response, 200
         
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()
        if not data:
            return jsonify({"message": "Nessun dato inviato"}), 400

        # Validazione e conversione della data
        try:
            data_prenotata = datetime.fromisoformat(data['data_prenotata'])
        except Exception:
            return jsonify({"message": "Formato data non valido"}), 400

        # Controlla se il giorno è bloccato
        blocked = BlockedDay.query.filter_by(blocked_date=data_prenotata.date()).first()
        if blocked:
            return jsonify({"message": "Giorno bloccato per le prenotazioni"}), 403

        if data_prenotata < datetime.utcnow():
            return jsonify({"message": "La data/ora prenotata non può essere antecedente all'ora attuale"}), 400

        # Validazione numero di posti
        try:
            num_posti = int(data.get('numero_posti', 0))
            if num_posti < 1:
                return jsonify({"message": "Il numero di posti deve essere almeno 1"}), 400
        except Exception:
            return jsonify({"message": "Numero di posti non valido"}), 400

        # Controllo della capienza giornaliera
        posti_giornata = db.session.query(
            db.func.sum(Prenotazione.numero_posti)
        ).filter(
            db.func.DATE(Prenotazione.data_prenotata) == data_prenotata.date(),
            Prenotazione.stato == "attiva"
        ).scalar() or 0

        if posti_giornata + num_posti > 100:
            return jsonify({"message": "Superato il numero massimo di posti disponibili per questa data"}), 400

        try:
            nuova_prenotazione = Prenotazione(
                data_prenotata=data_prenotata,
                stato="attiva",
                id_utente=user_id,
                data_creazione=datetime.utcnow(),
                note_aggiuntive=data.get('note_aggiuntive', ''),
                numero_posti=num_posti
            )
            db.session.add(nuova_prenotazione)
            db.session.commit()

            notifica = Notifica(
                tipo="nuova_prenotazione",
                messaggio=f"Nuova prenotazione da {user.nome} {user.cognome} per {num_posti} posti il {data_prenotata}",
                id_prenotazione=nuova_prenotazione.id_prenotazione
            )
            db.session.add(notifica)
            db.session.commit()
            try:
                admin_email = os.getenv("ADMIN_EMAIL") 
                msg = Message(
                    subject="Nuova prenotazione ricevuta",
                    recipients=[admin_email],
                    body=(
                        f"Ciao Admin,\n\n"
                        f"Hai ricevuto una nuova prenotazione da {user.nome} {user.cognome}.\n"
                        f"Data prenotata: {data_prenotata.strftime('%d/%m/%Y %H:%M')}\n"
                        f"Numero posti: {num_posti}\n"
                        f"Note: {data.get('note_aggiuntive', '')}\n\n"
                        f"Saluti,\nIl tuo sistema di prenotazioni."
                    )
                )
                print(f"Invio email a: {admin_email}")
                print("Contenuto:", msg.body)
                mail.send(msg)
                try:
                    msg_cliente = Message(
                        subject="Conferma Prenotazione - Bavaros",
                        recipients=[user.email],
                        body=(
                            f"Ciao {user.nome},\n\n"
                            f"La tua prenotazione è stata confermata!\n\n"
                            f"📅 Data: {data_prenotata.strftime('%d/%m/%Y %H:%M')}\n"
                            f"👥 Numero di posti: {num_posti}\n\n"
                            f"Grazie per aver scelto Bavaros!\n"
                            f"A presto!"
                        )
                    )
                    mail.send(msg_cliente)
                except Exception as e:
                    print(f"Errore nell'invio dell'email al cliente: {str(e)}")
            except Exception as e:
                print(f"Errore nell'invio dell'email: {str(e)}")
                return jsonify({
                            "message": "Prenotazione creata con successo",
                            "prenotazione_id": nuova_prenotazione.id_prenotazione
                        }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Errore server: {str(e)}"}), 500

    @app.route('/api/prenotazioni/menu', methods=['POST'])
    @jwt_required()
    def crea_prenotazione_con_menu():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()
        if not data:
            return jsonify({"message": "Nessun dato inviato"}), 400

        # Validazione della data
        try:
            data_prenotata = datetime.fromisoformat(data['data_prenotata'])
        except Exception:
            return jsonify({"message": "Formato data non valido"}), 400

        # Controlla se il giorno è bloccato
        blocked = BlockedDay.query.filter_by(blocked_date=data_prenotata.date()).first()
        if blocked:
            return jsonify({"message": "Giorno bloccato per le prenotazioni"}), 403

        if data_prenotata < datetime.utcnow():
            return jsonify({"message": "La data/ora prenotata non può essere antecedente all'ora attuale"}), 400

        # Validazione numero di posti
        try:
            num_posti = int(data.get('numero_posti', 0))
            if num_posti < 1:
                return jsonify({"message": "Il numero di posti deve essere almeno 1"}), 400
        except Exception:
            return jsonify({"message": "Numero di posti non valido"}), 400

        # Controllo della capienza giornaliera
        posti_giornata = db.session.query(
            db.func.sum(Prenotazione.numero_posti)
        ).filter(
            db.func.DATE(Prenotazione.data_prenotata) == data_prenotata.date(),
            Prenotazione.stato == "attiva"
        ).scalar() or 0

        if posti_giornata + num_posti > 100:
            return jsonify({"message": "Superato il numero massimo di posti disponibili per questa data"}), 400

        # Validazione dei piatti
        if 'piatti' not in data or not isinstance(data['piatti'], list) or len(data['piatti']) == 0:
            return jsonify({"message": "Nessun piatto selezionato"}), 400

        for item in data['piatti']:
            try:
                if int(item.get('quantita', 0)) < 1:
                    return jsonify({"message": "La quantità per ogni piatto deve essere almeno 1"}), 400
            except Exception:
                return jsonify({"message": "Quantità non valida per un piatto"}), 400

        try:
            prenotazione = Prenotazione(
                data_prenotata=data_prenotata,
                stato="attiva",
                id_utente=user_id,
                data_creazione=datetime.utcnow(),
                note_aggiuntive=data.get('note_aggiuntive', ''),
                numero_posti=num_posti
            )
            db.session.add(prenotazione)
            db.session.flush()  # per ottenere prenotazione.id_prenotazione

            # Inserisci i dettagli dei piatti
            for item in data['piatti']:
                dettaglio = DettagliPrenotazione(
                    fk_prenotazione=prenotazione.id_prenotazione,
                    fk_piatto=item['fk_piatto'],
                    quantita=int(item['quantita'])
                )
                db.session.add(dettaglio)

            # Crea la notifica
            piatti_nomi = [Piatto.query.get(item['fk_piatto']).nome for item in data['piatti']]
            notifica = Notifica(
                tipo="nuova_prenotazione_con_menu",
                messaggio=f"Nuova prenotazione con menù da {user.nome} {user.cognome} per {num_posti} posti il {data_prenotata}. Piatti: {', '.join(piatti_nomi)}",
                id_prenotazione=prenotazione.id_prenotazione
            )
            db.session.add(notifica)
            db.session.commit()

            return jsonify({
                "message": "Prenotazione con menu creata con successo",
                "prenotazione_id": prenotazione.id_prenotazione
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Errore server: {str(e)}"}), 500

    @app.route('/api/prenotazioni/storico/<int:user_id>', methods=['GET'])
    @jwt_required()
    def storico_prenotazioni(user_id):
        prenotazioni = Prenotazione.query.filter_by(id_utente=user_id).all()
        prenotazioni_data = []
        for p in prenotazioni:
            # Recupera i dettagli dei piatti ordinati
            dettagli = DettagliPrenotazione.query.filter_by(fk_prenotazione=p.id_prenotazione).all()
            piatti_ordinati = [
                {
                    "nome": Piatto.query.get(d.fk_piatto).nome,
                    "quantita": d.quantita
                }
                for d in dettagli
            ]
            
            prenotazioni_data.append({
                "id_prenotazione": p.id_prenotazione,
                "data_prenotata": p.data_prenotata.isoformat(),
                "stato": p.stato,
                "data_creazione": p.data_creazione.isoformat(),
                "numero_posti": p.numero_posti,
                "note_aggiuntive": p.note_aggiuntive,
                "piatti": piatti_ordinati  # Aggiungi i piatti ordinati
            })
        return jsonify(prenotazioni_data), 200


    @app.route('/api/menu', methods=['GET'])
    def get_piatti():
        piatti = Piatto.query.all()
        piatti_data = [{
            "id_piatto": p.id_piatto,
            "nome": p.nome,
            "prezzo": p.prezzo,
            "descrizione": p.descrizione
        } for p in piatti]
        return jsonify(piatti_data), 200

    @app.route('/api/menu', methods=['POST'])
    @jwt_required()
    def save_menu():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Accesso negato"}), 403
        data = request.get_json()
        if not data or 'titolo' not in data or 'sezioni' not in data:
            return jsonify({"message": "Dati mancanti per il menù"}), 400
        try:
            nuovo_menu = Menu(titolo=data['titolo'])
            db.session.add(nuovo_menu)
            db.session.flush()  # per ottenere nuovo_menu.id_menu

            sezioni_data = data['sezioni']
            for nome_sezione, items in sezioni_data.items():# per ogni sezione
                sezione = MenuSezione.query.filter_by(nome_sezione=nome_sezione).first()
                if not sezione:
                    sezione = MenuSezione(nome_sezione=nome_sezione)
                    db.session.add(sezione)
                    db.session.flush()

                rel = MenuSezioneRel(id_menu=nuovo_menu.id_menu, id_sezione=sezione.id_sezione)#per la relazione
                db.session.add(rel)
                db.session.flush()

                for item in items:#per ogni piatto nella sezione
                    mi = MenuItem(id_menu_sezione=rel.id_menu_sezione, id_piatto=item['id_piatto'])
                    db.session.add(mi)

            db.session.commit()
            return jsonify({
                "message": "Menù salvato",
                "menu": {
                    "id_menu": nuovo_menu.id_menu,
                    "titolo": nuovo_menu.titolo,
                    "data_creazione": nuovo_menu.data_creazione.isoformat()
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Errore nel salvataggio del menù: {str(e)}"}), 500

    @app.route('/api/menu/public', methods=['GET'])
    def get_public_menus():
        try:
            menus = Menu.query.filter(Menu.is_pubblico == True).all()
            result = []
            for m in menus:
                sezioni_list = []
                for rel in m.sezioni:
                    sezione_obj = MenuSezione.query.get(rel.id_sezione)
                    items = []
                    for mi in rel.items:
                        piatto = Piatto.query.get(mi.id_piatto)
                        items.append({
                            "id_piatto": piatto.id_piatto,
                            "nome": piatto.nome,
                            "prezzo": piatto.prezzo,
                            "descrizione": piatto.descrizione
                        })
                    sezioni_list.append({
                        "nome_sezione": sezione_obj.nome_sezione,
                        "piatti": items
                    })
                result.append({
                    "id_menu": m.id_menu,
                    "titolo": m.titolo,
                    "data_creazione": m.data_creazione.isoformat(),
                    "sezioni": sezioni_list
                })
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"message": f"Errore nel recupero dei menù: {str(e)}"}), 500

    @app.route('/api/menu/saved', methods=['GET'])
    @jwt_required()
    def get_saved_menus():
        try:
            menus = Menu.query.all()
            result = []
            for m in menus:#per ogni menù
                sezioni_list = []
                for rel in m.sezioni:#per ogni sezione del menù
                    sezione_obj = MenuSezione.query.get(rel.id_sezione)
                    items = []
                    for mi in rel.items:#per ogni piatto della sezione
                        piatto = Piatto.query.get(mi.id_piatto)
                        items.append({
                            "id_piatto": piatto.id_piatto,
                            "nome": piatto.nome,
                            "prezzo": piatto.prezzo,
                            "descrizione": piatto.descrizione
                        })
                    sezioni_list.append({
                        "nome_sezione": sezione_obj.nome_sezione,
                        "piatti": items
                    })
                result.append({
                    "id_menu": m.id_menu,
                    "titolo": m.titolo,
                    "data_creazione": m.data_creazione.isoformat(),
                    "sezioni": sezioni_list
                })
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"message": f"Errore nel recupero dei menù: {str(e)}"}), 500

    @app.route('/api/menu/<int:menu_id>', methods=['PUT'])
    @jwt_required()
    def update_menu(menu_id):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Accesso negato"}), 403

        data = request.get_json()
        if not data or 'titolo' not in data or 'sezioni' not in data:
            return jsonify({"message": "Dati mancanti per l'aggiornamento del menù"}), 400

        menu = Menu.query.get(menu_id)
        if not menu:
            return jsonify({"message": "Menù non trovato"}), 404

        try:
            menu.titolo = data['titolo']

            # Elimina le sezioni esistenti e relativi item
            for rel in menu.sezioni:
                for mi in rel.items:
                    db.session.delete(mi)
                db.session.delete(rel)
            db.session.flush()

            sezioni_data = data['sezioni']
            for nome_sezione, items in sezioni_data.items():
                sezione = MenuSezione.query.filter_by(nome_sezione=nome_sezione).first()
                if not sezione:
                    sezione = MenuSezione(nome_sezione=nome_sezione)
                    db.session.add(sezione)
                    db.session.flush()
                rel = MenuSezioneRel(id_menu=menu.id_menu, id_sezione=sezione.id_sezione)
                db.session.add(rel)
                db.session.flush()
                for item in items:
                    mi = MenuItem(id_menu_sezione=rel.id_menu_sezione, id_piatto=item['id_piatto'])
                    db.session.add(mi)

            db.session.commit()
            return jsonify({"message": "Menù aggiornato"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Errore nell'aggiornamento del menù: {str(e)}"}), 500

    @app.route('/api/menu/<int:menu_id>', methods=['DELETE'])
    @jwt_required()
    def delete_menu(menu_id):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Accesso negato"}), 403

        menu = Menu.query.get(menu_id)
        if not menu:
            return jsonify({"message": "Menù non trovato"}), 404

        try:
            for rel in menu.sezioni:
                for mi in rel.items:
                    db.session.delete(mi)
                db.session.delete(rel)
            db.session.delete(menu)
            db.session.commit()
            return jsonify({"message": "Menù eliminato"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Errore nell'eliminazione del menù: {str(e)}"}), 500

    @app.route('/api/prenotazioni/<int:prenotazione_id>', methods=['DELETE', 'OPTIONS'])
    @jwt_required()
    def annulla_prenotazione(prenotazione_id):
        if request.method == 'OPTIONS':
            response = jsonify({})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
            response.headers.add('Access-Control-Allow-Methods', 'DELETE, GET, POST, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            return response, 200

        user_id = int(get_jwt_identity())
        prenotazione = Prenotazione.query.get(prenotazione_id)
        if not prenotazione:
            return jsonify({"message": "Prenotazione non trovata"}), 404

        user = User.query.get(prenotazione.id_utente)
        if prenotazione.id_utente != user_id and user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Non autorizzato"}), 403

        try:
            prenotazione.stato = "annullata"
            prenotazione.data_annullamento = datetime.utcnow()
            notifica = Notifica(
                tipo="annullamento",
                messaggio=f"Prenotazione di {user.nome} {user.cognome} per il {prenotazione.data_prenotata} annullata",
                id_prenotazione=prenotazione.id_prenotazione
            )
            db.session.add(notifica)
            db.session.commit()

            response = jsonify({"message": "Prenotazione annullata"})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
            return response, 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Errore: {str(e)}"}), 500

    @app.route('/api/notifiche', methods=['GET', 'OPTIONS'])
    @jwt_required(optional=True)
    def get_notifiche():
        if request.method == 'OPTIONS':
            response = jsonify({})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
            response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            return response, 200

        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Accesso negato"}), 403

        letto = request.args.get('letto', None)
        if letto is not None:
            try:
                letto = letto.lower() == 'true'
            except ValueError:
                return jsonify({"message": "Parametro 'letto' non valido"}), 400

        query = Notifica.query.order_by(Notifica.data_notifica.desc())
        if letto is not None:
            query = query.filter_by(letto=letto)

        notifiche = query.all()
        notifiche_data = []
        for n in notifiche:
            prenotazione = Prenotazione.query.get(n.id_prenotazione)
            utente = User.query.get(prenotazione.id_utente) if prenotazione else None
            dettagli = DettagliPrenotazione.query.filter_by(fk_prenotazione=n.id_prenotazione).all() if prenotazione else []

            notifiche_data.append({
                "id_notifica": n.id_notifica,
                "tipo": n.tipo,
                "messaggio": n.messaggio,
                "data": n.data_notifica.isoformat(),
                "letto": n.letto,
                "dettagli_prenotazione": {
                    "id": prenotazione.id_prenotazione,
                    "data_prenotata": prenotazione.data_prenotata.isoformat(),
                    "stato": prenotazione.stato,
                    "utente": f"{utente.nome} {utente.cognome}" if utente else "Utente eliminato",
                    "numero_posti": prenotazione.numero_posti,
                    "piatti": [
                        {"nome": Piatto.query.get(d.fk_piatto).nome, "quantita": d.quantita}
                        for d in dettagli
                    ] if dettagli else []
                } if prenotazione else {}
            })
        return jsonify(notifiche_data), 200

    @app.route('/api/notifiche/mark-all-read', methods=['PUT', 'OPTIONS'])
    @jwt_required()
    def mark_all_notifiche_as_read():
        if request.method == 'OPTIONS':
            response = jsonify({})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
            response.headers.add('Access-Control-Allow-Methods', 'PUT, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            return response, 200

        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Accesso negato"}), 403

        try:
            notifiche = Notifica.query.filter_by(letto=False).all()
            for notifica in notifiche:
                notifica.letto = True
            db.session.commit()
            return jsonify({"message": "Tutte le notifiche sono state segnate come lette"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Errore: {str(e)}"}), 500

    @app.route('/api/notifiche/<int:notifica_id>/letto', methods=['PUT', 'OPTIONS'])
    @jwt_required()
    def mark_notifica_as_read(notifica_id):
        if request.method == 'OPTIONS':
            response = jsonify({})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
            response.headers.add('Access-Control-Allow-Methods', 'PUT, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            return response, 200

        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Accesso negato"}), 403

        notifica = Notifica.query.get(notifica_id)
        if not notifica:
            return jsonify({"message": "Notifica non trovata"}), 404

        notifica.letto = True
        db.session.commit()
        return jsonify({"message": "Notifica aggiornata"}), 200

    @app.route('/api/prenotazioni/calendario', methods=['GET', 'OPTIONS'])
    @jwt_required()
    def get_prenotazioni_calendario():
        if request.method == 'OPTIONS':
            response = jsonify({})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
            response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            return response, 200

        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Accesso negato"}), 403

        query = Prenotazione.query.filter_by(stato='attiva')
        result = []
        for p in query.all():
            utente = User.query.get(p.id_utente)
            dettagli = DettagliPrenotazione.query.filter_by(fk_prenotazione=p.id_prenotazione).all()
            result.append({
                "id_prenotazione": p.id_prenotazione,
                "data_prenotata": p.data_prenotata.isoformat(),
                "nome": utente.nome,
                "cognome": utente.cognome,
                "numero_posti": p.numero_posti,
                "menu_items": [Piatto.query.get(d.fk_piatto).nome for d in dettagli],
                "note_aggiuntive": p.note_aggiuntive
            })

        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
        return response, 200

    @app.route('/api/posti-rimanenti', methods=['GET'])
    def get_posti_rimanenti():
        data = request.args.get('data')
        try:
            data_selezionata = datetime.fromisoformat(data).date()
        except:
            return jsonify({"message": "Formato data non valido"}), 400
        blocked = BlockedDay.query.filter_by(blocked_date=data_selezionata).first()
        if blocked:
            return jsonify(0), 200
        posti_esistenti = db.session.query(
            db.func.sum(Prenotazione.numero_posti)
        ).filter(
            db.func.DATE(Prenotazione.data_prenotata) == data_selezionata,
            Prenotazione.stato == "attiva"
        ).scalar() or 0

        posti_rimanenti = 100 - posti_esistenti
        return jsonify(posti_rimanenti), 200

        
    @app.route('/api/block-day', methods=['POST', 'OPTIONS'])
    @jwt_required()
    def block_day():
        if request.method == 'OPTIONS':
                response = jsonify({})
                response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
                response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
                return response, 200

        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
                return jsonify({"message": "Accesso negato"}), 403

        data = request.get_json()
        try:
                    blocked_date = datetime.fromisoformat(data['date']).date()
        except Exception:
            return jsonify({"message": "Formato data non valido"}), 400

        existing = BlockedDay.query.filter_by(blocked_date=blocked_date).first()
        if existing:
                    return jsonify({"message": "Giorno già bloccato"}), 400

        new_block = BlockedDay(blocked_date=blocked_date)
        db.session.add(new_block)
        db.session.commit()
        response = jsonify({"message": "Giorno bloccato"}), 201
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
        return response

    @app.route('/api/blocked-days',  methods=['GET', 'OPTIONS'])
    @jwt_required()
    def get_blocked_days():
        if request.method == 'OPTIONS':
            response = jsonify({})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
            response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            return response, 200
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Accesso negato"}), 403
            
        days = BlockedDay.query.all()
        response_data = [bd.blocked_date.isoformat() for bd in days]  # Corretto: blocked_date invece di days
        response = jsonify(response_data)
        response.status_code = 200
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
        return response  # Restituisci direttamente la response

    @app.route('/api/blocked-days/<date_str>', methods=['DELETE', 'OPTIONS'])
    @jwt_required()
    def delete_blocked_day(date_str):
        if request.method == 'OPTIONS':
            response = jsonify({})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
            response.headers.add('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            return response, 200
        try:
            date = datetime.fromisoformat(date_str).date()  # Converti stringa in date
            blocked_day = BlockedDay.query.filter_by(blocked_date=date).first()
            if not blocked_day:
                return jsonify({"message": "Giorno non bloccato"}), 404
            db.session.delete(blocked_day)
            db.session.commit()
            return jsonify({"message": "Giorno sbloccato"}), 200
        except ValueError:
            return jsonify({"message": "Formato data non valido"}), 400
        except Exception as e:
            db.session.rollback()
            print(f"Errore durante lo sblocco: {str(e)}")
            return jsonify({"message": f"Errore interno: {str(e)}"}), 500
        
    @app.route('/api/piatti', methods=['POST'])
    @jwt_required()
    def crea_piatto():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Accesso negato"}), 403

        data = request.get_json()
        if not data or 'nome' not in data or 'prezzo' not in data:
            return jsonify({"message": "Dati mancanti"}), 400

        try:
            nuovo_piatto = Piatto(
                nome=data['nome'],
                prezzo=float(data['prezzo']),
                descrizione=data.get('descrizione', '')
            )
            db.session.add(nuovo_piatto)
            db.session.commit()
            return jsonify({
                "message": "Piatto creato con successo",
                "piatto": {
                    "id_piatto": nuovo_piatto.id_piatto,
                    "nome": nuovo_piatto.nome,
                    "prezzo": nuovo_piatto.prezzo,
                    "descrizione": nuovo_piatto.descrizione
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Errore nella creazione del piatto: {str(e)}"}), 500
        
    @app.route('/api/piatti', methods=['GET'])
    @jwt_required()
    def prendi_piatti():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.ruolo != RuoloEnum.admin:
            return jsonify({"message": "Accesso negato"}), 403

        try:
            piatti = Piatto.query.all()
            piatti_data = [{
                "id_piatto": piatto.id_piatto,
                "nome": piatto.nome,
                "prezzo": piatto.prezzo,
                "descrizione": piatto.descrizione
            } for piatto in piatti]
            return jsonify(piatti_data), 200
        except Exception as e:
            return jsonify({"message": f"Errore nel recupero dei piatti: {str(e)}"}), 500


    @app.route('/api/piatti', methods=['POST'])
    @jwt_required()
    def crea_piatti():
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or user.ruolo != RuoloEnum.admin:
                return jsonify({"message": "Accesso negato"}), 403

            data = request.get_json()
            if not data or 'nome' not in data or 'prezzo' not in data:
                return jsonify({"message": "Dati mancanti"}), 400

            try:
                nuovo_piatto = Piatto(
                    nome=data['nome'],
                    prezzo=float(data['prezzo']),
                    descrizione=data.get('descrizione', '')
                )
                db.session.add(nuovo_piatto)
                db.session.commit()
                return jsonify({
                    "message": "Piatto creato con successo",
                    "piatto": {
                        "id_piatto": nuovo_piatto.id_piatto,
                        "nome": nuovo_piatto.nome,
                        "prezzo": nuovo_piatto.prezzo,
                        "descrizione": nuovo_piatto.descrizione
                    }
                }), 201
            except Exception as e:
                db.session.rollback()
                return jsonify({"message": f"Errore nella creazione del piatto: {str(e)}"}), 500


    @app.route('/api/piatti/<int:piatto_id>', methods=['DELETE'])
    @jwt_required()
    def delete_piatto(piatto_id):
                user_id = get_jwt_identity()
                user = User.query.get(user_id)
                if not user or user.ruolo != RuoloEnum.admin:
                    return jsonify({"message": "Accesso negato"}), 403

                try:
                    piatto = Piatto.query.get(piatto_id)
                    if not piatto:
                        return jsonify({"message": "Piatto non trovato"}), 404

                    db.session.delete(piatto)
                    db.session.commit()
                    return jsonify({"message": "Piatto eliminato con successo"}), 200
                except Exception as e:
                    db.session.rollback()
                    return jsonify({"message": f"Errore nell'eliminazione del piatto: {str(e)}"}), 500
                
  
