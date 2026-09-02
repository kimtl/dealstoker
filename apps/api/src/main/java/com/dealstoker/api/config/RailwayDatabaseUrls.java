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
 * <p>Every known Railway/Spring URL env var is rewritten. System properties
 * outrank OS env, so Boot cannot bind a raw {@code postgres://} value.
 */
public final class RailwayDatabaseUrls {

    public static final String JDBC_URL_PROPERTY = "dealstoker.jdbc-url";
    public static final String JDBC_USER_PROPERTY = "dealstoker.jdbc-username";
    public static final String JDBC_PASSWORD_PROPERTY = "dealstoker.jdbc-password";

    private static final String[] URL_KEYS = {
            "SPRING_DATASOURCE_URL",
            "DATABASE_URL",
            "DATABASE_PRIVATE_URL",
            "DATABASE_PUBLIC_URL",
            "JDBC_DATABASE_URL",
            "spring.datasource.url"
    };

    private RailwayDatabaseUrls() {}

    public static void applyFromEnvironment() {
        Map<String, String> found = new LinkedHashMap<>();
        for (String key : URL_KEYS) {
            String value = read(key);
            if (value != null && !value.isBlank()) {
                found.put(key, value.trim());
            }
        }

        if (found.isEmpty()) {
            System.out.println("[" + marker() + "] No database URL env vars found");
            return;
        }

        System.out.println("[" + marker() + "] Database URL keys present: " + found.keySet());

        Parsed chosen = null;
        for (Map.Entry<String, String> entry : found.entrySet()) {
            String raw = entry.getValue();
            Parsed parsed;
            if (raw.startsWith("jdbc:")) {
                parsed = jdbcPassthrough(raw);
            } else if (raw.startsWith("postgres://") || raw.startsWith("postgresql://")) {
                parsed = parse(raw);
                System.out.println("[" + marker() + "] Converted " + entry.getKey() + " postgres:// → jdbc:");
            } else {
                System.err.println("[" + marker() + "] Unrecognized URL for " + entry.getKey());
                continue;
            }
            // Always overwrite every key with the JDBC form of this candidate
            writeJdbc(parsed);
            if (chosen == null) {
                chosen = parsed;
            }
        }

        if (chosen == null) {
            System.err.println("[" + marker() + "] Failed to derive a JDBC URL");
            return;
        }

        System.setProperty(JDBC_URL_PROPERTY, chosen.jdbcUrl());
        if (chosen.username() != null) {
            System.setProperty(JDBC_USER_PROPERTY, chosen.username());
        }
        if (chosen.password() != null) {
            System.setProperty(JDBC_PASSWORD_PROPERTY, chosen.password());
        }
        System.out.println("[" + marker() + "] dealstoker.jdbc-url ready (jdbc="
                + chosen.jdbcUrl().startsWith("jdbc:") + ")");
    }

    private static void writeJdbc(Parsed parsed) {
        for (String key : URL_KEYS) {
            System.setProperty(key, parsed.jdbcUrl());
        }
        if (parsed.username() != null) {
            System.setProperty("DATABASE_USERNAME", parsed.username());
            System.setProperty("SPRING_DATASOURCE_USERNAME", parsed.username());
            System.setProperty("spring.datasource.username", parsed.username());
        }
        if (parsed.password() != null) {
            System.setProperty("DATABASE_PASSWORD", parsed.password());
            System.setProperty("SPRING_DATASOURCE_PASSWORD", parsed.password());
            System.setProperty("spring.datasource.password", parsed.password());
        }
    }

    private static Parsed jdbcPassthrough(String raw) {
        return new Parsed(
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
    }

    private static String read(String key) {
        String fromProp = System.getProperty(key);
        if (fromProp != null && !fromProp.isBlank()) {
            return fromProp;
        }
        return System.getenv(key);
    }

    private static String marker() {
        return "dealstoker-jdbc";
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
