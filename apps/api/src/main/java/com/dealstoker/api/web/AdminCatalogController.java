package com.dealstoker.api.web;

import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.service.AmazonImportService;
import com.dealstoker.api.service.CategoryService;
import com.dealstoker.api.service.ProductService;
import com.dealstoker.api.web.dto.AmazonImportDtos.ImportRequest;
import com.dealstoker.api.web.dto.AmazonImportDtos.PreviewRequest;
import com.dealstoker.api.web.dto.AmazonImportDtos.PreviewResponse;
import com.dealstoker.api.web.dto.CategoryDtos.CategoryRequest;
import com.dealstoker.api.web.dto.CategoryDtos.CategoryResponse;
import com.dealstoker.api.web.dto.ProductDtos.FeatureRequest;
import com.dealstoker.api.web.dto.ProductDtos.PageResponse;
import com.dealstoker.api.web.dto.ProductDtos.ProductDetail;
import com.dealstoker.api.web.dto.ProductDtos.ProductRequest;
import com.dealstoker.api.web.dto.ProductDtos.ProductSummary;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminCatalogController {

    private final CategoryService categoryService;
    private final ProductService productService;
    private final AmazonImportService amazonImportService;

    public AdminCatalogController(
            CategoryService categoryService,
            ProductService productService,
            AmazonImportService amazonImportService
    ) {
        this.categoryService = categoryService;
        this.productService = productService;
        this.amazonImportService = amazonImportService;
    }

    @GetMapping("/me")
    public Map<String, String> me() {
        return Map.of("role", "ADMIN");
    }

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return categoryService.listAdmin();
    }

    @PostMapping("/categories")
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
        return categoryService.create(request);
    }

    @PutMapping("/categories/{id}")
    public CategoryResponse updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(id, request);
    }

    @DeleteMapping("/categories/{id}")
    public Map<String, Boolean> deleteCategory(@PathVariable Long id) {
        categoryService.delete(id);
        return Map.of("deleted", true);
    }

    @GetMapping("/products")
    public PageResponse<ProductSummary> products(
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return productService.listAdmin(status, page, Math.min(size, 100));
    }

    @GetMapping("/products/{id}")
    public ProductDetail product(@PathVariable Long id) {
        return productService.getAdminById(id);
    }

    @PostMapping("/products")
    public ProductDetail createProduct(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PostMapping("/products/import/preview")
    public PreviewResponse previewAmazonImport(@Valid @RequestBody PreviewRequest request) {
        return amazonImportService.preview(request.amazonUrl());
    }

    @PostMapping("/products/import")
    public ProductDetail importAmazonProduct(@Valid @RequestBody ImportRequest request) {
        return amazonImportService.importProduct(request);
    }

    @PutMapping("/products/{id}")
    public ProductDetail updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @PostMapping("/products/{id}/publish")
    public ProductDetail publish(@PathVariable Long id) {
        return productService.publish(id);
    }

    @PostMapping("/products/{id}/unpublish")
    public ProductDetail unpublish(@PathVariable Long id) {
        return productService.unpublish(id);
    }

    @PostMapping("/products/{id}/feature")
    public ProductDetail feature(@PathVariable Long id, @RequestBody(required = false) FeatureRequest request) {
        FeatureRequest body = request != null ? request : new FeatureRequest(true, null);
        if (body.featured() == null) {
            body = new FeatureRequest(true, body.featuredRank());
        }
        return productService.updateFeatured(id, body);
    }

    @DeleteMapping("/products/{id}")
    public Map<String, Boolean> deleteProduct(@PathVariable Long id) {
        productService.delete(id);
        return Map.of("deleted", true);
    }
}
