package com.water.app.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "refill_transactions")
public class RefillTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long refillId;

    private Long customerId;
    private Integer quantity;
    private Double pricePerUnit;
    private Double totalAmount;
    private LocalDateTime date = LocalDateTime.now();
}
