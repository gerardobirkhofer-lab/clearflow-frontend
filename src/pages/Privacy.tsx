import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px 80px', fontFamily: 'sans-serif', color: '#0f172a', lineHeight: 1.6 }}>
      <Link to="/" style={{ color: '#635bff', textDecoration: 'none', fontWeight: 600 }}>← ClearFlow</Link>
      <h1 style={{ marginTop: 24 }}>Privacidad y tratamiento de datos</h1>
      <p>
        ClearFlow S.L. trata los datos de cobros, extractos bancarios y conexiones de pago
        únicamente para prestar el servicio de conciliación que el cliente solicita.
        El cliente sigue siendo el responsable del tratamiento. ClearFlow actúa como encargado.
      </p>
      <p>
        Los datos se guardan en la base de datos de la cuenta que inició sesión. Una cuenta
        no puede consultar ni modificar los datos de otra. Las claves de proveedores de pago
        se almacenan cifradas.
      </p>
      <p>
        Subencargados usados para prestar el servicio: el proveedor de alojamiento de la API
        y de la base de datos, el proveedor que publica esta web, y Stripe cuando el cliente
        conecta pagos o contrata un plan.
      </p>
      <p>
        Para exportar o eliminar los datos de una cuenta, escribe a privacy@clearflow.app.
        Este texto describe el funcionamiento del producto. Un acuerdo de encargo firmado
        debe acompañar a cada cliente antes de cargar extractos reales.
      </p>
    </div>
  );
}
