import { resolveRecipeVisual } from "../../utils/recipeVisual";
import { getRecipeImagePlaceholder } from "../../data/recipeImageMap";

/**
 * Premium recipe visual: real photo when available, otherwise large food emoji stage.
 */
export default function RecipeVisual({
  recipe,
  englishName,
  imageUrl,
  emoji,
  alt = "",
  className = "",
  forceEmoji = false,
  preferCatalog,
  size = "md",
}) {
  const visual = resolveRecipeVisual(recipe || {}, {
    englishName,
    imageUrl,
    emoji,
    forceEmoji,
    preferCatalog,
    source: recipe?.source,
  });

  if (visual.kind === "image") {
    return (
      <div className={`np-recipe-visual np-recipe-visual--image ${className}`.trim()}>
        <img
          src={visual.src}
          alt={alt}
          className="np-recipe-visual-img"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            const el = event.currentTarget;
            if (el.dataset.fallback === "1") return;
            el.dataset.fallback = "1";
            el.src = getRecipeImagePlaceholder();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`np-recipe-visual np-recipe-visual--emoji np-recipe-visual--${size} ${className}`.trim()}
      role="img"
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <span className="np-recipe-visual-glow" aria-hidden />
      <span className="np-recipe-visual-emoji">{visual.emoji}</span>
    </div>
  );
}
