package com.water.app.controller;

import com.water.app.entity.Customer;
import com.water.app.entity.RefillTransaction;
import com.water.app.repository.CustomerRepository;
import com.water.app.repository.RefillRepository;
import com.water.app.service.LedgerService;
import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/refill")
public class RefillController {

    private final RefillRepository repo;
    private final CustomerRepository customerRepository;
    private final LedgerService ledgerService;

    public RefillController(RefillRepository repo,
                            CustomerRepository customerRepository,
                            LedgerService ledgerService) {
        this.repo = repo;
        this.customerRepository = customerRepository;
        this.ledgerService = ledgerService;
    }

    @PostMapping
    @Transactional
    public RefillTransaction refill(@RequestBody RefillTransaction tx) {
        Customer customer = customerRepository.findById(tx.getCustomerId()).orElseThrow();

        tx.setTotalAmount(tx.getQuantity() * tx.getPricePerUnit());

        customer.setDepositBalance(customer.getDepositBalance() - tx.getTotalAmount());
        customerRepository.save(customer);

        tx.setDate(LocalDateTime.now());

        RefillTransaction savedTx = repo.save(tx);

        ledgerService.record(
                savedTx.getCustomerId(),
                "REFILL",
                "Refilled " + savedTx.getQuantity() + " units, adjusted against deposit",
                savedTx.getQuantity(),
                savedTx.getTotalAmount()
        );

        return savedTx;
    }
}
