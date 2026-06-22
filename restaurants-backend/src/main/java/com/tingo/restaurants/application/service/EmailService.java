package com.tingo.restaurants.application.service;

import com.tingo.restaurants.domain.model.Reservation;
import com.tingo.restaurants.domain.repository.RestaurantRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final RestaurantRepository restaurantRepository;
    private final com.tingo.restaurants.infrastructure.persistence.repository.ReservationConfigJpaRepository reservationConfigRepository;

    @Value("${spring.mail.username:noreply@tingo-restaurants.com}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private static final Locale ES = new Locale("es", "PE");
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy", ES);

    // Paleta Brasa & Selva
    private static final String BRASA = "#C2410C";
    private static final String SELVA = "#157F5B";

    @Async
    public void sendReservationCreated(Reservation r) {
        if (noEmail(r)) return;
        String body = "<p style='margin:0 0 16px'>¡Hola, <strong>" + name(r) + "</strong>! Recibimos tu solicitud de reserva en "
                + "<strong>" + restaurantName(r) + "</strong>. Está <strong>pendiente de confirmación</strong>.</p>"
                + detailsCard(r) + paymentBlock(r)
                + "<p style='margin:16px 0 0;color:#78716C;font-size:13px'>Guarda tu código <strong>" + r.getConfirmationCode()
                + "</strong> para consultar o cancelar tu reserva.</p>";
        send(r, "Recibimos tu reserva · " + restaurantName(r),
                wrap("Reserva recibida", BRASA, body, "Ver mi reserva", detailLink(r)));
    }

    @Async
    public void sendReservationConfirmed(Reservation r) {
        if (noEmail(r)) return;
        byte[] qr = null;
        try { qr = qrPng(detailLink(r)); } catch (Exception e) { log.warn("No se pudo generar el QR: {}", e.getMessage()); }
        String qrBlock = qr != null
                ? "<div style='text-align:center;margin:18px 0'>"
                + "<img src='cid:qr' width='180' height='180' alt='Código QR de la reserva' style='border-radius:12px;border:1px solid #EFEAE3'/>"
                + "<div style='color:#78716C;font-size:12px;margin-top:6px'>Muestra este código QR al llegar al restaurante</div></div>"
                : "";
        String body = "<p style='margin:0 0 16px'>¡Buenas noticias, <strong>" + name(r) + "</strong>! "
                + "<strong>" + restaurantName(r) + "</strong> confirmó tu reserva. ¡Te esperamos!</p>"
                + detailsCard(r) + paymentBlock(r) + qrBlock;
        send(r, "Tu reserva está confirmada · " + restaurantName(r),
                wrap("¡Reserva confirmada!", SELVA, body, "Ver mi reserva", detailLink(r)), qr);
    }

    @Async
    public void sendReservationCancelled(Reservation r) {
        if (noEmail(r)) return;
        String body = "<p style='margin:0 0 16px'>Hola, <strong>" + name(r) + "</strong>. Tu reserva en "
                + "<strong>" + restaurantName(r) + "</strong> (código " + r.getConfirmationCode() + ") fue <strong>cancelada</strong>.</p>"
                + "<p style='margin:0;color:#78716C;font-size:14px'>Si no fuiste tú o tienes dudas, comunícate con el restaurante. "
                + "¡Esperamos verte pronto!</p>";
        send(r, "Tu reserva fue cancelada · " + restaurantName(r),
                wrap("Reserva cancelada", "#B91C1C", body, "Reservar de nuevo", frontendUrl + "/restaurants"));
    }

    /** Recordatorio (S11-01/02). whenLabel: "mañana" o "en unas horas". */
    @Async
    public void sendReservationReminder(Reservation r, String whenLabel) {
        if (noEmail(r)) return;
        String body = "<p style='margin:0 0 16px'>Hola, <strong>" + name(r) + "</strong>. Te recordamos tu reserva <strong>"
                + whenLabel + "</strong> en <strong>" + restaurantName(r) + "</strong>.</p>"
                + detailsCard(r)
                + "<p style='margin:16px 0 0;color:#78716C;font-size:13px'>Si ya no puedes asistir, cancela tu reserva con anticipación.</p>";
        send(r, "Recordatorio de tu reserva · " + restaurantName(r),
                wrap("Te esperamos " + whenLabel, BRASA, body, "Ver mi reserva", detailLink(r)));
    }

    // ── Solicitud de cuenta de restaurante ─────────────────────────────────

    @Async
    public void sendOwnerApplicationReceived(String email, String name, String restaurantName) {
        if (email == null || email.isBlank()) return;
        String body = "<p style='margin:0 0 16px'>¡Hola, <strong>" + safe(name) + "</strong>! Recibimos tu solicitud para "
                + "registrar <strong>" + safe(restaurantName) + "</strong> en Tingo Restaurants.</p>"
                + "<p style='margin:0 0 16px;color:#57534E;font-size:14px'>Tu cuenta está <strong>en revisión</strong>. "
                + "Nuestro equipo verificará los datos de tu restaurante y te enviaremos un correo cuando sea aprobada. "
                + "Mientras tanto, aún no podrás iniciar sesión.</p>";
        sendHtml(email, "Recibimos tu solicitud · Tingo Restaurants",
                wrap("Solicitud recibida", BRASA, body, "Ir a Tingo Restaurants", frontendUrl));
    }

    @Async
    public void sendOwnerApplicationApproved(String email, String name) {
        if (email == null || email.isBlank()) return;
        String body = "<p style='margin:0 0 16px'>¡Buenas noticias, <strong>" + safe(name) + "</strong>! "
                + "Tu cuenta de restaurante fue <strong>aprobada</strong>.</p>"
                + "<p style='margin:0 0 16px;color:#57534E;font-size:14px'>Ya puedes iniciar sesión y empezar a gestionar "
                + "tu restaurante: menús, promociones, reservas y más. Tu restaurante ya es visible para los clientes.</p>";
        sendHtml(email, "Tu cuenta fue aprobada · Tingo Restaurants",
                wrap("¡Cuenta aprobada!", SELVA, body, "Iniciar sesión", frontendUrl + "/login"));
    }

    @Async
    public void sendOwnerApplicationRejected(String email, String name, String reason) {
        if (email == null || email.isBlank()) return;
        String reasonBlock = (reason != null && !reason.isBlank())
                ? "<p style='margin:0 0 16px;color:#57534E;font-size:14px'>Motivo: <em>" + safe(reason) + "</em></p>"
                : "";
        String body = "<p style='margin:0 0 16px'>Hola, <strong>" + safe(name) + "</strong>. "
                + "Lamentamos informarte que tu solicitud de cuenta de restaurante <strong>no fue aprobada</strong>.</p>"
                + reasonBlock
                + "<p style='margin:0;color:#57534E;font-size:14px'>Si crees que se trata de un error o quieres más "
                + "información, contáctanos respondiendo este correo.</p>";
        sendHtml(email, "Sobre tu solicitud · Tingo Restaurants",
                wrap("Solicitud no aprobada", "#B91C1C", body, "Ir a Tingo Restaurants", frontendUrl));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String safe(String s) {
        return s != null ? s : "";
    }

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email '{}' enviado a {}", subject, to);
        } catch (MessagingException | RuntimeException e) {
            log.error("Error enviando email a {}: {}", to, e.getMessage());
        }
    }

    private boolean noEmail(Reservation r) {
        return r.getCustomerEmail() == null || r.getCustomerEmail().isBlank();
    }

    private String name(Reservation r) {
        return r.getCustomerName() != null ? r.getCustomerName() : "Cliente";
    }

    private String restaurantName(Reservation r) {
        if (r.getRestaurantId() == null) return "el restaurante";
        return restaurantRepository.findById(r.getRestaurantId())
                .map(com.tingo.restaurants.domain.model.Restaurant::getName)
                .orElse("el restaurante");
    }

    private String detailLink(Reservation r) {
        return frontendUrl + "/reservations?code=" + r.getConfirmationCode();
    }

    static String time12h(LocalTime t) {
        if (t == null) return "";
        int h = t.getHour();
        String ampm = h >= 12 ? "p. m." : "a. m.";
        int h12 = h % 12; if (h12 == 0) h12 = 12;
        return h12 + ":" + String.format("%02d", t.getMinute()) + " " + ampm;
    }

    private String fmtDate(LocalDate d) {
        if (d == null) return "";
        String s = d.format(DATE_FMT);
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    /** Bloque con las instrucciones de pago del adelanto (S12-02). */
    private String paymentBlock(Reservation r) {
        if (r.getAdvanceAmount() == null || r.getAdvanceAmount().signum() <= 0) return "";
        var cfg = r.getRestaurantId() == null ? null
                : reservationConfigRepository.findByRestaurantId(r.getRestaurantId()).orElse(null);
        String info = cfg != null ? cfg.getPaymentInfo() : null;
        String qrUrl = cfg != null ? cfg.getPaymentQrUrl() : null;
        return "<div style='margin:8px 0;padding:14px;border-radius:12px;background:#FFF7ED;border:1px solid #FED7AA'>"
                + "<p style='margin:0 0 4px;font-weight:700;color:#9A3412'>Adelanto requerido: S/ " + r.getAdvanceAmount() + "</p>"
                + "<p style='margin:0;font-size:13px;color:#7C2D12'>Concepto: reserva " + r.getConfirmationCode() + "</p>"
                + (info != null && !info.isBlank()
                    ? "<p style='margin:8px 0 0;font-size:13px;color:#7C2D12;white-space:pre-line'>" + info + "</p>" : "")
                + (qrUrl != null && !qrUrl.isBlank()
                    ? "<div style='text-align:center;margin:10px 0 0'><img src='" + qrUrl + "' width='160' height='160' alt='QR de pago' style='border-radius:10px;border:1px solid #FED7AA'/>"
                      + "<div style='font-size:11px;color:#9A3412;margin-top:4px'>Escanea para pagar</div></div>" : "")
                + "<p style='margin:8px 0 0;font-size:12px;color:#9A3412'>Sube tu comprobante desde el botón \"Ver mi reserva\".</p>"
                + "</div>";
    }

    /** Tarjeta con los datos clave de la reserva. */
    private String detailsCard(Reservation r) {
        StringBuilder rows = new StringBuilder();
        rows.append(row("Fecha", fmtDate(r.getReservationDate())));
        rows.append(row("Hora", time12h(r.getStartTime())));
        rows.append(row("Personas", String.valueOf(r.getPartySize())));
        rows.append(row("Código", r.getConfirmationCode()));
        if (r.getAdvanceAmount() != null && r.getAdvanceAmount().signum() > 0) {
            rows.append(row("Adelanto", "S/ " + r.getAdvanceAmount()));
        }
        return "<table role='presentation' width='100%' style='border-collapse:collapse;background:#FAF8F5;"
                + "border:1px solid #EFEAE3;border-radius:12px;overflow:hidden;margin:8px 0'>" + rows + "</table>";
    }

    private String row(String label, String value) {
        return "<tr>"
                + "<td style='padding:10px 16px;color:#78716C;font-size:13px;border-bottom:1px solid #EFEAE3'>" + label + "</td>"
                + "<td style='padding:10px 16px;color:#1C1917;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #EFEAE3'>" + value + "</td>"
                + "</tr>";
    }

    /** Layout de marca compartido (header con logo, contenido, CTA, footer). */
    private String wrap(String heading, String accent, String contentHtml, String ctaText, String ctaLink) {
        return "<div style='margin:0;padding:24px;background:#F1ECE4;font-family:Segoe UI,Arial,sans-serif'>"
                + "<table role='presentation' width='100%' style='max-width:560px;margin:0 auto;border-collapse:collapse;"
                + "background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)'>"
                // Header / logo
                + "<tr><td style='background:linear-gradient(135deg," + BRASA + "," + SELVA + ");padding:22px 24px'>"
                + "<table role='presentation' style='border-collapse:collapse'><tr>"
                + "<td style='width:40px;height:40px;background:rgba(255,255,255,.18);border-radius:10px;text-align:center;"
                + "vertical-align:middle;color:#fff;font-weight:800;font-size:16px;font-family:Arial'>TR</td>"
                + "<td style='padding-left:12px;color:#fff;font-weight:700;font-size:17px'>Tingo Restaurants"
                + "<div style='font-size:12px;font-weight:400;opacity:.85'>Tingo María, Huánuco</div></td>"
                + "</tr></table></td></tr>"
                // Accent + heading
                + "<tr><td style='height:4px;background:" + accent + "'></td></tr>"
                + "<tr><td style='padding:24px'>"
                + "<h1 style='margin:0 0 12px;font-size:20px;color:" + accent + "'>" + heading + "</h1>"
                + contentHtml
                // CTA
                + "<div style='text-align:center;margin:24px 0 4px'>"
                + "<a href='" + ctaLink + "' style='display:inline-block;background:" + BRASA + ";color:#fff;text-decoration:none;"
                + "font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px'>" + ctaText + "</a>"
                + "</div></td></tr>"
                // Footer
                + "<tr><td style='padding:18px 24px;background:#FAF8F5;border-top:1px solid #EFEAE3;text-align:center'>"
                + "<a href='" + frontendUrl + "' style='color:" + BRASA + ";text-decoration:none;font-size:13px;font-weight:600'>"
                + frontendUrl.replaceFirst("https?://", "") + "</a>"
                + "<div style='margin-top:6px;color:#A8A29E;font-size:11px'>Plataforma turística de Tingo María · Este es un correo automático.</div>"
                + "</td></tr>"
                + "</table></div>";
    }

    private void send(Reservation r, String subject, String html) {
        send(r, subject, html, null);
    }

    private void send(Reservation r, String subject, String html, byte[] qrPng) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(r.getCustomerEmail());
            helper.setSubject(subject);
            helper.setText(html, true);
            if (qrPng != null) {
                helper.addInline("qr", new org.springframework.core.io.ByteArrayResource(qrPng), "image/png");
            }
            mailSender.send(message);
            log.info("Email '{}' enviado a {}", subject, r.getCustomerEmail());
        } catch (MessagingException | RuntimeException e) {
            log.error("Error enviando email a {}: {}", r.getCustomerEmail(), e.getMessage());
        }
    }

    /** Genera un PNG con el código QR del enlace dado (S11-04). */
    private byte[] qrPng(String text) throws Exception {
        var hints = new java.util.HashMap<com.google.zxing.EncodeHintType, Object>();
        hints.put(com.google.zxing.EncodeHintType.MARGIN, 1);
        hints.put(com.google.zxing.EncodeHintType.CHARACTER_SET, "UTF-8");
        com.google.zxing.common.BitMatrix matrix = new com.google.zxing.MultiFormatWriter()
                .encode(text, com.google.zxing.BarcodeFormat.QR_CODE, 220, 220, hints);
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(matrix, "PNG", out);
        return out.toByteArray();
    }
}
