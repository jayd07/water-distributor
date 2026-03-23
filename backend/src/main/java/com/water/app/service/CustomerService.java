package com.water.app.service;

import com.water.app.entity.Customer;
import com.water.app.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository repo;

    public CustomerService(CustomerRepository repo) {
        this.repo = repo;
    }

    public Customer create(Customer c) {
        return repo.save(c);
    }

    public List<Customer> all() {
        return repo.findAll();
    }

    public Customer get(Long id) {
        return repo.findById(id).orElseThrow();
    }
}
