import smtplib
from email.message import EmailMessage
from app.config import settings
from typing import List, Optional

def send_email(subject: str, body: str, to: List[str], html: Optional[str] = None):
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = settings.email_from
    msg['To'] = ', '.join(to)
    msg.set_content(body)
    if html:
        msg.add_alternative(html, subtype='html')

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg) 