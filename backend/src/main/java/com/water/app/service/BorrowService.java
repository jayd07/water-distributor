package com.water.app.service;

import com.water.app.entity.BorrowTransaction;
import com.water.app.entity.Customer;
import com.water.app.entity.Inventory;
import com.water.app.repository.BorrowRepository;
import com.water.app.repository.CustomerRepository;
import com.water.app.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BorrowService {

    private final BorrowRepository borrowRepo;
    private final CustomerRepository customerRepo;
    private final InventoryRepository inventoryRepo;
    private final LedgerService ledgerService;

    public BorrowService(BorrowRepository borrowRepo,
                         CustomerRepository customerRepo,
                         InventoryRepository inventoryRepo,
                         LedgerService ledgerService) {
        this.borrowRepo = borrowRepo;
        this.customerRepo = customerRepo;
        this.inventoryRepo = inventoryRepo;
        this.ledgerService = ledgerService;
    }

    @Transactional
    public BorrowTransaction borrow(Long customerId, String itemType, Integer qty, Double deposit) {

        Customer customer = customerRepo.findById(customerId).orElseThrow();
        Inventory inventory = inventoryRepo.findById(itemType).orElseThrow();

        if (inventory.getAvailableStock() < qty) {
            throw new RuntimeException("Not enough stock available");
        }

        inventory.setAvailableStock(inventory.getAvailableStock() - qty);
        inventory.setBorrowedStock(inventory.getBorrowedStock() + qty);

        addActiveItem(customer, itemType, qty);

        Double totalDeposit = qty * deposit;
        customer.setDepositBalance(customer.getDepositBalance() + totalDeposit);

        BorrowTransaction tx = new BorrowTransaction();
        tx.setCustomerId(customerId);
        tx.setItemType(itemType);
        tx.setQuantity(qty);
        tx.setDepositPerUnit(deposit);
        tx.setTotalDeposit(totalDeposit);

        inventoryRepo.save(inventory);
        customerRepo.save(customer);

        BorrowTransaction savedTx = borrowRepo.save(tx);

        ledgerService.record(
                customerId,
                "BORROW",
                "Borrowed " + qty + " " + itemType,
                qty,
                totalDeposit
        );

        return savedTx;
    }

    private void addActiveItem(Customer customer, String itemType, Integer qty) {
        if ("cooler".equalsIgnoreCase(itemType)) {
            customer.setActiveCoolers(customer.getActiveCoolers() + qty);
            return;
        }

        customer.setActiveJars(customer.getActiveJars() + qty);
    }
}
