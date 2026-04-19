package com.water.app.service;

import com.water.app.entity.Inventory;
import com.water.app.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository repository;

    public InventoryService(InventoryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Inventory addInventory(String itemType, Integer quantity, Double refillPricePerUnit) {

        Inventory inventory = repository.findById(itemType).orElse(null);

        if (inventory == null) {
            inventory = new Inventory();
            inventory.setItemType(itemType);
            inventory.setTotalStock(quantity);
            inventory.setAvailableStock(quantity);
            inventory.setBorrowedStock(0);
            inventory.setRefillPricePerUnit(refillPricePerUnit == null ? 0 : refillPricePerUnit);
        } else {
            inventory.setTotalStock(inventory.getTotalStock() + quantity);
            inventory.setAvailableStock(inventory.getAvailableStock() + quantity);
            if (refillPricePerUnit != null) {
                inventory.setRefillPricePerUnit(refillPricePerUnit);
            }
        }

        return repository.save(inventory);
    }

    @Transactional
    public Inventory updateRefillPrice(String itemType, Double refillPricePerUnit) {
        if (refillPricePerUnit == null || refillPricePerUnit < 0) {
            throw new RuntimeException("Refill price per unit must be zero or greater");
        }

        Inventory inventory = repository.findById(itemType).orElseThrow(() -> new RuntimeException("Item not found"));
        inventory.setRefillPricePerUnit(refillPricePerUnit);
        return repository.save(inventory);
    }

    public List<Inventory> getAllInventory() {
        return repository.findAll();
    }

    public Inventory getInventory(String itemType) {
        return repository.findById(itemType).orElseThrow(() -> new RuntimeException("Item not found"));
    }

    @Transactional
    public Inventory borrowInventory(String itemType, Integer quantity) {

        Inventory inventory = repository.findById(itemType).orElseThrow();

        if (inventory.getAvailableStock() < quantity) {
            throw new RuntimeException("Not enough stock available");
        }

        inventory.setAvailableStock(inventory.getAvailableStock() - quantity);
        inventory.setBorrowedStock(inventory.getBorrowedStock() + quantity);

        return repository.save(inventory);
    }

    @Transactional
    public Inventory returnInventory(String itemType, Integer quantity) {

        Inventory inventory = repository.findById(itemType).orElseThrow();

        inventory.setAvailableStock(inventory.getAvailableStock() + quantity);
        inventory.setBorrowedStock(inventory.getBorrowedStock() - quantity);

        return repository.save(inventory);
    }
}
