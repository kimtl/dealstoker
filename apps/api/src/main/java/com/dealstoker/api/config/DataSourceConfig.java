package com.dealstoker.api.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Sole {@link DataSource} for the app. Auto-config Hikari is excluded so a raw
 * Railway {@code postgres://} URL cannot blow up {@code DataSourceProperties}.
 */
@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Bean
    @Primary
    DataSource dataSource(Environment environment) {
        ParsedJdbc parsed = parse(
                firstNonBlank(
                        environment.getProperty(RailwayDatabaseUrls.JDBC_URL_PROPERTY),
                        environment.getProperty("spring.datasource.url"),
                        environment.getProperty("SPRING_DATASOURCE_URL"),
                        environment.getProperty("DATABASE_URL"),
                        environment.getProperty("DATABASE_PRIVATE_URL"),
                        environment.getProperty("JDBC_DATABASE_URL")
                ),
                firstNonBlank(
                        environment.getProperty(RailwayDatabaseUrls.JDBC_USER_PROPERTY),
                        environment.getProperty("spring.datasource.username"),
                        environment.getProperty("SPRING_DATASOURCE_USERNAME"),
                        environment.getProperty("DATABASE_USERNAME"),
                        environment.getProperty("PGUSER")
                ),
                firstNonBlank(
                        environment.getProperty(RailwayDatabaseUrls.JDBC_PASSWORD_PROPERTY),
                        environment.getProperty("spring.datasource.password"),
                        environment.getProperty("SPRING_DATASOURCE_PASSWORD"),
                        environment.getProperty("DATABASE_PASSWORD"),
                        environment.getProperty("PGPASSWORD")
                )
        );

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(parsed.url());
        if (StringUtils.hasText(parsed.username())) {
            dataSource.setUsername(parsed.username());
        }
        if (parsed.password() != null) {
            dataSource.setPassword(parsed.password());
        }
        log.info("Using JDBC datasource (jdbcUrlStartsWithJdbc={})", parsed.url().startsWith("jdbc:"));
        return dataSource;
    }

    static ParsedJdbc parse(String rawUrl, String username, String password) {
        if (!StringUtils.hasText(rawUrl)) {
            throw new IllegalStateException(
                    "DATABASE_URL / SPRING_DATASOURCE_URL / dealstoker.jdbc-url is required"
            );
        }
        String url = rawUrl.trim();
        String user = username;
        String pass = password;

        if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            try {
                String normalized = url.replaceFirst("^postgres(ql)?://", "http://");
                URI uri = URI.create(normalized);
                if (uri.getUserInfo() != null && !uri.getUserInfo().isBlank()) {
                    String[] parts = uri.getUserInfo().split(":", 2);
                    if (!StringUtils.hasText(user)) {
                        user = decode(parts[0]);
                    }
                    if (parts.length > 1 && !StringUtils.hasText(pass)) {
                        pass = decode(parts[1]);
                    }
                }
                String path = uri.getPath() == null ? "" : uri.getPath();
                String database = path.startsWith("/") ? path.substring(1) : path;
                if (database.contains("?")) {
                    database = database.substring(0, database.indexOf('?'));
                }
                if (!StringUtils.hasText(database)) {
                    database = "railway";
                }
                String query = uri.getQuery();
                StringBuilder jdbc = new StringBuilder("jdbc:postgresql://")
                        .append(uri.getHost())
                        .append(":")
                        .append(uri.getPort() > 0 ? uri.getPort() : 5432)
                        .append("/")
                        .append(database);
                if (!StringUtils.hasText(query)) {
                    jdbc.append("?sslmode=require");
                } else {
                    jdbc.append("?").append(query);
                    if (!query.contains("sslmode=")) {
                        jdbc.append("&sslmode=require");
                    }
                }
                url = jdbc.toString();
            } catch (RuntimeException ex) {
                throw new IllegalStateException(
                        "Failed to convert DATABASE_URL to JDBC format: " + ex.getMessage(),
                        ex
                );
            }
        }

        if (!url.startsWith("jdbc:")) {
            throw new IllegalStateException(
                    "Datasource URL must start with jdbc: (got scheme from: "
                            + url.substring(0, Math.min(url.length(), 32)) + "…)"
            );
        }
        return new ParsedJdbc(url, user, pass);
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    record ParsedJdbc(String url, String username, String password) {}
}
