package com.dealstoker.api.service;

import com.dealstoker.api.affiliate.AffiliateLinkBuilder;
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

import java.math.BigDecimal;
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
    private final AffiliateLinkBuilder affiliateLinkBuilder;

    public AmazonImportService(
            AmazonProductPageFetcher pageFetcher,
            ProductService productService,
            ProductRepository productRepository,
            DealStokerProperties properties,
            AffiliateLinkBuilder affiliateLinkBuilder
    ) {
        this.pageFetcher = pageFetcher;
        this.productService = productService;
        this.productRepository = productRepository;
        this.properties = properties;
        this.affiliateLinkBuilder = affiliateLinkBuilder;
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

        String outbound = affiliateLinkBuilder.buildOutboundUrl(
                firstNonBlank(request.affiliateUrl(), preview.canonicalUrl()),
                preview.asin()
        );
        String title = firstNonBlank(request.titleOverride(), preview.title());

        BigDecimal listPrice = preview.listPrice();
        if (listPrice != null && preview.priceAmount() != null
                && listPrice.compareTo(preview.priceAmount()) <= 0) {
            listPrice = null;
        }

        ProductRequest body = new ProductRequest(
                preview.asin(),
                SOURCE,
                preview.marketplace(),
                title,
                null,
                preview.description(),
                null,
                preview.imageUrl(),
                preview.priceAmount(),
                preview.currency(),
                listPrice,
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

    @Transactional
    public ProductDetail resyncPricing(Long productId) {
        Product product = productService.requireById(productId);
        String asin = product.getExternalId();
        if (asin == null || asin.isBlank()) {
            throw new IllegalArgumentException("Product has no ASIN/externalId to resync");
        }
        String canonical = AmazonAsinParser.canonicalProductUrl(asin.trim());
        ScrapedProduct scraped = pageFetcher.fetch(asin.trim(), canonical);
        if (!scraped.fetched() && scraped.priceAmount() == null && scraped.listPrice() == null) {
            throw new IllegalArgumentException(
                    scraped.fetchNote() == null
                            ? "Could not refresh prices from Amazon"
                            : scraped.fetchNote()
            );
        }

        if (scraped.priceAmount() != null) {
            product.setPriceAmount(scraped.priceAmount());
        }
        BigDecimal listPrice = scraped.listPrice();
        if (listPrice != null && product.getPriceAmount() != null
                && listPrice.compareTo(product.getPriceAmount()) <= 0) {
            listPrice = null;
        }
        if (scraped.listPrice() != null || scraped.priceAmount() != null) {
            product.setListPrice(listPrice);
        }
        if (scraped.rating() != null) {
            product.setRating(scraped.rating());
        }
        if (scraped.reviewCount() != null) {
            product.setReviewCount(scraped.reviewCount());
        }
        if (scraped.imageUrl() != null && !scraped.imageUrl().isBlank()) {
            product.setImageUrl(scraped.imageUrl());
        }
        product.setDetailPageUrl(affiliateLinkBuilder.buildOutboundUrl(
                product.getDetailPageUrl() == null || product.getDetailPageUrl().isBlank()
                        ? canonical
                        : product.getDetailPageUrl(),
                asin
        ));
        product.setLastSyncedAt(java.time.Instant.now());
        return ProductDetail.from(productRepository.save(product));
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
