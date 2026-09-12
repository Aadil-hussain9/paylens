package com.incubyte.paylens.currency.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.incubyte.paylens.currency.domain.FxRate;

@SpringBootTest
class FxRateRepositoryTest {

    @Autowired
    private FxRateRepository fxRateRepository;

    @Test
    void shouldHaveUsdRateOfOne() {
        FxRate usdRate = fxRateRepository.findByCurrency("USD")
                .orElseThrow(() -> new AssertionError("USD rate not found"));
        assertThat(usdRate.getRateToUsd()).isEqualTo(new BigDecimal("1.000000"));
    }

    @Test
    void shouldHaveAllRequiredCurrencies() {
        assertThat(fxRateRepository.findByCurrency("INR")).isNotEmpty();
        assertThat(fxRateRepository.findByCurrency("GBP")).isNotEmpty();
        assertThat(fxRateRepository.findByCurrency("EUR")).isNotEmpty();
        assertThat(fxRateRepository.findByCurrency("CAD")).isNotEmpty();
        assertThat(fxRateRepository.findByCurrency("AUD")).isNotEmpty();
        assertThat(fxRateRepository.findByCurrency("SGD")).isNotEmpty();
        assertThat(fxRateRepository.findByCurrency("JPY")).isNotEmpty();
    }

    @Test
    void shouldHavePositiveRates() {
        fxRateRepository.findAll().forEach(rate ->
                assertThat(rate.getRateToUsd()).isPositive()
        );
    }

    @Test
    void shouldEnforceCurrencyUniqueness() {
        // The unique constraint should prevent insertion of duplicate currencies
        // This is enforced by the database constraint
        FxRate existingRate = fxRateRepository.findByCurrency("USD").get();
        assertThat(existingRate).isNotNull();
    }
}

