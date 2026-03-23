package com.water.app.controller;

import com.water.app.entity.Customer;
import com.water.app.service.CustomerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @PostMapping
    public Customer create(@RequestBody Customer c) {
        return service.create(c);
    }

    @GetMapping
    public List<Customer> all() {
        return service.all();
    }

    @GetMapping("/{id}")
    public Customer get(@PathVariable Long id) {
        return service.get(id);
    }
}
