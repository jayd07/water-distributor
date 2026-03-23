package com.water.app.controller;

import com.water.app.entity.MiscEarning;
import com.water.app.entity.RefillTransaction;
import com.water.app.repository.MiscEarningRepository;
import com.water.app.repository.RefillRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/earnings")
public class EarningsController {

    private final RefillRepository refillRepository;
    private final MiscEarningRepository miscEarningRepository;

    public EarningsController(RefillRepository refillRepository,
                              MiscEarningRepository miscEarningRepository) {
        this.refillRepository = refillRepository;
        this.miscEarningRepository = miscEarningRepository;
    }

    @GetMapping
    public Map<String, Object> getEarnings(@RequestParam(required = false) String from,
                                           @RequestParam(required = false) String to) {
        LocalDateTime fromDateTime = parseFrom(from);
        LocalDateTime toDateTime = parseTo(to);

        List<RefillTransaction> refills =
                refillRepository.findAllByDateBetweenOrderByDateDesc(fromDateTime, toDateTime);
        List<MiscEarning> miscEarnings =
                miscEarningRepository.findAllByDateBetweenOrderByDateDesc(fromDateTime, toDateTime);

        double refillTotal = refills.stream()
                .mapToDouble(refill -> {
                    if (refill.getTotalAmount() != null) {
                        return refill.getTotalAmount();
                    }

                    if (refill.getQuantity() != null && refill.getPricePerUnit() != null) {
                        return refill.getQuantity() * refill.getPricePerUnit();
                    }

                    return 0;
                })
                .sum();
        double miscTotal = miscEarnings.stream()
                .mapToDouble(misc -> misc.getAmount() == null ? 0 : misc.getAmount())
                .sum();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("from", fromDateTime);
        response.put("to", toDateTime);
        response.put("refillTotal", refillTotal);
        response.put("miscTotal", miscTotal);
        response.put("totalEarnings", refillTotal + miscTotal);
        response.put("refillCount", refills.size());
        response.put("miscCount", miscEarnings.size());
        return response;
    }

    private LocalDateTime parseFrom(String value) {
        if (value == null || value.isBlank()) {
            return LocalDate.now().atStartOfDay();
        }

        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ignored) {
            return LocalDate.parse(value).atStartOfDay();
        }
    }

    private LocalDateTime parseTo(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now();
        }

        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ignored) {
            return LocalDate.parse(value).atTime(LocalTime.MAX);
        }
    }
}
