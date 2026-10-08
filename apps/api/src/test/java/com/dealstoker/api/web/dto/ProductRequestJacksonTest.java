package com.dealstoker.api.web.dto;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

@JsonTest
class ProductRequestJacksonTest {

    @Autowired
    private JacksonTester<ProductDtos.ProductRequest> json;

    @Autowired
    private JsonMapper jsonMapper;

    @Test
    void deserializesRecommendationField() throws Exception {
        String payload = """
                {
                  "externalId": "B0001",
                  "source": "AMAZON",
                  "marketplace": "www.amazon.com",
                  "title": "Test Product",
                  "slug": "test-product",
                  "description": "amazon desc",
                  "recommendation": "We recommend this because reviewers like it.",
                  "imageUrl": "https://example.com/x.jpg",
                  "priceAmount": 19.99,
                  "currency": "USD",
                  "listPrice": 29.99,
                  "availability": "InStock",
                  "rating": 4.5,
                  "reviewCount": 100,
                  "detailPageUrl": "https://www.amazon.com/dp/B0001",
                  "brand": "Acme",
                  "features": ["a", "b"],
                  "status": "DRAFT",
                  "seoTitle": "seo",
                  "seoDescription": "seo desc",
                  "primaryCategoryId": 1,
                  "featured": false,
                  "featuredRank": 0
                }
                """;

        ProductDtos.ProductRequest request = json.parseObject(payload);
        assertThat(request.recommendation())
                .isEqualTo("We recommend this because reviewers like it.");
        assertThat(request.description()).isEqualTo("amazon desc");
    }

    @Test
    void serializesRecommendationOnDetail() {
        ProductDtos.ProductDetail detail = new ProductDtos.ProductDetail(
                1L,
                "AMAZON",
                "B0001",
                "www.amazon.com",
                "Test",
                "test",
                "desc",
                "why buy",
                null,
                null,
                "USD",
                null,
                null,
                null,
                null,
                "https://amazon.com/dp/B0001",
                null,
                java.util.List.of(),
                com.dealstoker.api.domain.ProductStatus.DRAFT,
                null,
                null,
                1L,
                null,
                null,
                null,
                null,
                null,
                false,
                0,
                null
        );
        String out = jsonMapper.writeValueAsString(detail);
        assertThat(out).contains("\"recommendation\":\"why buy\"");
    }
}
