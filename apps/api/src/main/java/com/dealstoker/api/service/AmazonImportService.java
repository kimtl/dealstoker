package com.dealstoker.api.service;

import com.dealstoker.api.amazon.AmazonAsinParser;
import com.dealstoker.api.amazon.AmazonProductPageFetcher;
import com.dealstoker.api.amazon.AmazonProductPageFetcher.ScrapedProduct;
import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Product;
import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.ProductRepository;
import com.dealstoker.api.web.ApiExceptionHandler.ConflictException;
import com.dealstoker.api.web.dto.AmazonImportDtos.ImportRequest;
import com.dealstoker.api.web.dto.AmazonImportDtos.PreviewResponse;
import com.dealstoker.api.web.dto.ProductDtos.ProductDetail;
import com.dealstoker.api.web.dto.ProductDtos.ProductRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class AmazonImportService {

    private static final String SOURCE = "AMAZON";

    private final AmazonProductPageFetcher pageFetcher;
    private final ProductService productService;
    private final ProductRepository productRepository;
    private final DealStokerProperties properties;

    public AmazonImportService(
            AmazonProductPageFetcher pageFetcher,
            ProductService productService,
            ProductRepository productRepository,
            DealStokerProperties properties
    ) {
        this.pageFetcher = pageFetcher;
        this.productService = productService;
        this.productRepository = productRepository;
        this.properties = properties;
    }

    public PreviewResponse preview(String amazonUrl) {
        String asin = AmazonAsinParser.extract(amazonUrl)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Could not find an Amazon ASIN in that URL. Paste a /dp/ASIN product link or the ASIN itself."
                ));
        String marketplace = normalizeMarketplace(properties.amazon().marketplace());
        String canonical = AmazonAsinParser.canonicalProductUrl(asin);
        Optional<Product> existing = productRepository.findBySourceAndExternalIdAndMarketplace(
                SOURCE, asin, marketplace
        );

        ScrapedProduct scraped = pageFetcher.fetch(asin, canonical);
        String title = firstNonBlank(
                scraped.title(),
                AmazonAsinParser.titleHintFromUrl(amazonUrl).orElse(null),
                "Amazon product " + asin
        );

        String note = scraped.fetchNote();
        if (existing.isPresent()) {
            note = (note == null ? "" : note + " ")
                    + "A product with this ASIN already exists (id=" + existing.get().getId() + ").";
        }

        return new PreviewResponse(
                asin,
                canonical,
                title,
                scraped.imageUrl(),
                scraped.description(),
                scraped.brand(),
                scraped.priceAmount(),
                scraped.listPrice(),
                "USD",
                scraped.rating(),
                scraped.reviewCount(),
                scraped.features() == null ? List.of() : scraped.features(),
                marketplace,
                scraped.fetched(),
                note,
                existing.isPresent(),
                existing.map(Product::getId).orElse(null)
        );
    }

    @Transactional
    public ProductDetail importProduct(ImportRequest request) {
        PreviewResponse preview = preview(request.amazonUrl());
        if (preview.alreadyExists()) {
            throw new ConflictException(
                    "Product already exists for ASIN/marketplace (id=" + preview.existingProductId() + ")"
            );
        }

        String outbound = firstNonBlank(request.affiliateUrl(), preview.canonicalUrl());
        String title = firstNonBlank(request.titleOverride(), preview.title());

        ProductRequest body = new ProductRequest(
                preview.asin(),
                SOURCE,
                preview.marketplace(),
                title,
                null,
                preview.description(),
                preview.imageUrl(),
                preview.priceAmount(),
                preview.currency(),
                preview.listPrice(),
                "InStock",
                preview.rating(),
                preview.reviewCount(),
                outbound,
                preview.brand(),
                preview.features(),
                ProductStatus.DRAFT,
                title.length() > 60 ? title.substring(0, 60) : title,
                preview.description() != null && preview.description().length() > 155
                        ? preview.description().substring(0, 155)
                        : preview.description(),
                request.primaryCategoryId(),
                false,
                0
        );
        return productService.create(body);
    }

    private static String normalizeMarketplace(String marketplace) {
        if (marketplace == null || marketplace.isBlank()) {
            return "www.amazon.com";
        }
        return marketplace.trim().toLowerCase(Locale.ROOT);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
