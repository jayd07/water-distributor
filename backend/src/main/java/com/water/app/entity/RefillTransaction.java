package com.water.app.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "refill_transactions")
public class RefillTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long refillId;

    private Long customerId;

    /**
     * Sum of all RefillItem subtotals.
     * Computed server-side — clients do not need to send this.
     */
    private Double totalAmount;

    private LocalDateTime date = LocalDateTime.now();

    private Double quantity;

    private Double pricePerUnit;
    /**
     * One or more item lines, each carrying:
     *   itemType, quantity, pricePerUnit, subtotal
     */
    @OneToMany(mappedBy = "refillTransaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<RefillItem> items = new ArrayList<>();
}
