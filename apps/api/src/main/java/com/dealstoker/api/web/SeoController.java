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

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
public class SeoController {

    private static final DateTimeFormatter LASTMOD =
            DateTimeFormatter.ISO_LOCAL_DATE.withZone(ZoneOffset.UTC);

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
                <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
                """);
        addUrl(xml, base + "/", Instant.now(), "daily", "1.0", null, null);
        addUrl(xml, base + "/about", null, "monthly", "0.4", null, null);
        addUrl(xml, base + "/disclosure", null, "monthly", "0.4", null, null);
        addUrl(xml, base + "/privacy", null, "monthly", "0.4", null, null);
        addUrl(xml, base + "/contact", null, "monthly", "0.4", null, null);

        categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc().forEach(category ->
                addUrl(
                        xml,
                        base + "/c/" + category.getSlug(),
                        category.getUpdatedAt(),
                        "daily",
                        "0.8",
                        null,
                        null
                ));

        productRepository.findByStatus(ProductStatus.PUBLISHED, PageRequest.of(0, 5000))
                .forEach(product -> addUrl(
                        xml,
                        base + "/p/" + product.getSlug(),
                        product.getUpdatedAt() != null ? product.getUpdatedAt() : product.getPublishedAt(),
                        "daily",
                        product.isFeatured() ? "0.85" : "0.7",
                        product.getImageUrl(),
                        product.getTitle()
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

    private void addUrl(
            StringBuilder xml,
            String loc,
            Instant lastmod,
            String changeFreq,
            String priority,
            String imageUrl,
            String imageTitle
    ) {
        xml.append("<url><loc>").append(escape(loc)).append("</loc>");
        if (lastmod != null) {
            xml.append("<lastmod>").append(LASTMOD.format(lastmod)).append("</lastmod>");
        }
        if (changeFreq != null) {
            xml.append("<changefreq>").append(changeFreq).append("</changefreq>");
        }
        if (priority != null) {
            xml.append("<priority>").append(priority).append("</priority>");
        }
        if (imageUrl != null && !imageUrl.isBlank()) {
            xml.append("<image:image><image:loc>").append(escape(imageUrl)).append("</image:loc>");
            if (imageTitle != null && !imageTitle.isBlank()) {
                xml.append("<image:title>").append(escape(imageTitle)).append("</image:title>");
            }
            xml.append("</image:image>");
        }
        xml.append("</url>\n");
    }

    private String escape(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private String trimSlash(String value) {
        if (value == null || value.isBlank()) {
            return "https://dealstoker.com";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
