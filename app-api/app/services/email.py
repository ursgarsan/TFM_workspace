from email.message import EmailMessage
from email.utils import formataddr
import smtplib

from app.core.config import get_settings


class EmailDeliveryError(RuntimeError):
    pass


def send_patient_welcome_email(recipient: str, full_name: str, temporary_password: str) -> None:
    settings = get_settings()
    if not settings.smtp_host or not settings.smtp_from_email:
        raise EmailDeliveryError("El servicio de correo no está configurado")

    message = EmailMessage()
    message["Subject"] = "Acceso inicial a su aplicación de salud"
    message["From"] = formataddr((settings.smtp_from_name, settings.smtp_from_email))
    message["To"] = recipient
    message.set_content(
        f"Hola, {full_name}.\n\n"
        "Se ha creado su acceso a la aplicación de salud.\n\n"
        f"Correo de acceso: {recipient}\n"
        f"Contraseña temporal: {temporary_password}\n\n"
        "Al iniciar sesión por primera vez, la aplicación le pedirá que cambie esta contraseña.\n"
        "No comparta este mensaje ni su contraseña con otras personas.\n"
    )

    try:
        smtp_class = smtplib.SMTP_SSL if settings.smtp_use_ssl else smtplib.SMTP
        with smtp_class(
            settings.smtp_host,
            settings.smtp_port,
            timeout=settings.smtp_timeout_seconds,
        ) as smtp:
            if settings.smtp_use_tls and not settings.smtp_use_ssl:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise EmailDeliveryError("No se pudo enviar el correo de bienvenida") from exc
