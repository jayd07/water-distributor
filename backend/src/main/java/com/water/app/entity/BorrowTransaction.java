package com.water.app.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "borrow_transactions")
public class BorrowTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long borrowId;

    private Long customerId;
    private String itemType;
    private Integer quantity;
    private Double depositPerUnit;
    private Double totalDeposit;
    private LocalDateTime date = LocalDateTime.now();
}
