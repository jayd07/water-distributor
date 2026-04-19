package com.water.app.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "refill_items")
public class RefillItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refill_id", nullable = false)
    @JsonBackReference
    private RefillTransaction refillTransaction;

    /** Must match an existing Inventory.itemType */
    private String itemType;

    private Integer quantity;

    private Double pricePerUnit;

    /** Calculated: quantity * pricePerUnit */
    private Double subtotal;
}
