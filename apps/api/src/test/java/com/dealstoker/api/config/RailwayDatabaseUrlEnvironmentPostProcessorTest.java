package com.dealstoker.api.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RailwayDatabaseUrlEnvironmentPostProcessorTest {

    private final RailwayDatabaseUrlEnvironmentPostProcessor processor =
            new RailwayDatabaseUrlEnvironmentPostProcessor();

    @Test
    void convertsRailwayStyleUrlToJdbc() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "postgresql://postgres:s3cret@postgres.railway.internal:5432/railway");

        processor.postProcessEnvironment(env, new SpringApplication());

        assertEquals(
                "jdbc:postgresql://postgres.railway.internal:5432/railway?sslmode=require",
                env.getProperty("DATABASE_URL")
        );
        assertEquals("postgres", env.getProperty("DATABASE_USERNAME"));
        assertEquals("s3cret", env.getProperty("DATABASE_PASSWORD"));
        assertEquals(
                "jdbc:postgresql://postgres.railway.internal:5432/railway?sslmode=require",
                env.getProperty("spring.datasource.url")
        );
    }

    @Test
    void leavesJdbcUrlUntouched() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "jdbc:postgresql://localhost:5432/dealstoker");

        processor.postProcessEnvironment(env, new SpringApplication());

        assertEquals("jdbc:postgresql://localhost:5432/dealstoker", env.getProperty("DATABASE_URL"));
        assertNull(env.getProperty("DATABASE_USERNAME"));
    }
}
