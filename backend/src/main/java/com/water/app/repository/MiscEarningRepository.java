package com.water.app.repository;

import com.water.app.entity.MiscEarning;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MiscEarningRepository extends JpaRepository<MiscEarning, Long> {

    List<MiscEarning> findAllByDateBetweenOrderByDateDesc(LocalDateTime from, LocalDateTime to);
}
