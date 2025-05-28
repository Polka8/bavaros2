import smtplib
from email.message import EmailMessage

def invia_email_conferma(to_email, nome_cliente, data_prenotata, numero_posti):
    msg = EmailMessage()
    msg['Subject'] = 'Conferma Prenotazione - Bavaros'
    msg['From'] = 'tuaemail@gmail.com'  # mittente
    msg['To'] = to_email

    msg.set_content(f"""
Ciao {nome_cliente},

la tua prenotazione è stata confermata!

📅 Data: {data_prenotata}
👥 Numero di posti: {numero_posti}

Grazie per aver scelto Bavaros!

A presto!
""")

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login('tuaemail@gmail.com', 'TUA_PASSWORD')  # usa una app password
            smtp.send_message(msg)
    except Exception as e:
        print(f"Errore durante l'invio dell'email: {e}")
