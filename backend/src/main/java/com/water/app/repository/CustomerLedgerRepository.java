package com.water.app.repository;

import com.water.app.entity.CustomerLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerLedgerRepository extends JpaRepository<CustomerLedger,Long>{

List<CustomerLedger> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

}