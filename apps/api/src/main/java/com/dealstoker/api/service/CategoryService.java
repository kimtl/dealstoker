package com.dealstoker.api.service;

import com.dealstoker.api.domain.Category;
import com.dealstoker.api.repository.CategoryRepository;
import com.dealstoker.api.util.Slugify;
import com.dealstoker.api.web.ApiExceptionHandler.ConflictException;
import com.dealstoker.api.web.ApiExceptionHandler.NotFoundException;
import com.dealstoker.api.web.dto.CategoryDtos.CategoryRequest;
import com.dealstoker.api.web.dto.CategoryDtos.CategoryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listPublic() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listAdmin() {
        return categoryRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getBySlug(String slug) {
        return CategoryResponse.from(requireBySlug(slug));
    }

    @Transactional(readOnly = true)
    public Category requireBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Category not found: " + slug));
    }

    @Transactional(readOnly = true)
    public Category requireById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found: " + id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        Category category = new Category();
        apply(category, request, true);
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = requireById(id);
        apply(category, request, false);
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("Category not found: " + id);
        }
        categoryRepository.deleteById(id);
    }

    private void apply(Category category, CategoryRequest request, boolean creating) {
        String slug = (request.slug() == null || request.slug().isBlank())
                ? Slugify.slugify(request.name())
                : Slugify.slugify(request.slug());

        if (creating) {
            if (categoryRepository.existsBySlug(slug)) {
                throw new ConflictException("Category slug already exists: " + slug);
            }
        } else if (categoryRepository.existsBySlugAndIdNot(slug, category.getId())) {
            throw new ConflictException("Category slug already exists: " + slug);
        }

        if (request.parentId() != null) {
            category.setParent(requireById(request.parentId()));
        } else {
            category.setParent(null);
        }

        category.setName(request.name().trim());
        category.setSlug(slug);
        category.setDescription(request.description());
        category.setSeoTitle(request.seoTitle());
        category.setSeoDescription(request.seoDescription());
        category.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        category.setActive(request.active() == null || request.active());
    }
}
