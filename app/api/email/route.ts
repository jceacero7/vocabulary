import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, subject, message } = await request.json()

    // Validar los datos de entrada
    if (!email || !subject || !message) {
      return NextResponse.json({ error: "Email, subject, and message are required" }, { status: 400 })
    }

    // Aquí normalmente se integraría con un servicio de email como SendGrid, Mailgun, etc.
    // Por ahora, simplemente simulamos el envío de email

    console.log("Sending email to:", email)
    console.log("Subject:", subject)
    console.log("Message:", message)

    // Simular un retraso para imitar el envío real
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // En un entorno de producción, aquí se integraría con un servicio de email real
    // Por ejemplo, con SendGrid:
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    
    const msg = {
      to: email,
      from: 'your-verified-sender@example.com',
      subject: subject,
      text: message,
      html: message.replace(/\n/g, '<br>'),
    }
    
    await sgMail.send(msg)
    */

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      { error: "Failed to send email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
