package com.incubyte.paylens.currency.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.incubyte.paylens.currency.repository.FxRateRepository;
import com.incubyte.paylens.common.InvalidEmployeeQueryException;

/**
 * Converts monetary amounts from native currency to USD using static FX rates.
 *
 * Used for analytics reporting to normalize salaries across different currencies.
 */
@Service
@Transactional(readOnly = true)
public class CurrencyConverter {

    private final FxRateRepository fxRateRepository;

    public CurrencyConverter(FxRateRepository fxRateRepository) {
        this.fxRateRepository = fxRateRepository;
    }

    /**
     * Convert an amount from native currency to USD.
     *
     * @param amount the amount in native currency
     * @param currency the ISO 4217 currency code (e.g., "INR", "GBP")
     * @return amount converted to USD, rounded to 2 decimal places
     * @throws InvalidEmployeeQueryException if currency not found
     */
    public BigDecimal toUsd(BigDecimal amount, String currency) {
        if (amount == null || amount.signum() < 0) {
            throw new InvalidEmployeeQueryException("Amount must be non-negative");
        }
        if (currency == null || currency.isBlank()) {
            throw new InvalidEmployeeQueryException("Currency must not be blank");
        }

        BigDecimal rate = fxRateRepository.findByCurrency(currency.trim().toUpperCase())
                .map(fr -> fr.getRateToUsd())
                .orElseThrow(() -> new InvalidEmployeeQueryException(
                        "FX rate not found for currency: " + currency));

        return amount.divide(rate, 2, RoundingMode.HALF_UP);
    }
}

