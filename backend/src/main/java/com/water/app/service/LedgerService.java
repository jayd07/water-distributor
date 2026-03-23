package com.water.app.service;

import com.water.app.entity.CustomerLedger;
import com.water.app.repository.CustomerLedgerRepository;
import org.springframework.stereotype.Service;

@Service
public class LedgerService {

private final CustomerLedgerRepository repo;

public LedgerService(CustomerLedgerRepository repo){
this.repo = repo;
}

public void record(Long customerId,String type,String description,Integer qty,Double amount){

CustomerLedger ledger = new CustomerLedger();

ledger.setCustomerId(customerId);
ledger.setTransactionType(type);
ledger.setDescription(description);
ledger.setQuantity(qty);
ledger.setAmount(amount);

repo.save(ledger);
}
}