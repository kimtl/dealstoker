package com.dealstoker.api.amazon;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AmazonAsinParserTest {

    @Test
    void extractsFromDpUrl() {
        assertEquals(
                "B0D1XD1ZV3",
                AmazonAsinParser.extract("https://www.amazon.com/dp/B0D1XD1ZV3?th=1").orElseThrow()
        );
    }

    @Test
    void extractsFromPrettyUrl() {
        assertEquals(
                "B0H5BZF8NN",
                AmazonAsinParser.extract(
                        "https://www.amazon.com/DONAMA-Cervical-Pillow/dp/B0H5BZF8NN?ref=x"
                ).orElseThrow()
        );
    }

    @Test
    void extractsBareAsin() {
        assertEquals("B000123456", AmazonAsinParser.extract("b000123456").orElseThrow());
    }

    @Test
    void titleHintFromPrettyPath() {
        assertTrue(
                AmazonAsinParser.titleHintFromUrl(
                                "https://www.amazon.com/Ninja-Crispi-Portable/dp/B0D1XD1ZV3"
                        )
                        .orElseThrow()
                        .toLowerCase()
                        .contains("ninja")
        );
    }
}
