package com.water.app.controller;

import com.water.app.entity.Customer;
import com.water.app.entity.Inventory;
import com.water.app.entity.ReturnTransaction;
import com.water.app.repository.CustomerRepository;
import com.water.app.repository.InventoryRepository;
import com.water.app.repository.ReturnRepository;
import com.water.app.service.LedgerService;
import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/return")
public class ReturnController {

    private final ReturnRepository returnRepository;
    private final CustomerRepository customerRepository;
    private final InventoryRepository inventoryRepository;
    private final LedgerService ledgerService;

    public ReturnController(ReturnRepository returnRepository,
                            CustomerRepository customerRepository,
                            InventoryRepository inventoryRepository,
                            LedgerService ledgerService) {
        this.returnRepository = returnRepository;
        this.customerRepository = customerRepository;
        this.inventoryRepository = inventoryRepository;
        this.ledgerService = ledgerService;
    }

    @PostMapping
    @Transactional
    public ReturnTransaction returnItem(@RequestBody ReturnTransaction tx) {

        Customer customer = customerRepository.findById(tx.getCustomerId()).orElseThrow();
        Inventory inventory = inventoryRepository.findById(tx.getItemType()).orElseThrow();

        if (inventory.getBorrowedStock() < tx.getQuantity()) {
            throw new RuntimeException("Not enough borrowed stock available for return");
        }

        if (customer.getDepositBalance() < tx.getDepositRefunded()) {
            throw new RuntimeException("Refund cannot exceed customer deposit balance");
        }

        removeActiveItem(customer, tx.getItemType(), tx.getQuantity());
        customer.setDepositBalance(customer.getDepositBalance() - tx.getDepositRefunded());

        inventory.setAvailableStock(inventory.getAvailableStock() + tx.getQuantity());
        inventory.setBorrowedStock(inventory.getBorrowedStock() - tx.getQuantity());

        customerRepository.save(customer);
        inventoryRepository.save(inventory);

        tx.setDate(LocalDateTime.now());

        ReturnTransaction savedTx = returnRepository.save(tx);

        ledgerService.record(
                savedTx.getCustomerId(),
                "RETURN",
                "Returned " + savedTx.getQuantity() + " " + savedTx.getItemType(),
                savedTx.getQuantity(),
                -savedTx.getDepositRefunded()
        );

        return savedTx;
    }

    private void removeActiveItem(Customer customer, String itemType, Integer qty) {
        if ("cooler".equalsIgnoreCase(itemType)) {
            if (customer.getActiveCoolers() < qty) {
                throw new RuntimeException("Customer does not have enough coolers to return");
            }

            customer.setActiveCoolers(customer.getActiveCoolers() - qty);
            return;
        }

        if (customer.getActiveJars() < qty) {
            throw new RuntimeException("Customer does not have enough jars to return");
        }

        customer.setActiveJars(customer.getActiveJars() - qty);
    }
}
