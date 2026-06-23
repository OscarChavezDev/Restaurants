package com.tingo.restaurants.application.service;

import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Chunk;
import com.itextpdf.text.Document;
import com.itextpdf.text.Font;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.tingo.restaurants.domain.exception.RestaurantNotFoundException;
import com.tingo.restaurants.infrastructure.persistence.entity.PaymentEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.RatingEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.ReservationEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.PaymentJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RatingJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantJpaRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Exportación de reportes a Excel/PDF (S15-02): reservas, ingresos y reseñas. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportExportService {

    private final ReservationJpaRepository reservationJpaRepository;
    private final PaymentJpaRepository paymentJpaRepository;
    private final RatingJpaRepository ratingJpaRepository;
    private final RestaurantJpaRepository restaurantJpaRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] exportXlsx(UUID restaurantId, LocalDate from, LocalDate to) {
        ReportData data = loadData(restaurantId, from, to);

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CellStyle headerStyle = headerStyle(workbook);

            Sheet sheetReservas = workbook.createSheet("Reservas");
            String[] headersReservas = {"Fecha", "Hora", "Cliente", "Teléfono", "Personas", "Estado", "Código"};
            writeHeader(sheetReservas, headersReservas, headerStyle);
            int rowIdx = 1;
            for (ReservationEntity r : data.reservas) {
                Row row = sheetReservas.createRow(rowIdx++);
                row.createCell(0).setCellValue(r.getReservationDate().format(DATE_FMT));
                row.createCell(1).setCellValue(r.getStartTime().toString());
                row.createCell(2).setCellValue(r.getCustomerName());
                row.createCell(3).setCellValue(r.getCustomerPhone());
                row.createCell(4).setCellValue(r.getPartySize());
                row.createCell(5).setCellValue(r.getStatus().name());
                row.createCell(6).setCellValue(r.getConfirmationCode());
            }
            autoSize(sheetReservas, headersReservas.length);

            Sheet sheetPagos = workbook.createSheet("Pagos");
            String[] headersPagos = {"Fecha", "Cliente", "Monto (S/)", "Método"};
            writeHeader(sheetPagos, headersPagos, headerStyle);
            rowIdx = 1;
            for (PaymentEntity p : data.pagos) {
                Row row = sheetPagos.createRow(rowIdx++);
                row.createCell(0).setCellValue(p.getCreatedAt().format(DATE_FMT));
                row.createCell(1).setCellValue(data.customerNameFor(p));
                row.createCell(2).setCellValue(p.getAmount().doubleValue());
                row.createCell(3).setCellValue(p.getMethod());
            }
            Row totalRow = sheetPagos.createRow(rowIdx + 1);
            totalRow.createCell(1).setCellValue("Total ingresos verificados:");
            totalRow.createCell(2).setCellValue(data.totalPagos().doubleValue());
            autoSize(sheetPagos, headersPagos.length);

            Sheet sheetResenas = workbook.createSheet("Reseñas");
            String[] headersResenas = {"Fecha", "Puntaje", "Comentario"};
            writeHeader(sheetResenas, headersResenas, headerStyle);
            rowIdx = 1;
            for (RatingEntity r : data.resenas) {
                Row row = sheetResenas.createRow(rowIdx++);
                row.createCell(0).setCellValue(r.getCreatedAt().format(DATE_FMT));
                row.createCell(1).setCellValue(r.getScore());
                row.createCell(2).setCellValue(r.getComment() != null ? r.getComment() : "");
            }
            autoSize(sheetResenas, headersResenas.length);

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando el reporte Excel: " + e.getMessage(), e);
        }
    }

    public byte[] exportPdf(UUID restaurantId, LocalDate from, LocalDate to) {
        ReportData data = loadData(restaurantId, from, to);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD);
            Font subtitleFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL);
            Font sectionFont = new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD);

            doc.add(new Paragraph("Reporte — " + data.restaurant.getName(), titleFont));
            doc.add(new Paragraph("Periodo: " + from.format(DATE_FMT) + " al " + to.format(DATE_FMT), subtitleFont));
            doc.add(Chunk.NEWLINE);

            doc.add(new Paragraph("Reservas (" + data.reservas.size() + ")", sectionFont));
            PdfPTable tableReservas = new PdfPTable(5);
            tableReservas.setWidthPercentage(100);
            addHeaderRow(tableReservas, "Fecha", "Hora", "Cliente", "Personas", "Estado");
            for (ReservationEntity r : data.reservas) {
                tableReservas.addCell(r.getReservationDate().format(DATE_FMT));
                tableReservas.addCell(r.getStartTime().toString());
                tableReservas.addCell(r.getCustomerName());
                tableReservas.addCell(String.valueOf(r.getPartySize()));
                tableReservas.addCell(r.getStatus().name());
            }
            doc.add(tableReservas);
            doc.add(Chunk.NEWLINE);

            doc.add(new Paragraph("Ingresos verificados (" + data.pagos.size() + ") — Total: S/ " + data.totalPagos(), sectionFont));
            PdfPTable tablePagos = new PdfPTable(3);
            tablePagos.setWidthPercentage(100);
            addHeaderRow(tablePagos, "Fecha", "Monto (S/)", "Método");
            for (PaymentEntity p : data.pagos) {
                tablePagos.addCell(p.getCreatedAt().format(DATE_FMT));
                tablePagos.addCell(p.getAmount().toString());
                tablePagos.addCell(p.getMethod());
            }
            doc.add(tablePagos);
            doc.add(Chunk.NEWLINE);

            double avgScore = data.resenas.stream().mapToInt(RatingEntity::getScore).average().orElse(0);
            doc.add(new Paragraph("Reseñas (" + data.resenas.size() + ") — Promedio: " + Math.round(avgScore * 10) / 10.0, sectionFont));
            PdfPTable tableResenas = new PdfPTable(3);
            tableResenas.setWidthPercentage(100);
            addHeaderRow(tableResenas, "Fecha", "Puntaje", "Comentario");
            for (RatingEntity r : data.resenas) {
                tableResenas.addCell(r.getCreatedAt().format(DATE_FMT));
                tableResenas.addCell(String.valueOf(r.getScore()));
                tableResenas.addCell(r.getComment() != null ? r.getComment() : "");
            }
            doc.add(tableResenas);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando el reporte PDF: " + e.getMessage(), e);
        }
    }

    private ReportData loadData(UUID restaurantId, LocalDate from, LocalDate to) {
        RestaurantEntity restaurant = restaurantJpaRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(restaurantId));
        List<ReservationEntity> reservas = reservationJpaRepository
                .findByRestaurantIdAndReservationDateBetweenOrderByReservationDateAscStartTimeAsc(restaurantId, from, to);
        List<PaymentEntity> pagos = paymentJpaRepository
                .findByRestaurantIdAndStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
                        restaurantId, "VERIFIED", from.atStartOfDay(), to.plusDays(1).atStartOfDay());
        List<RatingEntity> resenas = ratingJpaRepository
                .findByRestaurantIdAndCreatedAtBetweenOrderByCreatedAtDesc(restaurantId, from.atStartOfDay(), to.plusDays(1).atStartOfDay());

        Map<UUID, ReservationEntity> reservationsById = reservationJpaRepository
                .findAllById(pagos.stream().map(PaymentEntity::getReservationId).distinct().toList())
                .stream().collect(Collectors.toMap(ReservationEntity::getId, Function.identity()));

        return new ReportData(restaurant, reservas, pagos, resenas, reservationsById);
    }

    private record ReportData(
            RestaurantEntity restaurant,
            List<ReservationEntity> reservas,
            List<PaymentEntity> pagos,
            List<RatingEntity> resenas,
            Map<UUID, ReservationEntity> reservationsById) {

        String customerNameFor(PaymentEntity p) {
            ReservationEntity r = reservationsById.get(p.getReservationId());
            return r != null ? r.getCustomerName() : "—";
        }

        BigDecimal totalPagos() {
            return pagos.stream().map(PaymentEntity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }

    private void addHeaderRow(PdfPTable table, String... headers) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h));
            cell.setBackgroundColor(new BaseColor(247, 122, 61));
            table.addCell(cell);
        }
    }

    private CellStyle headerStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        var font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private void writeHeader(Sheet sheet, String[] headers, CellStyle style) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private void autoSize(Sheet sheet, int columns) {
        for (int i = 0; i < columns; i++) sheet.autoSizeColumn(i);
    }
}
