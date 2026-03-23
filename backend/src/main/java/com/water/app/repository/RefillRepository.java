package com.water.app.repository;

import com.water.app.entity.RefillTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface RefillRepository extends JpaRepository<RefillTransaction, Long> {

    List<RefillTransaction> findAllByDateBetweenOrderByDateDesc(LocalDateTime from, LocalDateTime to);
}
