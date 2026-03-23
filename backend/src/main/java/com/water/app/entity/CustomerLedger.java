package com.water.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name="customer_ledger")
public class CustomerLedger {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long ledgerId;

private Long customerId;

private String transactionType;

private String description;

private Integer quantity;

private Double amount;

private LocalDateTime createdAt = LocalDateTime.now();

}