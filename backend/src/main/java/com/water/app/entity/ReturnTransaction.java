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
@Table(name = "return_transactions")
public class ReturnTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long returnId;

    private Long customerId;
    private String itemType;
    private Integer quantity;
    private Double depositRefunded;
    private LocalDateTime date = LocalDateTime.now();
}
