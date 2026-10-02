package com.dealstoker.api.web.dto;

import com.dealstoker.api.domain.ProductStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@JsonTest
class ProductDetailNullSerializationTest {

    @Autowired
    private JsonMapper jsonMapper;

    @Test
    void nullRecommendationSerialization() {
        ProductDtos.ProductDetail detail = new ProductDtos.ProductDetail(
                1L, "AMAZON", "B0001", "www.amazon.com", "Test", "test",
                "desc", null, null, null, "USD", null, null, null, null,
                "https://amazon.com/dp/B0001", null, List.of(), ProductStatus.DRAFT,
                null, null, 1L, null, null, null, null, null, false, 0
        );
        String out = jsonMapper.writeValueAsString(detail);
        System.out.println(out);
        assertThat(out).contains("recommendation");
    }
}
