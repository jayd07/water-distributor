package com.water.app.repository;

import com.water.app.entity.SettlementTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementRepository extends JpaRepository<SettlementTransaction, Long> {
}
