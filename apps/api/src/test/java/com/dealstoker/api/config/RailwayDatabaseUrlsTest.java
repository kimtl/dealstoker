package com.dealstoker.api.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RailwayDatabaseUrlsTest {

    /** Every key applyFromEnvironment() may set — leaking any of them would change the
     *  credentials seen by other tests (e.g. the Spring context test) in the same JVM. */
    private static final String[] MUTATED_PROPERTIES = {
            "DATABASE_URL", "SPRING_DATASOURCE_URL", "JDBC_DATABASE_URL",
            "DATABASE_USERNAME", "SPRING_DATASOURCE_USERNAME",
            "DATABASE_PASSWORD", "SPRING_DATASOURCE_PASSWORD",
            "spring.datasource.url", "spring.datasource.username", "spring.datasource.password",
            RailwayDatabaseUrls.JDBC_URL_PROPERTY,
            RailwayDatabaseUrls.JDBC_USER_PROPERTY,
            RailwayDatabaseUrls.JDBC_PASSWORD_PROPERTY,
    };

    @AfterEach
    void clearProps() {
        for (String key : MUTATED_PROPERTIES) {
            System.clearProperty(key);
        }
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
    void applyConvertsSpringDatasourceUrlProperty() {
        System.setProperty(
                "SPRING_DATASOURCE_URL",
                "postgresql://postgres:secret@host.railway.internal:5432/railway"
        );
        RailwayDatabaseUrls.applyFromEnvironment();
        assertTrue(System.getProperty(RailwayDatabaseUrls.JDBC_URL_PROPERTY).startsWith("jdbc:"));
        assertEquals(
                "jdbc:postgresql://host.railway.internal:5432/railway?sslmode=require",
                System.getProperty("SPRING_DATASOURCE_URL")
        );
        assertEquals("postgres", System.getProperty(RailwayDatabaseUrls.JDBC_USER_PROPERTY));
        assertEquals("secret", System.getProperty(RailwayDatabaseUrls.JDBC_PASSWORD_PROPERTY));
    }
}
