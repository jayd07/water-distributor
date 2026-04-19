package com.water.app.controller;

import com.water.app.entity.Customer;
import com.water.app.entity.RefillItem;
import com.water.app.entity.RefillTransaction;
import com.water.app.repository.CustomerRepository;
import com.water.app.repository.RefillRepository;
import com.water.app.service.LedgerService;
import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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

        if (tx.getItems() == null || tx.getItems().isEmpty()) {
            throw new IllegalArgumentException("At least one item is required for a refill.");
        }

        Customer customer = customerRepository.findById(tx.getCustomerId()).orElseThrow(
                () -> new RuntimeException("Customer not found: " + tx.getCustomerId())
        );

        // ── Calculate subtotal per item and grand total ──
        double grandTotal = 0.0;
        int totalQty = 0;

        for (RefillItem item : tx.getItems()) {
            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Quantity must be > 0 for item: " + item.getItemType());
            }
            if (item.getPricePerUnit() == null || item.getPricePerUnit() < 0) {
                throw new IllegalArgumentException("Price per unit must be >= 0 for item: " + item.getItemType());
            }

            double subtotal = item.getQuantity() * item.getPricePerUnit();
            item.setSubtotal(subtotal);
            item.setRefillTransaction(tx);

            grandTotal += subtotal;
            totalQty += item.getQuantity();
        }

        tx.setTotalAmount(grandTotal);
        tx.setDate(LocalDateTime.now());

        // ── Deduct from customer deposit ──
        customer.setDepositBalance(customer.getDepositBalance() - grandTotal);
        customerRepository.save(customer);

        RefillTransaction savedTx = repo.save(tx);

        // ── Build human-readable ledger description ──
        // e.g. "Refilled 5 units [20L ×3 @₹40 =₹120, 10L ×2 @₹25 =₹50], adjusted against deposit"
        String itemSummary = savedTx.getItems().stream()
                .map(i -> String.format("%s x%d @Rs%.0f = Rs%.0f",
                        i.getItemType(), i.getQuantity(), i.getPricePerUnit(), i.getSubtotal()))
                .collect(Collectors.joining(", "));

        ledgerService.record(
                savedTx.getCustomerId(),
                "REFILL",
                "Refilled " + totalQty + " units [" + itemSummary + "], adjusted against deposit",
                totalQty,
                savedTx.getTotalAmount()
        );

        return savedTx;
    }

    /** GET /refill?from=...&to=... — existing range query kept intact */
    @GetMapping
    public List<RefillTransaction> getRefills(
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to) {

        if (from != null && to != null) {
            return repo.findAllByDateBetweenOrderByDateDesc(from, to);
        }
        return repo.findAll();
    }
}
