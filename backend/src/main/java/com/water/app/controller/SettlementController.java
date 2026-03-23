package com.water.app.controller;

import com.water.app.entity.Customer;
import com.water.app.entity.SettlementTransaction;
import com.water.app.repository.CustomerRepository;
import com.water.app.repository.SettlementRepository;
import com.water.app.service.LedgerService;
import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/settlements")
public class SettlementController {

    private final SettlementRepository settlementRepository;
    private final CustomerRepository customerRepository;
    private final LedgerService ledgerService;

    public SettlementController(SettlementRepository settlementRepository,
                                CustomerRepository customerRepository,
                                LedgerService ledgerService) {
        this.settlementRepository = settlementRepository;
        this.customerRepository = customerRepository;
        this.ledgerService = ledgerService;
    }

    @PostMapping
    @Transactional
    public SettlementTransaction settle(@RequestBody SettlementTransaction tx) {
        if (tx.getAmount() == null || tx.getAmount() <= 0) {
            throw new RuntimeException("Settlement amount must be greater than zero");
        }

        Customer customer = customerRepository.findById(tx.getCustomerId()).orElseThrow();
        customer.setDepositBalance(customer.getDepositBalance() + tx.getAmount());
        customerRepository.save(customer);

        tx.setDate(LocalDateTime.now());

        SettlementTransaction savedTx = settlementRepository.save(tx);

        ledgerService.record(
                savedTx.getCustomerId(),
                "SETTLEMENT",
                savedTx.getNote() == null || savedTx.getNote().isBlank()
                        ? "Customer settled balance"
                        : savedTx.getNote(),
                0,
                savedTx.getAmount()
        );

        return savedTx;
    }
}
