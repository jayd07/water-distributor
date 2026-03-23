package com.water.app.controller;

import com.water.app.entity.BorrowTransaction;
import com.water.app.service.BorrowService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/borrow")
public class BorrowController {

    private final BorrowService service;

    public BorrowController(BorrowService service) {
        this.service = service;
    }

    @PostMapping
    public BorrowTransaction borrow(@RequestParam Long customerId, @RequestParam String itemType, @RequestParam Integer quantity, @RequestParam Double deposit) {
        return service.borrow(customerId, itemType, quantity, deposit);
    }
}
