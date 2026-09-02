package com.dealstoker.api.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Converts Railway/Heroku-style {@code postgres(ql)://} URLs into JDBC form
 * before the Spring context starts.
 *
 * <p>Railway may expose the same non-JDBC URL via several env vars
 * ({@code DATABASE_URL}, {@code SPRING_DATASOURCE_URL}, …). All of them are
 * rewritten, and {@code dealstoker.jdbc-*} system properties are set as the
 * single source of truth for {@code DataSourceConfig}.
 */
public final class RailwayDatabaseUrls {

    public static final String JDBC_URL_PROPERTY = "dealstoker.jdbc-url";
    public static final String JDBC_USER_PROPERTY = "dealstoker.jdbc-username";
    public static final String JDBC_PASSWORD_PROPERTY = "dealstoker.jdbc-password";

    private RailwayDatabaseUrls() {}

    public static void applyFromEnvironment() {
        Map<String, String> candidates = new LinkedHashMap<>();
        putCandidate(candidates, "SPRING_DATASOURCE_URL");
        putCandidate(candidates, "DATABASE_URL");
        putCandidate(candidates, "DATABASE_PRIVATE_URL");
        putCandidate(candidates, "DATABASE_PUBLIC_URL");
        putCandidate(candidates, "JDBC_DATABASE_URL");

        String raw = null;
        for (String value : candidates.values()) {
            if (value != null && !value.isBlank()) {
                raw = value;
                break;
            }
        }
        if (raw == null || raw.isBlank()) {
            System.out.println("No DATABASE_URL / SPRING_DATASOURCE_URL found to convert");
            return;
        }

        Parsed parsed;
        if (raw.startsWith("jdbc:")) {
            parsed = new Parsed(
                    raw,
                    firstNonBlank(
                            System.getProperty("SPRING_DATASOURCE_USERNAME"),
                            System.getenv("SPRING_DATASOURCE_USERNAME"),
                            System.getProperty("DATABASE_USERNAME"),
                            System.getenv("DATABASE_USERNAME"),
                            System.getenv("PGUSER")
                    ),
                    firstNonBlank(
                            System.getProperty("SPRING_DATASOURCE_PASSWORD"),
                            System.getenv("SPRING_DATASOURCE_PASSWORD"),
                            System.getProperty("DATABASE_PASSWORD"),
                            System.getenv("DATABASE_PASSWORD"),
                            System.getenv("PGPASSWORD")
                    )
            );
        } else if (raw.startsWith("postgres://") || raw.startsWith("postgresql://")) {
            parsed = parse(raw);
            System.out.println("Converted postgres URL to JDBC before Spring Boot start");
        } else {
            System.err.println("Unrecognized database URL scheme; leaving unchanged");
            return;
        }

        // Single source of truth used by DataSourceConfig / application.yml
        System.setProperty(JDBC_URL_PROPERTY, parsed.jdbcUrl());
        if (parsed.username() != null) {
            System.setProperty(JDBC_USER_PROPERTY, parsed.username());
        }
        if (parsed.password() != null) {
            System.setProperty(JDBC_PASSWORD_PROPERTY, parsed.password());
        }

        // Override every common Spring / Railway key so auto-config cannot see postgres://
        setAll("DATABASE_URL", parsed.jdbcUrl());
        setAll("SPRING_DATASOURCE_URL", parsed.jdbcUrl());
        setAll("JDBC_DATABASE_URL", parsed.jdbcUrl());
        setAll("spring.datasource.url", parsed.jdbcUrl());
        if (parsed.username() != null) {
            setAll("DATABASE_USERNAME", parsed.username());
            setAll("SPRING_DATASOURCE_USERNAME", parsed.username());
            setAll("spring.datasource.username", parsed.username());
        }
        if (parsed.password() != null) {
            setAll("DATABASE_PASSWORD", parsed.password());
            setAll("SPRING_DATASOURCE_PASSWORD", parsed.password());
            setAll("spring.datasource.password", parsed.password());
        }
    }

    private static void putCandidate(Map<String, String> candidates, String key) {
        String fromProp = System.getProperty(key);
        if (fromProp != null && !fromProp.isBlank()) {
            candidates.put(key, fromProp);
            return;
        }
        String fromEnv = System.getenv(key);
        if (fromEnv != null && !fromEnv.isBlank()) {
            candidates.put(key, fromEnv);
        }
    }

    private static void setAll(String key, String value) {
        System.setProperty(key, value);
    }

    static Parsed parse(String raw) {
        String normalized = raw.trim().replaceFirst("^postgres(ql)?://", "http://");
        URI uri = URI.create(normalized);
        String username = null;
        String password = null;
        if (uri.getUserInfo() != null && !uri.getUserInfo().isBlank()) {
            String[] parts = uri.getUserInfo().split(":", 2);
            username = decode(parts[0]);
            if (parts.length > 1) {
                password = decode(parts[1]);
            }
        }
        String path = uri.getPath() == null ? "" : uri.getPath();
        String database = path.startsWith("/") ? path.substring(1) : path;
        if (database.contains("?")) {
            database = database.substring(0, database.indexOf('?'));
        }
        if (database.isBlank()) {
            database = "railway";
        }
        String query = uri.getQuery();
        StringBuilder jdbc = new StringBuilder("jdbc:postgresql://")
                .append(uri.getHost())
                .append(":")
                .append(uri.getPort() > 0 ? uri.getPort() : 5432)
                .append("/")
                .append(database);
        if (query == null || query.isBlank()) {
            jdbc.append("?sslmode=require");
        } else {
            jdbc.append("?").append(query);
            if (!query.contains("sslmode=")) {
                jdbc.append("&sslmode=require");
            }
        }
        return new Parsed(jdbc.toString(), username, password);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    record Parsed(String jdbcUrl, String username, String password) {}
}
