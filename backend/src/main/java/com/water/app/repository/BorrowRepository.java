package com.water.app.repository;

import com.water.app.entity.BorrowTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BorrowRepository extends JpaRepository<BorrowTransaction, Long> {
}
