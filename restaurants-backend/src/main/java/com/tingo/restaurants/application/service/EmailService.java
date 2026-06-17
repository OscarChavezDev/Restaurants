package com.tingo.restaurants.application.service;

import com.tingo.restaurants.domain.model.Reservation;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final ResourceLoader resourceLoader;

    @Value("${spring.mail.username:noreply@tingo-restaurants.com}")
    private String fromEmail;

    @Async
    public void sendReservationCreated(Reservation reservation) {
        if (reservation.getCustomerEmail() == null || reservation.getCustomerEmail().isBlank()) return;
        
        try {
            String template = loadTemplate("classpath:templates/reservation-created.html");
            String html = template.replace("{code}", reservation.getConfirmationCode())
                                  .replace("{name}", reservation.getCustomerName() != null ? reservation.getCustomerName() : "Turista");
            
            sendHtmlEmail(reservation.getCustomerEmail(), "Tu reserva ha sido recibida", html);
            log.info("Email de creación enviado a {}", reservation.getCustomerEmail());
        } catch (Exception e) {
            log.error("Error enviando email de creación de reserva", e);
        }
    }

    @Async
    public void sendReservationConfirmed(Reservation reservation) {
        if (reservation.getCustomerEmail() == null || reservation.getCustomerEmail().isBlank()) return;
        
        try {
            String template = loadTemplate("classpath:templates/reservation-confirmed.html");
            String html = template.replace("{name}", reservation.getCustomerName() != null ? reservation.getCustomerName() : "Turista")
                                  .replace("{fecha}", reservation.getReservationDate().toString())
                                  .replace("{hora}", reservation.getStartTime().toString());
            
            sendHtmlEmail(reservation.getCustomerEmail(), "¡Tu reserva está confirmada!", html);
            log.info("Email de confirmación enviado a {}", reservation.getCustomerEmail());
        } catch (Exception e) {
            log.error("Error enviando email de confirmación de reserva", e);
        }
    }

    @Async
    public void sendReservationCancelled(Reservation reservation) {
        if (reservation.getCustomerEmail() == null || reservation.getCustomerEmail().isBlank()) return;
        
        try {
            String template = loadTemplate("classpath:templates/reservation-cancelled.html");
            String html = template.replace("{name}", reservation.getCustomerName() != null ? reservation.getCustomerName() : "Turista")
                                  .replace("{code}", reservation.getConfirmationCode());
            
            sendHtmlEmail(reservation.getCustomerEmail(), "Actualización sobre tu reserva", html);
            log.info("Email de cancelación enviado a {}", reservation.getCustomerEmail());
        } catch (Exception e) {
            log.error("Error enviando email de cancelación de reserva", e);
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    private String loadTemplate(String path) throws IOException {
        Resource resource = resourceLoader.getResource(path);
        return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }
}
