package com.incubyte.paylens.currency.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incubyte.paylens.currency.domain.FxRate;

public interface FxRateRepository extends JpaRepository<FxRate, Long> {
    Optional<FxRate> findByCurrency(String currency);
}

