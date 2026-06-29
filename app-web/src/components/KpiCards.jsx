function KpiCards({ patientsCount, treatmentCount }) {
  return (
    <section className="kpi-grid">
      <article>
        <h2>Pacientes</h2>
        <p>{patientsCount}</p>
      </article>
      <article>
        <h2>Tratamientos del paciente</h2>
        <p>{treatmentCount}</p>
      </article>
    </section>
  )
}

export { KpiCards }
