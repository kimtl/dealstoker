package com.dealstoker.api;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.config.RailwayDatabaseUrls;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

@SpringBootApplication(
        exclude = {DataSourceAutoConfiguration.class},
        excludeName = {
                "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
                "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration"
        }
)
@EnableConfigurationProperties(DealStokerProperties.class)
public class ApiApplication {

    /** Printed first so Railway logs prove the new image is running. */
    public static final String BUILD_MARKER = "dealstoker-api-datasource-v4-20260902";

    public static void main(String[] args) {
        System.out.println("=== " + BUILD_MARKER + " starting ===");
        RailwayDatabaseUrls.applyFromEnvironment();
        SpringApplication.run(ApiApplication.class, args);
    }
}
