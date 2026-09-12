package com.incubyte.paylens.currency.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.incubyte.paylens.common.InvalidEmployeeQueryException;

@SpringBootTest
class CurrencyConverterTest {

    @Autowired
    private CurrencyConverter currencyConverter;

    @Test
    void shouldConvertUsdToUsd() {
        BigDecimal usdAmount = new BigDecimal("1000.00");
        BigDecimal converted = currencyConverter.toUsd(usdAmount, "USD");
        assertThat(converted).isEqualTo(new BigDecimal("1000.00"));
    }

    @Test
    void shouldConvertInrToUsd() {
        // 83,000 INR / 83 = 1,000 USD
        BigDecimal inrAmount = new BigDecimal("83000.00");
        BigDecimal converted = currencyConverter.toUsd(inrAmount, "INR");
        assertThat(converted).isEqualTo(new BigDecimal("1000.00"));
    }

    @Test
    void shouldHandleCaseInsensitivity() {
        BigDecimal inrAmount = new BigDecimal("83000.00");
        BigDecimal converted = currencyConverter.toUsd(inrAmount, "inr");
        assertThat(converted).isEqualTo(new BigDecimal("1000.00"));
    }

    @Test
    void shouldRoundToTwoDecimalPlaces() {
        // Test rounding: 100 / 149 (JPY rate) = 0.67... → rounds to 0.67
        BigDecimal jpyAmount = new BigDecimal("100.00");
        BigDecimal converted = currencyConverter.toUsd(jpyAmount, "JPY");
        assertThat(converted).isEqualTo(new BigDecimal("0.67"));
    }

    @Test
    void shouldThrowForUnknownCurrency() {
        assertThatThrownBy(() ->
                currencyConverter.toUsd(new BigDecimal("1000"), "XXX"))
                .isInstanceOf(InvalidEmployeeQueryException.class)
                .hasMessageContaining("FX rate not found");
    }

    @Test
    void shouldThrowForNullAmount() {
        assertThatThrownBy(() ->
                currencyConverter.toUsd(null, "USD"))
                .isInstanceOf(InvalidEmployeeQueryException.class)
                .hasMessageContaining("Amount must be non-negative");
    }

    @Test
    void shouldThrowForNegativeAmount() {
        assertThatThrownBy(() ->
                currencyConverter.toUsd(new BigDecimal("-100"), "USD"))
                .isInstanceOf(InvalidEmployeeQueryException.class)
                .hasMessageContaining("Amount must be non-negative");
    }
}

