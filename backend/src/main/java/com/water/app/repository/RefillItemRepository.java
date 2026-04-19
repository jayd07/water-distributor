package com.water.app.repository;

import com.water.app.entity.RefillItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RefillItemRepository extends JpaRepository<RefillItem, Long> {

    /** All items belonging to a given refill transaction */
    List<RefillItem> findAllByRefillTransaction_RefillId(Long refillId);
}
