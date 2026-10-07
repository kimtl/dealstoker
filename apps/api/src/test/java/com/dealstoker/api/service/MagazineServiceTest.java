package com.dealstoker.api.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MagazineServiceTest {

    @Test
    void productSlugsKeepsBodyOrderAndDeduplicates() {
        String body = """
                Intro

                {{product:cosori-air-fryer}}

                Then {{ Product: Ninja-AF101 }} inline and {{product:cosori-air-fryer}} again.
                """;
        String bodyKo = "{{product:ninja-af101}} {{product:instant-vortex}}";

        assertThat(MagazineService.productSlugs(body, bodyKo))
                .containsExactly("cosori-air-fryer", "ninja-af101", "instant-vortex");
    }

    @Test
    void productSlugsIgnoresMissingBodiesAndMalformedCodes() {
        assertThat(MagazineService.productSlugs(null, "{{product:}} {{product:-bad}} {{products:x}}"))
                .isEqualTo(List.of());
    }
}
