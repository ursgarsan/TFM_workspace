from openai import OpenAI

from app.core.config import get_settings


def _build_rule_based_answer(question: str, clinical_context: str | None = None) -> str:
    lower_q = question.lower()
    context_hint = ""
    if clinical_context and "Tratamientos:" in clinical_context:
        context_hint = (
            " Tengo en cuenta tu plan de tratamiento y, mientras se restablece la IA, te sugiero seguir "
            "los horarios pautados y registrar tomas/sintomas de hoy."
        )

    if any(token in lower_q for token in ["dolor pecho", "falta de aire", "desmayo", "sangrado"]):
        return (
            "Ahora mismo no pude usar el modelo de IA y te respondo en modo respaldo. "
            "Por seguridad, los sintomas que describes pueden ser de alarma: busca atencion urgente de inmediato."
        )

    if any(token in lower_q for token in ["fiebre", "tos", "mareo", "dolor"]):
        return (
            "Ahora mismo no pude usar el modelo de IA y te respondo en modo respaldo. "
            "Vigila tu evolucion en las proximas 24-48 horas, mantente hidratado y consulta con tu medico si no mejoras."
            f"{context_hint}"
        )

    return (
        "Ahora mismo no pude usar el modelo de IA y te respondo en modo respaldo. "
        "Si me compartes sintomas, duracion e intensidad, podre orientarte mejor."
        f"{context_hint}"
    )


def _build_ai_answer(question: str, clinical_context: str | None = None) -> str | None:
    settings = get_settings()

    if not settings.assistant_ai_enabled:
        return None
    if settings.assistant_ai_provider.lower() != "openai":
        return None
    if not settings.assistant_ai_api_key:
        return None

    client_kwargs: dict[str, str | float] = {
        "api_key": settings.assistant_ai_api_key,
        "timeout": settings.assistant_ai_timeout_seconds,
    }
    if settings.assistant_ai_base_url:
        client_kwargs["base_url"] = settings.assistant_ai_base_url

    try:
        user_message = question
        if clinical_context:
            user_message = (
                "Contexto clinico del usuario (si falta informacion, no la inventes):\n"
                f"{clinical_context}\n\n"
                "Consulta del usuario:\n"
                f"{question}"
            )

        client = OpenAI(**client_kwargs)
        completion = client.chat.completions.create(
            model=settings.assistant_ai_model,
            temperature=settings.assistant_ai_temperature,
            max_tokens=480,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Eres un asistente de salud orientativo para adherencia terapeutica. "
                        "Usa TODO el contexto clinico disponible para personalizar la respuesta y priorizar tratamiento activo. "
                        "Si hay medicacion registrada, menciona explicitamente farmaco, dosis y horario cuando sea relevante. "
                        "Si hay datos de adherencia, utilzalos para recomendar acciones concretas para hoy. "
                        "Si hay consultas previas, evita repetir texto literal y aporta valor nuevo. "
                        "Si falta contexto clinico, dilo explicitamente y pide el dato minimo necesario. "
                        "No des diagnosticos definitivos ni sustituyas al personal sanitario. "
                        "Si hay sintomas graves, indica acudir a urgencias. "
                        "Responde en espanol con tono natural, claro y empatico, sin plantillas fijas. "
                        "Da una respuesta personalizada de 3-6 frases: interpretacion, accion practica hoy, y criterio de alarma."
                    ),
                },
                {"role": "user", "content": user_message},
            ],
        )
    except Exception:
        return None

    answer = completion.choices[0].message.content if completion.choices else None
    if not answer:
        return None
    return answer.strip()


def build_assistant_answer(question: str, clinical_context: str | None = None) -> tuple[str, str]:
    ai_answer = _build_ai_answer(question, clinical_context)
    if ai_answer:
        return ai_answer, "ai"
    return _build_rule_based_answer(question, clinical_context), "rules"
