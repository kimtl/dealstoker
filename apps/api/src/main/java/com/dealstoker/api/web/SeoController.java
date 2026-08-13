package com.dealstoker.api.web;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.CategoryRepository;
import com.dealstoker.api.repository.ProductRepository;
import com.dealstoker.api.service.ProductService;
import com.dealstoker.api.web.dto.ProductDtos.ProductSummary;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
public class SeoController {

    private final DealStokerProperties properties;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    public SeoController(
            DealStokerProperties properties,
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            ProductService productService
    ) {
        this.properties = properties;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.productService = productService;
    }

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String robots() {
        String base = trimSlash(properties.appBaseUrl());
        return """
                User-agent: *
                Allow: /
                Disallow: /admin
                Disallow: /api/v1/admin

                Sitemap: %s/sitemap.xml
                """.formatted(base);
    }

    @GetMapping(value = {"/sitemap.xml", "/api/v1/sitemap.xml"}, produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        String base = trimSlash(properties.appBaseUrl());
        StringBuilder xml = new StringBuilder();
        xml.append("""
                <?xml version="1.0" encoding="UTF-8"?>
                <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                """);
        addUrl(xml, base + "/", null);
        addUrl(xml, base + "/about", null);
        addUrl(xml, base + "/disclosure", null);
        addUrl(xml, base + "/privacy", null);
        addUrl(xml, base + "/contact", null);

        categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc().forEach(category ->
                addUrl(xml, base + "/c/" + category.getSlug(),
                        category.getUpdatedAt() != null
                                ? DateTimeFormatter.ISO_LOCAL_DATE.format(category.getUpdatedAt().atZone(ZoneOffset.UTC))
                                : null));

        productRepository.findByStatus(ProductStatus.PUBLISHED, PageRequest.of(0, 5000))
                .forEach(product -> addUrl(
                        xml,
                        base + "/p/" + product.getSlug(),
                        product.getUpdatedAt() != null
                                ? DateTimeFormatter.ISO_LOCAL_DATE.format(product.getUpdatedAt().atZone(ZoneOffset.UTC))
                                : null
                ));

        xml.append("</urlset>");
        return xml.toString();
    }

    @GetMapping("/api/v1/seo/summary")
    public Object seoSummary() {
        List<ProductSummary> latest = productService.latestPublished(5);
        return java.util.Map.of(
                "publishedProducts", productService.countPublished(),
                "activeCategories", categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc().size(),
                "latest", latest
        );
    }

    private void addUrl(StringBuilder xml, String loc, String lastmod) {
        xml.append("<url><loc>").append(escape(loc)).append("</loc>");
        if (lastmod != null) {
            xml.append("<lastmod>").append(lastmod).append("</lastmod>");
        }
        xml.append("</url>\n");
    }

    private String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String trimSlash(String value) {
        if (value == null || value.isBlank()) {
            return "https://dealstoker.com";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
