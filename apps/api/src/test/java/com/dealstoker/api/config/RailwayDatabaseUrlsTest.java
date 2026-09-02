package com.dealstoker.api.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RailwayDatabaseUrlsTest {

    @AfterEach
    void clearProps() {
        System.clearProperty("DATABASE_URL");
        System.clearProperty("SPRING_DATASOURCE_URL");
        System.clearProperty("spring.datasource.url");
        System.clearProperty(RailwayDatabaseUrls.JDBC_URL_PROPERTY);
        System.clearProperty(RailwayDatabaseUrls.JDBC_USER_PROPERTY);
        System.clearProperty(RailwayDatabaseUrls.JDBC_PASSWORD_PROPERTY);
    }

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

    @Test
    void applyConvertsSpringDatasourceUrlEvenWhenDatabaseUrlAlreadyJdbc() {
        System.setProperty(
                "DATABASE_URL",
                "jdbc:postgresql://host.railway.internal:5432/railway?sslmode=require"
        );
        System.setProperty(
                "SPRING_DATASOURCE_URL",
                "postgresql://postgres:secret@host.railway.internal:5432/railway"
        );
        RailwayDatabaseUrls.applyFromEnvironment();
        assertTrue(System.getProperty(RailwayDatabaseUrls.JDBC_URL_PROPERTY).startsWith("jdbc:"));
        assertTrue(System.getProperty("SPRING_DATASOURCE_URL").startsWith("jdbc:"));
        assertTrue(System.getProperty("DATABASE_URL").startsWith("jdbc:"));
        assertEquals("postgres", System.getProperty(RailwayDatabaseUrls.JDBC_USER_PROPERTY));
        assertEquals("secret", System.getProperty(RailwayDatabaseUrls.JDBC_PASSWORD_PROPERTY));
    }
}
