export function ticketCreadoTemplate({

  ticket,

  tipo,

  estado,

  responsable,

  correo,

}: {

  ticket: number;

  tipo: string;

  estado: string;

  responsable: string;

  correo: string;

}) {

  return `

<div style="
  font-family: Arial, sans-serif;
  background: #f4f6f8;
  padding: 40px;
">

  <div style="
  max-width: 650px;
  margin: auto;
  background: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
">


    <!-- HEADER -->

    <div style="
      background: #0F3D1F;
      padding: 30px;
      text-align: center;

      <h1 style="
  color: white;
  margin: 0;
  font-size: 28px;
">
  Falcon Farms
</h1>

      <p style="
        color: #cde7d5;
        margin-top: 8px;
        font-size: 14px;
      ">
        Service Desk
      </p>

    </div>

    <!-- BODY -->

    <div style="
      padding: 35px;
      color: #333;
    ">

      <h2 style="
        margin-top: 0;
        color: #0F3D1F;
      ">
        Su solicitud fue creada correctamente
      </h2>

      <p>
        El ticket fue registrado exitosamente en la plataforma.
      </p>

      <hr style="
        margin: 25px 0;
        border: none;
        border-top: 1px solid #ddd;
      " />

      <table style="
        width: 100%;
        border-collapse: collapse;
      ">

        <tr>
          <td style="padding: 10px 0;">
            <strong>Ticket:</strong>
          </td>

          <td>
            #${ticket}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px 0;">
            <strong>Tipo:</strong>
          </td>

          <td>
            ${tipo}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px 0;">
            <strong>Estado:</strong>
          </td>

          <td style="
            color: #d97706;
            font-weight: bold;
          ">
            ${estado}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px 0;">
            <strong>Asignado a:</strong>
          </td>

          <td>
            ${responsable}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px 0;">
            <strong>Correo:</strong>
          </td>

          <td>
            ${correo}
          </td>
        </tr>

      </table>
      <div style="
  margin-top: 35px;
  text-align: center;
">

  <a
    href="https://falcon-service-desk.vercel.app/login?redirect=/tickets/${ticket}"
    style="
      background: #0F3D1F;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 10px;
      display: inline-block;
      font-weight: bold;
      font-size: 14px;
    "
  >
    Ver Ticket
  </a>

</div>

      <div style="
        margin-top: 35px;
        padding: 20px;
        background: #f8fafc;
        border-radius: 10px;
        font-size: 14px;
        color: #555;
      ">

        Este correo fue generado automáticamente por Falcon Service Desk.

      </div>

    </div>

    <!-- FOOTER -->

    <div style="
      background: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #666;
    ">

      <strong>Falcon Farms</strong><br/>
      Service Desk

    </div>

  </div>

</div>

`;
}
export function ticketAsignadoTemplate({

  ticket,

  tipo,

  solicitante,

}: {

  ticket: number;

  tipo: string;

  solicitante: string;

}) {

  return `

<div style="
  font-family: Arial, sans-serif;
  background: #f4f6f8;
  padding: 40px;
">

  <div style="
  max-width: 650px;
  margin: auto;
  background: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
">


    <!-- HEADER -->

    <div style="
      background: #0F3D1F;
      padding: 30px;
      text-align: center;

      <h1 style="
        color: white;
        margin: 0;
        font-size: 28px;
      ">
        Nuevo Ticket Asignado
      </h1>

      <p style="
  color: #cde7d5;
  margin-top: 8px;
  font-size: 14px;
">
  Falcon Farms - Service Desk
</p>

    </div>

    <!-- BODY -->

    <div style="
      padding: 35px;
      color: #333;
    ">

      <p>
        Se ha generado un nuevo ticket asignado a su área.
      </p>

      <hr style="
        margin: 25px 0;
        border: none;
        border-top: 1px solid #ddd;
      " />

      <table style="
        width: 100%;
        border-collapse: collapse;
      ">

        <tr>
          <td style="padding: 10px 0;">
            <strong>Ticket:</strong>
          </td>

          <td>
            #${ticket}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px 0;">
            <strong>Tipo:</strong>
          </td>

          <td>
            ${tipo}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px 0;">
            <strong>Solicitante:</strong>
          </td>

          <td>
            ${solicitante}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px 0;">
            <strong>Estado:</strong>
          </td>

          <td style="
            color: #d97706;
            font-weight: bold;
          ">
            PENDIENTE
          </td>
        </tr>

      </table>
<div style="
  margin-top: 35px;
  text-align: center;
">

  <a
    href="https://falcon-service-desk.vercel.app/login?redirect=/tickets/${ticket}"
    style="
      background: #0F3D1F;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 10px;
      display: inline-block;
      font-weight: bold;
      font-size: 14px;
    "
  >
    Ver Ticket
  </a>

</div>
      <div style="
        margin-top: 35px;
        padding: 20px;
        background: #f8fafc;
        border-radius: 10px;
        font-size: 14px;
        color: #555;
      ">

        Ingrese a la plataforma para gestionar el ticket asignado.

      </div>

    </div>

    <!-- FOOTER -->

    <div style="
      background: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #666;
    ">

      <strong>Falcon Farms</strong><br/>
      Service Desk

    </div>

  </div>

</div>

`;
}
export function ticketActualizadoTemplate({

  ticket,

  estado,

  gestionadoPor,

  observacion,

}: {

  ticket: number;

  estado: string;

  gestionadoPor: string;

  observacion: string;

}) {

  return `

<div style="
  font-family: Arial, sans-serif;
  background: #f4f6f8;
  padding: 40px;
">

  <div style="
  max-width: 650px;
  margin: auto;
  background: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
">


    <!-- HEADER -->

    <div style="
      background: #0F3D1F;
      padding: 30px;
      text-align: center;

      <h1 style="
        color: white;
        margin: 0;
        font-size: 28px;
      ">
        Actualización de Ticket
      </h1>

      <p style="
  color: #cde7d5;
  margin-top: 8px;
  font-size: 14px;
">
  Falcon Farms - Service Desk
</p>

    </div>

    <!-- BODY -->

    <div style="
      padding: 35px;
      color: #333;
    ">

      <p>
        Su ticket fue actualizado correctamente.
      </p>

      <hr style="
        margin: 25px 0;
        border: none;
        border-top: 1px solid #ddd;
      " />

      <table style="
        width: 100%;
        border-collapse: collapse;
      ">

        <tr>
          <td style="padding: 10px 0;">
            <strong>Ticket:</strong>
          </td>

          <td>
            #${ticket}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px 0;">
            <strong>Nuevo estado:</strong>
          </td>

          <td style="
            color: #d97706;
            font-weight: bold;
          ">
            ${estado}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px 0;">
            <strong>Gestionado por:</strong>
          </td>

          <td>
            ${gestionadoPor}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px 0;">
            <strong>Observación:</strong>
          </td>

          <td>
            ${observacion}
          </td>
        </tr>

      </table>
<div style="
  margin-top: 35px;
  text-align: center;
">

  <a
    href="https://falcon-service-desk.vercel.app/login?redirect=/tickets/${ticket}"
    style="
      background: #0F3D1F;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 10px;
      display: inline-block;
      font-weight: bold;
      font-size: 14px;
    "
  >
    Ver Ticket
  </a>

</div>
    </div>

    <!-- FOOTER -->

    <div style="
      background: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #666;
    ">

      <strong>Falcon Farms</strong><br/>
      Service Desk

    </div>

  </div>

</div>

`;
}