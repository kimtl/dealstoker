package com.dealstoker.api.config;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Railway (and many PaaS hosts) inject {@code DATABASE_URL} as
 * {@code postgresql://user:pass@host:port/db}. Spring Boot expects a JDBC URL.
 * This post-processor rewrites it before the datasource is created.
 */
public class RailwayDatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String raw = environment.getProperty("DATABASE_URL");
        if (raw == null || raw.isBlank()) {
            return;
        }
        if (raw.startsWith("jdbc:")) {
            return;
        }
        if (!(raw.startsWith("postgresql://") || raw.startsWith("postgres://"))) {
            return;
        }

        try {
            String normalized = raw.replaceFirst("^postgres(ql)?://", "http://");
            URI uri = URI.create(normalized);
            String userInfo = uri.getUserInfo();
            String username = null;
            String password = null;
            if (userInfo != null && !userInfo.isBlank()) {
                String[] parts = userInfo.split(":", 2);
                username = decode(parts[0]);
                if (parts.length > 1) {
                    password = decode(parts[1]);
                }
            }

            String path = uri.getPath() == null ? "" : uri.getPath();
            String database = path.startsWith("/") ? path.substring(1) : path;
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

            Map<String, Object> props = new HashMap<>();
            props.put("DATABASE_URL", jdbc.toString());
            props.put("spring.datasource.url", jdbc.toString());
            if (username != null) {
                props.put("DATABASE_USERNAME", username);
                props.put("spring.datasource.username", username);
            }
            if (password != null) {
                props.put("DATABASE_PASSWORD", password);
                props.put("spring.datasource.password", password);
            }

            environment.getPropertySources().addFirst(new MapPropertySource("railwayDatabaseUrl", props));
        } catch (Exception ignored) {
            // Leave original env untouched; Spring will fail with a clear datasource error.
        }
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
