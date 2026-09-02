package com.dealstoker.api.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Converts Railway/Heroku-style {@code postgres(ql)://} URLs into JDBC form
 * before the Spring context starts. System properties outrank OS env vars, so
 * {@code ${DATABASE_URL}} in application.yml resolves to a jdbc: URL.
 */
public final class RailwayDatabaseUrls {

    private RailwayDatabaseUrls() {}

    public static void applyFromEnvironment() {
        String raw = firstNonBlank(
                System.getProperty("DATABASE_URL"),
                System.getenv("DATABASE_URL"),
                System.getenv("DATABASE_PRIVATE_URL")
        );
        if (raw == null || raw.isBlank() || raw.startsWith("jdbc:")) {
            return;
        }
        if (!(raw.startsWith("postgres://") || raw.startsWith("postgresql://"))) {
            return;
        }

        Parsed parsed = parse(raw);
        System.setProperty("DATABASE_URL", parsed.jdbcUrl());
        System.setProperty("spring.datasource.url", parsed.jdbcUrl());
        if (parsed.username() != null) {
            System.setProperty("DATABASE_USERNAME", parsed.username());
            System.setProperty("spring.datasource.username", parsed.username());
        }
        if (parsed.password() != null) {
            System.setProperty("DATABASE_PASSWORD", parsed.password());
            System.setProperty("spring.datasource.password", parsed.password());
        }
        System.out.println("Converted DATABASE_URL to JDBC before Spring Boot start");
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
