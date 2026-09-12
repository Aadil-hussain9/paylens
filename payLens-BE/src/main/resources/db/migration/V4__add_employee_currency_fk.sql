-- Referential integrity between an employee's native currency and the seeded FX table.
--
-- Safety notes:
-- * fx_rate.currency is already CHAR(3) NOT NULL UNIQUE (V2), so it is a valid FK target.
-- * V2 populates the 8 supported currencies BEFORE any employee row can be inserted
--   (V1 creates the table, V2 seeds fx_rate, seed runner / user inserts run afterwards).
-- * ON UPDATE / ON DELETE default to NO ACTION on purpose:
--   - FX rows are effectively static reference data; deletions would corrupt analytics.
--   - Compensation updates go through CompensationService which validates the target
--     currency against fx_rate before writing, so the FK is a belt-and-braces guarantee,
--     not the primary validation.
ALTER TABLE employee
    ADD CONSTRAINT fk_employee_currency
    FOREIGN KEY (currency)
    REFERENCES fx_rate (currency);

