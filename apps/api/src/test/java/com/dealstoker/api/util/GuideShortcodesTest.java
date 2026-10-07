package com.dealstoker.api.util;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class GuideShortcodesTest {

    @Test
    void productSlugsKeepsBodyOrderAndDeduplicates() {
        String body = """
                Intro

                {{product:cosori-air-fryer}}

                Then {{ Product: Ninja-AF101 }} inline and {{product:cosori-air-fryer}} again.
                """;
        String bodyKo = "{{product:ninja-af101}} {{product:instant-vortex}}";

        assertThat(GuideShortcodes.productSlugs(body, bodyKo))
                .containsExactly("cosori-air-fryer", "ninja-af101", "instant-vortex");
    }

    @Test
    void productSlugsIgnoresMissingBodiesAndMalformedCodes() {
        assertThat(GuideShortcodes.productSlugs(null, "{{product:}} {{product:-bad}} {{products:x}}"))
                .isEqualTo(List.of());
    }

    @Test
    void keepOnlyDropsUnknownAndRepeatedShortcodes() {
        String body = """
                Para one.

                {{product:cosori-air-fryer}}

                Para two.

                {{product:made-up-slug}}

                Para three.

                {{ product: COSORI-air-fryer }}

                {{product:ninja-af101}}
                """;
        String kept = GuideShortcodes.keepOnly(body, Set.of("cosori-air-fryer", "ninja-af101"));

        assertThat(kept).isEqualTo("""
                Para one.

                {{product:cosori-air-fryer}}

                Para two.

                Para three.

                {{product:ninja-af101}}""");
    }
}
