package com.dealstoker.api.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RailwayDatabaseUrlsTest {

    @Test
    void parsesRailwayUrl() {
        RailwayDatabaseUrls.Parsed parsed = RailwayDatabaseUrls.parse(
                "postgresql://postgres:p%40ss@containers-us-west.railway.app:6543/railway"
        );
        assertEquals(
                "jdbc:postgresql://containers-us-west.railway.app:6543/railway?sslmode=require",
                parsed.jdbcUrl()
        );
        assertEquals("postgres", parsed.username());
        assertEquals("p@ss", parsed.password());
    }
}
