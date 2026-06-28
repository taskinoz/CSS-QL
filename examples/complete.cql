-- CSS-QL can describe ordinary rules and modern CSS without abandoning the bit.
AT LAYER %base, components% {
  SET --brand = "oklch(62% 0.2 275)", color-scheme = "light dark" WHERE ROOT LIKE %root%;

  SET box-sizing = "border-box" WHERE SELECTOR LIKE %*, *::before, *::after%;

  SET display = "grid", gap = "1rem", padding = "1rem"
    WHERE CLASSNAME LIKE %card-grid% {
      SET translate = "0 -0.125rem" WHERE SELECTOR LIKE %& > .card:hover%;
    }
}

AT MEDIA %(width >= 48rem)% {
  SET grid-template-columns = %repeat(3, minmax(0, 1fr))%
    WHERE CLASSNAME LIKE %card-grid%;
}

AT KEYFRAMES %enter% {
  SET opacity = "0", transform = "translateY(0.5rem)" WHERE SELECTOR LIKE %from%;
  SET opacity = "1", transform = "none" WHERE SELECTOR LIKE %to%;
}
