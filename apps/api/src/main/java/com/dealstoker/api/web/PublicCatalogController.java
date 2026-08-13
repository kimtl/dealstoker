package com.dealstoker.api.web;

import com.dealstoker.api.service.CategoryService;
import com.dealstoker.api.service.ProductService;
import com.dealstoker.api.web.dto.CategoryDtos.CategoryResponse;
import com.dealstoker.api.web.dto.ProductDtos.PageResponse;
import com.dealstoker.api.web.dto.ProductDtos.ProductDetail;
import com.dealstoker.api.web.dto.ProductDtos.ProductSummary;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class PublicCatalogController {

    private final CategoryService categoryService;
    private final ProductService productService;

    public PublicCatalogController(CategoryService categoryService, ProductService productService) {
        this.categoryService = categoryService;
        this.productService = productService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "dealstoker-api");
    }

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return categoryService.listPublic();
    }

    @GetMapping("/categories/{slug}")
    public CategoryResponse category(@PathVariable String slug) {
        return categoryService.getBySlug(slug);
    }

    @GetMapping("/categories/{slug}/products")
    public PageResponse<ProductSummary> categoryProducts(
            @PathVariable String slug,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size
    ) {
        return productService.listPublished(slug, null, sort, page, Math.min(size, 100));
    }

    @GetMapping("/products")
    public PageResponse<ProductSummary> products(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size
    ) {
        return productService.listPublished(category, q, sort, page, Math.min(size, 100));
    }

    @GetMapping("/products/{slug}")
    public ProductDetail product(@PathVariable String slug) {
        return productService.getPublishedBySlug(slug);
    }

    @GetMapping("/products/{slug}/related")
    public List<ProductSummary> related(@PathVariable String slug) {
        return productService.related(slug);
    }

    @GetMapping("/home")
    public Map<String, Object> home() {
        return Map.of(
                "categories", categoryService.listPublic(),
                "featuredProducts", productService.latestPublished(8)
        );
    }
}
