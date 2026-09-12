package com.incubyte.paylens.currency.repository;

import java.math.BigDecimal;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.incubyte.paylens.currency.domain.FxRate;

/**
 * Seeds FX rates for testing.
 * Only active in test profile.
 */
@Component
@Transactional
public class FxRateTestSeedRunner implements CommandLineRunner {

    private final FxRateRepository fxRateRepository;

    public FxRateTestSeedRunner(FxRateRepository fxRateRepository) {
        this.fxRateRepository = fxRateRepository;
    }

    @Override
    public void run(String... args) {
        if (fxRateRepository.count() > 0) {
            return; // Already seeded
        }

        fxRateRepository.save(new FxRate("USD", new BigDecimal("1.000000")));
        fxRateRepository.save(new FxRate("INR", new BigDecimal("83.000000")));
        fxRateRepository.save(new FxRate("GBP", new BigDecimal("1.270000")));
        fxRateRepository.save(new FxRate("EUR", new BigDecimal("1.100000")));
        fxRateRepository.save(new FxRate("CAD", new BigDecimal("1.360000")));
        fxRateRepository.save(new FxRate("AUD", new BigDecimal("1.530000")));
        fxRateRepository.save(new FxRate("SGD", new BigDecimal("0.740000")));
        fxRateRepository.save(new FxRate("JPY", new BigDecimal("149.000000")));
    }
}


