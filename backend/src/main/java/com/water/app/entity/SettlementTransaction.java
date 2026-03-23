package com.water.app.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "settlement_transactions")
public class SettlementTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long settlementId;

    private Long customerId;
    private Double amount;
    private String note;
    private LocalDateTime date = LocalDateTime.now();
}
