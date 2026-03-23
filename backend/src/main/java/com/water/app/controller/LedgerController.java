package com.water.app.controller;

import com.water.app.entity.CustomerLedger;
import com.water.app.repository.CustomerLedgerRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ledger")
public class LedgerController {

private final CustomerLedgerRepository repo;

public LedgerController(CustomerLedgerRepository repo){
this.repo = repo;
}

@GetMapping("/{customerId}")
public List<CustomerLedger> getLedger(@PathVariable Long customerId){
return repo.findByCustomerIdOrderByCreatedAtDesc(customerId);
}
}