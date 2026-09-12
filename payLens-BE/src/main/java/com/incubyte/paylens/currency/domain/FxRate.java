package com.incubyte.paylens.currency.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * FX Rate for currency conversion to USD.
 *
 * Used for analytics reporting currency normalization.
 * Rates are static/seeded; not live updated.
 *
 * Decision: Storing rates as DECIMAL(10, 6) to handle various currency scales:
 * - USD rate = 1.000000
 * - INR rate ≈ 83.000000 (many decimal places for precision)
 * - JPY rate ≈ 149.000000 (currencies with large multipliers)
 *
 * Precision of 10,6 ensures accuracy for analytics aggregation without overflow.
 */
@Entity
@Table(name = "fx_rate", indexes = {
        @Index(name = "idx_fx_rate_currency", columnList = "currency", unique = true)
})
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FxRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The DB stores `currency` as CHAR(3); see Employee for the same reasoning.
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "currency", nullable = false, length = 3, unique = true, columnDefinition = "CHAR(3)")
    private String currency;

    @Column(name = "rate_to_usd", nullable = false, precision = 10, scale = 6)
    private BigDecimal rateToUsd;

    public FxRate(String currency, BigDecimal rateToUsd) {
        this.currency = currency;
        this.rateToUsd = rateToUsd;
    }
}

