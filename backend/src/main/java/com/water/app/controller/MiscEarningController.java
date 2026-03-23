package com.water.app.controller;

import com.water.app.entity.MiscEarning;
import com.water.app.repository.MiscEarningRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/misc-earnings")
public class MiscEarningController {

    private final MiscEarningRepository miscEarningRepository;

    public MiscEarningController(MiscEarningRepository miscEarningRepository) {
        this.miscEarningRepository = miscEarningRepository;
    }

    @PostMapping
    public MiscEarning create(@RequestBody MiscEarning miscEarning) {
        if (miscEarning.getAmount() == null || miscEarning.getAmount() <= 0) {
            throw new RuntimeException("Misc earning amount must be greater than zero");
        }

        miscEarning.setDate(LocalDateTime.now());
        return miscEarningRepository.save(miscEarning);
    }

    @GetMapping
    public List<MiscEarning> list(@RequestParam(required = false) String from,
                                  @RequestParam(required = false) String to) {
        LocalDateTime fromDateTime = parseFrom(from);
        LocalDateTime toDateTime = parseTo(to);
        return miscEarningRepository.findAllByDateBetweenOrderByDateDesc(fromDateTime, toDateTime);
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
