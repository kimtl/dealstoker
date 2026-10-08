package com.dealstoker.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Turns on @Scheduled jobs (daily price refresh). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
