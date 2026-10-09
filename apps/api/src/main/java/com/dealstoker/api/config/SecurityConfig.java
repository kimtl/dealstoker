package com.dealstoker.api.config;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
    /** Matches the fallback in application.yml; only acceptable for local development. */
    static final String DEFAULT_ADMIN_PASSWORD = "changeme";

    private final DealStokerProperties properties;

    public SecurityConfig(DealStokerProperties properties) {
        this.properties = properties;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Boot's /error forwards on the ERROR dispatch; without this an
                        // anonymous 400/404/500 would be rewritten into a 401 by the entry point.
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers(
                                "/robots.txt",
                                "/sitemap.xml",
                                "/api/v1/sitemap.xml",
                                "/go/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/analytics/**", "/api/v1/catalog/views",
                                "/api/v1/newsletter/subscribe", "/api/v1/newsletter/confirm",
                                "/api/v1/newsletter/unsubscribe").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/**").permitAll()
                        .anyRequest().authenticated()
                )
                // JSON 401 without WWW-Authenticate — avoids browser Basic-auth dialogs
                // that surface as TypeError: Failed to fetch in admin fetch().
                .httpBasic(basic -> basic.authenticationEntryPoint(jsonBasicEntryPoint()));
        return http.build();
    }

    @Bean
    AuthenticationEntryPoint jsonBasicEntryPoint() {
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"unauthorized\"}");
        };
    }

    @Bean
    UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        if (DEFAULT_ADMIN_PASSWORD.equals(properties.admin().password())) {
            log.warn("ADMIN_PASSWORD is the default '{}'. Set ADMIN_USERNAME/ADMIN_PASSWORD before exposing "
                    + "/api/v1/admin/** publicly.", DEFAULT_ADMIN_PASSWORD);
        }
        return new InMemoryUserDetailsManager(
                User.withUsername(properties.admin().username())
                        .password(passwordEncoder.encode(properties.admin().password()))
                        .roles("ADMIN")
                        .build()
        );
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.stream(properties.cors().allowedOrigins().split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
