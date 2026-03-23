package com.water.app.repository;

import com.water.app.entity.ReturnTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReturnRepository extends JpaRepository<ReturnTransaction, Long> {
}
