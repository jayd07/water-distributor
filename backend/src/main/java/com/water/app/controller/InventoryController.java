package com.water.app.controller;

import com.water.app.entity.Inventory;
import com.water.app.service.InventoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @PostMapping("/add")
    public Inventory addInventory(@RequestParam String itemType,
                                  @RequestParam Integer quantity) {

        return service.addInventory(itemType, quantity);
    }

    @GetMapping
    public List<Inventory> getAllInventory() {
        return service.getAllInventory();
    }

    @GetMapping("/{itemType}")
    public Inventory getInventory(@PathVariable String itemType) {
        return service.getInventory(itemType);
    }

    @PostMapping("/borrow")
    public Inventory borrowInventory(@RequestParam String itemType,
                                     @RequestParam Integer quantity) {

        return service.borrowInventory(itemType, quantity);
    }

    @PostMapping("/return")
    public Inventory returnInventory(@RequestParam String itemType,
                                     @RequestParam Integer quantity) {

        return service.returnInventory(itemType, quantity);
    }
}