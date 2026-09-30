package com.dealstoker.api.web.dto;

import com.dealstoker.api.domain.Category;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class CategoryBuyingGuideDtoTest {

    @Test
    void mapsBuyingGuideOntoResponse() {
        Category category = new Category();
        category.setName("Electronics");
        category.setSlug("electronics");
        category.setBuyingGuide("Check battery life and compatibility first.");

        CategoryDtos.CategoryResponse response = CategoryDtos.CategoryResponse.from(category);
        assertEquals("Check battery life and compatibility first.", response.buyingGuide());
    }

    @Test
    void allowsNullBuyingGuide() {
        Category category = new Category();
        category.setName("Pets");
        category.setSlug("pets");

        CategoryDtos.CategoryResponse response = CategoryDtos.CategoryResponse.from(category);
        assertNull(response.buyingGuide());
    }
}
