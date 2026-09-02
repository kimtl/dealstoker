package com.dealstoker.api;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.config.RailwayDatabaseUrls;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
@EnableConfigurationProperties(DealStokerProperties.class)
public class ApiApplication {

    public static void main(String[] args) {
        // Must run before Spring binds datasource properties from Railway env.
        RailwayDatabaseUrls.applyFromEnvironment();
        SpringApplication.run(ApiApplication.class, args);
    }
}
