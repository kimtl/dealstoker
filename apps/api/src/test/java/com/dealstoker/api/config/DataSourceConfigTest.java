package com.dealstoker.api.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DataSourceConfigTest {

    @Test
    void convertsRailwayPostgresUrl() {
        DataSourceConfig.ParsedJdbc parsed = DataSourceConfig.parse(
                "postgresql://postgres:s3cret%21@postgres.railway.internal:5432/railway",
                null,
                null
        );

        assertEquals(
                "jdbc:postgresql://postgres.railway.internal:5432/railway?sslmode=require",
                parsed.url()
        );
        assertEquals("postgres", parsed.username());
        assertEquals("s3cret!", parsed.password());
    }

    @Test
    void keepsJdbcUrl() {
        DataSourceConfig.ParsedJdbc parsed = DataSourceConfig.parse(
                "jdbc:postgresql://localhost:5432/dealstoker",
                "dealstoker",
                "dealstoker"
        );
        assertEquals("jdbc:postgresql://localhost:5432/dealstoker", parsed.url());
        assertEquals("dealstoker", parsed.username());
    }

    @Test
    void rejectsBlank() {
        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> DataSourceConfig.parse("  ", null, null)
        );
        assertTrue(ex.getMessage().contains("required"));
    }
}
