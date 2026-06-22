package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.response.PromotionResponse;
import com.tingo.restaurants.domain.exception.RestaurantNotFoundException;
import com.tingo.restaurants.domain.model.Promotion;
import com.tingo.restaurants.domain.model.enums.PromotionType;
import com.tingo.restaurants.domain.exception.DomainException;
import com.tingo.restaurants.domain.model.Restaurant;
import com.tingo.restaurants.domain.repository.PromotionRepository;
import com.tingo.restaurants.domain.repository.RestaurantRepository;
import com.tingo.restaurants.infrastructure.integration.GeminiTextClient;
import com.tingo.restaurants.infrastructure.security.OwnershipGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final RestaurantRepository restaurantRepository;
    private final OwnershipGuard ownershipGuard;
    private final GeminiTextClient geminiTextClient;

    @Transactional
    public PromotionResponse create(UUID restaurantId, String title, String description,
                                    PromotionType promoType, BigDecimal discountValue,
                                    BigDecimal minOrderAmount, String promoCode,
                                    LocalDateTime validFrom, LocalDateTime validUntil,
                                    Integer usageLimit) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(restaurantId));
        ownershipGuard.assertOwnsRestaurant(restaurantId);

        Promotion promo = Promotion.builder()
                .id(UUID.randomUUID()).restaurantId(restaurantId).title(title)
                .description(description).promoType(promoType).discountValue(discountValue)
                .minOrderAmount(minOrderAmount).promoCode(promoCode)
                .validFrom(validFrom).validUntil(validUntil).isActive(true)
                .usageLimit(usageLimit).usageCount(0)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        return toResponse(promotionRepository.save(promo));
    }

    public List<PromotionResponse> findByRestaurant(UUID restaurantId) {
        return promotionRepository.findByRestaurantId(restaurantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<PromotionResponse> findActiveByRestaurant(UUID restaurantId) {
        return promotionRepository.findActiveByRestaurantId(restaurantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void delete(UUID id) {
        Promotion promo = promotionRepository.findById(id)
                .orElseThrow(() -> new DomainException("Promoción no encontrada", "PROMOTION_NOT_FOUND") {});
        ownershipGuard.assertOwnsRestaurant(promo.getRestaurantId());
        promotionRepository.deleteById(id);
    }

    @Transactional
    public PromotionResponse toggleActive(UUID id) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> new DomainException("Promoción no encontrada", "PROMOTION_NOT_FOUND") {});
        ownershipGuard.assertOwnsRestaurant(p.getRestaurantId());
        Promotion updated = p.toBuilder().isActive(!p.isActive()).updatedAt(LocalDateTime.now()).build();
        return toResponse(promotionRepository.save(updated));
    }

    /**
     * Genera el copy del flyer (titular + subtítulo) con IA a partir de los datos
     * de la promoción. Si la IA no está disponible, usa un texto por defecto.
     */
    @Transactional
    public PromotionResponse generateFlyer(UUID id) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> new DomainException("Promoción no encontrada", "PROMOTION_NOT_FOUND") {});
        ownershipGuard.assertOwnsRestaurant(p.getRestaurantId());

        String restaurantName = restaurantRepository.findById(p.getRestaurantId())
                .map(Restaurant::getName).orElse("nuestro restaurante");

        String headline = null;
        String tagline = null;
        String ai = geminiTextClient.complete(
                "Eres un creativo de marketing gastronómico. Escribes copy breve, atractivo y en español. Sin emojis.",
                "Genera EXACTAMENTE dos líneas para un flyer de promoción:\n" +
                "Línea 1 = TITULAR llamativo (máximo 6 palabras).\n" +
                "Línea 2 = SUBTÍTULO (máximo 14 palabras).\n" +
                "No agregues etiquetas, numeración ni comillas.\n\n" +
                "Promoción:\n" +
                "- Restaurante: " + restaurantName + "\n" +
                "- Título: " + nz(p.getTitle()) + "\n" +
                "- Descripción: " + nz(p.getDescription()) + "\n" +
                "- Tipo: " + (p.getPromoType() != null ? p.getPromoType().name() : "") + "\n" +
                "- Descuento: " + (p.getDiscountValue() != null ? p.getDiscountValue().toPlainString() : "") + "\n" +
                "- Código: " + nz(p.getPromoCode()),
                200);

        if (ai != null) {
            String[] lines = ai.split("\\r?\\n");
            List<String> clean = new ArrayList<>();
            for (String l : lines) {
                String t = l.replaceAll("^\\s*([0-9]+[\\.)\\-]|[-*•])\\s*", "").replaceAll("^[\"“”']|[\"“”']$", "").trim();
                if (!t.isBlank()) clean.add(t);
            }
            if (!clean.isEmpty()) headline = trunc(clean.get(0), 120);
            if (clean.size() > 1) tagline = trunc(clean.get(1), 200);
        }
        // Fallback si la IA no respondió.
        if (headline == null || headline.isBlank()) headline = trunc(nz(p.getTitle()), 120);
        if (tagline == null || tagline.isBlank()) tagline = trunc(nz(p.getDescription()), 200);

        Promotion updated = p.toBuilder()
                .flyerHeadline(headline).flyerTagline(tagline).updatedAt(LocalDateTime.now()).build();
        return toResponse(promotionRepository.save(updated));
    }

    /** Promociones activas (con flyer) de todos los restaurantes activos, para el carrusel. */
    public List<PromotionResponse> showcase() {
        List<PromotionResponse> out = new ArrayList<>();
        for (Promotion p : promotionRepository.findShowcase()) {
            Restaurant r = restaurantRepository.findById(p.getRestaurantId()).orElse(null);
            if (r == null || !r.isActive()) continue; // solo restaurantes publicados
            out.add(toResponse(p).toBuilder()
                    .restaurantName(r.getName()).restaurantSlug(r.getSlug()).build());
        }
        return out;
    }

    private static String nz(String s) { return s != null ? s : ""; }
    private static String trunc(String s, int max) {
        if (s == null) return null;
        s = s.trim();
        return s.length() <= max ? s : s.substring(0, max);
    }

    private PromotionResponse toResponse(Promotion p) {
        return PromotionResponse.builder()
                .id(p.getId()).restaurantId(p.getRestaurantId()).title(p.getTitle())
                .description(p.getDescription()).promoType(p.getPromoType())
                .discountValue(p.getDiscountValue()).minOrderAmount(p.getMinOrderAmount())
                .promoCode(p.getPromoCode()).imageUrl(p.getImageUrl())
                .validFrom(p.getValidFrom()).validUntil(p.getValidUntil())
                .isActive(p.isActive()).usageLimit(p.getUsageLimit()).usageCount(p.getUsageCount())
                .flyerHeadline(p.getFlyerHeadline()).flyerTagline(p.getFlyerTagline())
                .build();
    }
}
